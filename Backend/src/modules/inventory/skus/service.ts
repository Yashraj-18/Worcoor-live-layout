import type { FastifyReply, FastifyRequest } from 'fastify';

import { LocationTagsRepository } from '../../warehouse/location-tags/repository.js';
import { SkusRepository } from './repository.js';
import { SkuMovementsRepository } from '../sku-movements/repository.js';
import type { CreateSkuInput, MoveSkuInput, SkuQueryInput, UpdateSkuInput } from './schemas.js';

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

    reply.send(this.serializeSku(updated));
  }

  async remove(
    request: FastifyRequest<{ Params: SkuParams }>,
    reply: FastifyReply,
  ) {
    const deleted = await this.repository.delete(request.params.skuId, request.user.organizationId);
    if (!deleted) {
      return reply.code(404).send({ error: 'SKU not found' });
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
