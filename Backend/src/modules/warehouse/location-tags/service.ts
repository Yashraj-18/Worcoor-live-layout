import type { FastifyReply, FastifyRequest } from 'fastify';

import { LocationTagsRepository, type LocationTagEntity } from './repository.js';
import type { CreateLocationTagInput, UpdateLocationTagInput } from './schemas.js';

type UnitParams = { unitId: string };

const toNullableNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const normalizeTag = (tag: LocationTagEntity) => ({
  ...tag,
  capacity: Number(tag.capacity ?? 0),
  length: toNullableNumber(tag.length),
  breadth: toNullableNumber(tag.breadth),
  height: toNullableNumber(tag.height),
  unitOfMeasurement: tag.unitOfMeasurement ?? null,
});
type LocationTagParams = { locationTagId: string };

const calculateCapacity = (
  length?: number | null,
  breadth?: number | null,
  height?: number | null,
) => {
  if (
    typeof length === 'number' &&
    typeof breadth === 'number' &&
    typeof height === 'number'
  ) {
    return Number((length * breadth * height).toFixed(3));
  }

  return 0;
};

export class LocationTagsService {
  constructor(private readonly repository = new LocationTagsRepository()) {}

  private async enrichTag(tag: LocationTagEntity, organizationId: string) {
    const normalized = normalizeTag(tag);
    const usage = await this.repository.getUsage(tag.id, organizationId);
    const utilization =
      normalized.capacity > 0
        ? Math.round((usage / normalized.capacity) * 100 * 10) / 10
        : 0;

    return {
      ...normalized,
      currentItems: usage,
      utilizationPercentage: utilization,
    };
  }

  async list(
    request: FastifyRequest<{ Params: UnitParams }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;
    const tags = await this.repository.findAllByUnit(unitId, request.user.organizationId);
    const enriched = await Promise.all(
      tags.map((tag) => this.enrichTag(tag, request.user.organizationId)),
    );

    reply.send(enriched);
  }

  async create(
    request: FastifyRequest<{ Body: CreateLocationTagInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    const existing = await this.repository.findByNameWithinUnit(
      orgId,
      request.body.unitId,
      request.body.locationTagName,
    );

    if (existing) {
      return reply.code(409).send({ error: 'Location tag name already in use' });
    }

    const length = request.body.length ?? null;
    const breadth = request.body.breadth ?? null;
    const height = request.body.height ?? null;
    const unitOfMeasurement = request.body.unitOfMeasurement ?? null;
    const capacity = calculateCapacity(length, breadth, height);

    const tag = await this.repository.create({
      organizationId: orgId,
      unitId: request.body.unitId,
      locationTagName: request.body.locationTagName,
      length,
      breadth,
      height,
      unitOfMeasurement,
      capacity,
    });

    const enrichedTag = await this.enrichTag(tag, orgId);

    reply.code(201).send(enrichedTag);
  }

  async update(
    request: FastifyRequest<{ Params: LocationTagParams; Body: UpdateLocationTagInput }>,
    reply: FastifyReply,
  ) {
    const { locationTagId } = request.params;
    const orgId = request.user.organizationId;

    if (request.body.locationTagName) {
      const unitId = request.body.unitId ?? (await this.repository.findById(locationTagId, orgId))?.unitId;

      if (!unitId) {
        return reply.code(404).send({ error: 'Location tag not found' });
      }

      const existing = await this.repository.findByNameWithinUnit(
        orgId,
        unitId,
        request.body.locationTagName,
        locationTagId,
      );
      if (existing) {
        return reply.code(409).send({ error: 'Location tag name already in use' });
      }
    }

    const updatePayload: UpdateLocationTagInput & { capacity?: number } = {
      ...request.body,
    };

    const measurementsProvided =
      'length' in request.body ||
      'breadth' in request.body ||
      'height' in request.body ||
      'unitOfMeasurement' in request.body;

    if (measurementsProvided) {
      const length = request.body.length ?? null;
      const breadth = request.body.breadth ?? null;
      const height = request.body.height ?? null;
      const unitOfMeasurement = request.body.unitOfMeasurement ?? null;

      updatePayload.length = length;
      updatePayload.breadth = breadth;
      updatePayload.height = height;
      updatePayload.unitOfMeasurement = unitOfMeasurement;
      updatePayload.capacity = calculateCapacity(length, breadth, height);
    }

    const updated = await this.repository.update(locationTagId, orgId, updatePayload);

    if (!updated) {
      return reply.code(404).send({ error: 'Location tag not found' });
    }

    const enriched = await this.enrichTag(updated, orgId);

    reply.send(enriched);
  }

  async remove(request: FastifyRequest<{ Params: LocationTagParams }>, reply: FastifyReply) {
    const { locationTagId } = request.params;
    const orgId = request.user.organizationId;

    // Check if location tag exists
    const existing = await this.repository.findById(locationTagId, orgId);
    if (!existing) {
      return reply.code(404).send({ error: 'Location tag not found' });
    }

    try {
      // Unassign location tag from all SKUs, Assets, and Components
      // This sets their locationTagId to NULL before deleting the tag
      await this.repository.unassignFromSKUs(locationTagId, orgId);
      await this.repository.unassignFromAssets(locationTagId, orgId);
      await this.repository.unassignFromComponents(locationTagId, orgId);

      // Now delete the location tag
      const deleted = await this.repository.delete(locationTagId, orgId);

      if (!deleted) {
        return reply.code(404).send({ error: 'Location tag not found' });
      }

      reply.code(204).send();
    } catch (error: any) {
      // Handle any unexpected errors
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        return reply.code(409).send({ 
          error: 'Cannot delete location tag',
          details: 'This location tag is referenced by movement records. Please contact support.'
        });
      }
      throw error;
    }
  }
}
