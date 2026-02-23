import type { FastifyReply, FastifyRequest } from 'fastify';

import { LocationTagsRepository } from '../../warehouse/location-tags/repository.js';
import { SkusRepository } from './repository.js';
import { SkuMovementsRepository } from '../sku-movements/repository.js';
import type { CreateSkuInput, MoveSkuInput, SkuQueryInput, UpdateSkuInput } from './schemas.js';
import {
  emitLocationUpdated,
  emitInventoryChanged,
} from '../../../realtime/handlers/sku-events.js';
import { LiveMapRepository } from '../../warehouse/live-map/repository.js';
import { LiveMapWebSocketService } from '../../warehouse/live-map/websocket-service.js';

type SkuParams = { skuId: string };

class CapacityValidationError extends Error {
  constructor(public readonly code: 'LOCATION_TAG_NOT_FOUND' | 'CAPACITY_EXCEEDED') {
    super(code);
    this.name = 'CapacityValidationError';
  }
}

export class SkusService {
  constructor(
    private readonly repository = new SkusRepository(),
    private readonly locationTagsRepository = new LocationTagsRepository(),
    private readonly movementsRepository = new SkuMovementsRepository(),
  ) {}

  private serializeSku(sku: any) {
    return {
      ...sku,
      quantity: Number(sku.quantity ?? 0),
    };
  }

  private async assertSkuIdUnique(orgId: string, skuId: string, excludeSkuId?: string) {
    const existing = await this.repository.findBySkuId(orgId, skuId);
    if (existing && existing.id !== excludeSkuId) {
      throw new Error('SKU_ID_NOT_UNIQUE');
    }
  }

  private async assertLocationTag(tagId: string, organizationId: string) {
    const tag = await this.locationTagsRepository.findById(tagId, organizationId);
    if (!tag) {
      throw new CapacityValidationError('LOCATION_TAG_NOT_FOUND');
    }
    return tag;
  }

  private async assertCapacity(
    locationTagId: string,
    organizationId: string,
    incomingQuantity: number,
    excludeSkuId?: string,
  ) {
    const tag = await this.assertLocationTag(locationTagId, organizationId);
    const current = await this.locationTagsRepository.getUsage(
      locationTagId,
      organizationId,
      excludeSkuId,
    );
    if (current + incomingQuantity > tag.capacity) {
      throw new CapacityValidationError('CAPACITY_EXCEEDED');
    }
    return tag;
  }

  private async ensureCapacity(
    params: {
      locationTagId: string;
      organizationId: string;
      incomingQuantity: number;
      excludeSkuId?: string;
    },
    reply: FastifyReply,
  ) {
    try {
      await this.assertCapacity(
        params.locationTagId,
        params.organizationId,
        params.incomingQuantity,
        params.excludeSkuId,
      );
      return true;
    } catch (error) {
      if (error instanceof CapacityValidationError) {
        if (error.code === 'LOCATION_TAG_NOT_FOUND') {
          reply.code(404).send({ error: 'Location tag not found' });
        } else {
          reply.code(400).send({ error: 'Location tag capacity exceeded' });
        }
        return false;
      }
      throw error;
    }
  }

  // ── Helper: emit location + inventory socket events after any SKU change ──
  private async emitLocationEvents(
    request: FastifyRequest,
    locationTagId: string,
    organizationId: string,
  ) {
    try {
      const tag = await this.locationTagsRepository.findById(locationTagId, organizationId);
      console.log('🔌 emitLocationEvents - tag:', tag?.id, 'unitId:', tag?.unitId);
      if (!tag || !tag.unitId) return;

      const currentItems = await this.locationTagsRepository.getUsage(locationTagId, organizationId);
      const utilizationPercentage = tag.capacity > 0
        ? (currentItems / tag.capacity) * 100
        : 0;

      const io = request.server.io;

      emitLocationUpdated(io, tag.unitId, {
        location_tag_id: locationTagId,
        current_items: currentItems,
        utilization_percentage: utilizationPercentage,
      });

      emitInventoryChanged(io, tag.unitId, {
        unit_id: tag.unitId,
        utilization_percentage: utilizationPercentage,
      });
    } catch (err) {
      // Non-critical: log but don't fail the request
      console.error('Failed to emit location socket events:', err);
    }
  }

  // ── Helper: broadcast SKU statistics update via WebSocket ──
  private async broadcastSkuStats(
    request: FastifyRequest,
    locationTagId: string,
    organizationId: string,
  ) {
    try {
      const tag = await this.locationTagsRepository.findById(locationTagId, organizationId);
      if (!tag || !tag.unitId) return;

      const liveMapRepository = new LiveMapRepository();
      const wsService = new LiveMapWebSocketService(liveMapRepository, request.server);
      
      // Get unit's layouts to find the first layout ID
      const unitData = await liveMapRepository.getUnitWithLayouts(tag.unitId, organizationId);
      if (!unitData || !unitData.layouts.length) return;
      
      // Use the first layout ID (units typically have one primary layout)
      const layoutId = unitData.layouts[0].id;
      
      await wsService.broadcastLocationTagStats(tag.unitId, organizationId, layoutId);
    } catch (err) {
      // Non-critical: log but don't fail the request
      console.error('Failed to broadcast SKU stats:', err);
    }
  }

  async list(
    request: FastifyRequest<{ Querystring: SkuQueryInput }>,
    reply: FastifyReply,
  ) {
    const result = await this.repository.list(request.user.organizationId, request.query ?? {});
    reply.send({
      items: result.items.map((item) => this.serializeSku(item)),
      pagination: result.pagination,
    });
  }

  async get(
    request: FastifyRequest<{ Params: SkuParams }>,
    reply: FastifyReply,
  ) {
    const sku = await this.repository.findById(request.params.skuId, request.user.organizationId);
    if (!sku) {
      return reply.code(404).send({ error: 'SKU not found' });
    }
    reply.send(this.serializeSku(sku));
  }

  async create(
    request: FastifyRequest<{ Body: CreateSkuInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    if (request.body.locationTagId) {
      const ok = await this.ensureCapacity(
        {
          locationTagId: request.body.locationTagId,
          organizationId: orgId,
          incomingQuantity: request.body.quantity,
        },
        reply,
      );
      if (!ok) return;
    }

    if (request.body.skuId) {
      try {
        await this.assertSkuIdUnique(orgId, request.body.skuId);
      } catch (error) {
        if (error instanceof Error && error.message === 'SKU_ID_NOT_UNIQUE') {
          return reply.code(409).send({ error: 'SKU ID already in use' });
        }
        throw error;
      }
    }

    const sku = await this.repository.create({
      skuName: request.body.skuName,
      skuCategory: request.body.skuCategory,
      skuUnit: request.body.skuUnit,
      quantity: request.body.quantity.toString(),
      effectiveDate: request.body.effectiveDate,
      expiryDate: request.body.expiryDate ?? null,
      skuId: request.body.skuId ?? null,
      locationTagId: request.body.locationTagId ?? null,
      organizationId: orgId,
    });

    // Emit socket events so View Live panel updates in real-time
    if (sku.locationTagId) {
      await this.emitLocationEvents(request, sku.locationTagId, orgId);
      await this.broadcastSkuStats(request, sku.locationTagId, orgId);
    }

    reply.code(201).send(this.serializeSku(sku));
  }

  async update(
    request: FastifyRequest<{ Params: SkuParams; Body: UpdateSkuInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    const { skuId } = request.params;
    const existing = await this.repository.findById(skuId, orgId);
    if (!existing) {
      return reply.code(404).send({ error: 'SKU not found' });
    }

    const nextLocationTagId =
      request.body.locationTagId !== undefined ? request.body.locationTagId : existing.locationTagId;
    const nextQuantity =
      request.body.quantity !== undefined ? request.body.quantity : Number(existing.quantity ?? 0);

    if (nextLocationTagId) {
      const ok = await this.ensureCapacity(
        {
          locationTagId: nextLocationTagId,
          organizationId: orgId,
          incomingQuantity: nextQuantity,
          excludeSkuId: skuId,
        },
        reply,
      );
      if (!ok) return;
    }

    if (request.body.skuId) {
      try {
        await this.assertSkuIdUnique(orgId, request.body.skuId, skuId);
      } catch (error) {
        if (error instanceof Error && error.message === 'SKU_ID_NOT_UNIQUE') {
          return reply.code(409).send({ error: 'SKU ID already in use' });
        }
        throw error;
      }
    }

    const updated = await this.repository.update(skuId, orgId, {
      skuName: request.body.skuName ?? existing.skuName,
      skuCategory: request.body.skuCategory ?? existing.skuCategory,
      skuUnit: request.body.skuUnit ?? existing.skuUnit,
      quantity: (request.body.quantity ?? Number(existing.quantity ?? 0)).toString(),
      effectiveDate: request.body.effectiveDate ?? existing.effectiveDate,
      expiryDate:
        request.body.expiryDate !== undefined ? request.body.expiryDate : existing.expiryDate ?? null,
      locationTagId: nextLocationTagId ?? null,
      skuId:
        request.body.skuId !== undefined
          ? request.body.skuId
          : existing.skuId ?? null,
    });

    // Emit socket events so View Live panel updates in real-time
    if (updated?.locationTagId) {
      await this.emitLocationEvents(request, updated.locationTagId, orgId);
      await this.broadcastSkuStats(request, updated.locationTagId, orgId);
    }
    if (
      existing.locationTagId &&
      existing.locationTagId !== updated?.locationTagId
    ) {
      await this.emitLocationEvents(request, existing.locationTagId, orgId);
      await this.broadcastSkuStats(request, existing.locationTagId, orgId);
    }

    if (!updated) {
      return reply.code(404).send({ error: 'SKU not found' });
    }
    reply.send(this.serializeSku(updated));
  }

  async remove(
    request: FastifyRequest<{ Params: SkuParams }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    const existing = await this.repository.findById(request.params.skuId, orgId);

    const deleted = await this.repository.delete(request.params.skuId, orgId);
    if (!deleted) {
      return reply.code(404).send({ error: 'SKU not found' });
    }

    // Emit socket events so View Live panel updates in real-time
    if (existing?.locationTagId) {
      await this.emitLocationEvents(request, existing.locationTagId, orgId);
      await this.broadcastSkuStats(request, existing.locationTagId, orgId);
    }

    reply.code(204).send();
  }

  async move(
    request: FastifyRequest<{ Params: SkuParams; Body: MoveSkuInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    const { skuId } = request.params;
    const sku = await this.repository.findById(skuId, orgId);
    if (!sku) {
      return reply.code(404).send({ error: 'SKU not found' });
    }

    const ok = await this.ensureCapacity(
      {
        locationTagId: request.body.toLocationTagId,
        organizationId: orgId,
        incomingQuantity: Number(sku.quantity ?? 0),
        excludeSkuId: skuId,
      },
      reply,
    );
    if (!ok) return;

    const updated = await this.repository.update(skuId, orgId, {
      locationTagId: request.body.toLocationTagId,
    });

    await this.movementsRepository.logMovement({
      skuId,
      fromLocationTagId: sku.locationTagId ?? null,
      toLocationTagId: request.body.toLocationTagId,
      organizationId: orgId,
      movedByUserId: request.user.userId,
    });

    // Emit for both old and new location
    await this.emitLocationEvents(request, request.body.toLocationTagId, orgId);
    await this.broadcastSkuStats(request, request.body.toLocationTagId, orgId);
    if (sku.locationTagId && sku.locationTagId !== request.body.toLocationTagId) {
      await this.emitLocationEvents(request, sku.locationTagId, orgId);
      await this.broadcastSkuStats(request, sku.locationTagId, orgId);
    }

    reply.send(this.serializeSku(updated));
  }

  async history(
    request: FastifyRequest<{ Params: SkuParams }>,
    reply: FastifyReply,
  ) {
    const history = await this.movementsRepository.getHistory(
      request.params.skuId,
      request.user.organizationId,
    );
    reply.send({ movements: history });
  }
}