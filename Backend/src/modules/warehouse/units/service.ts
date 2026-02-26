import type { FastifyReply, FastifyRequest } from 'fastify';

import type { UnitsRepository } from './repository.js';
import type { CreateUnitInput, UpdateUnitInput } from './schemas.js';

export class UnitsService {
  constructor(private readonly repository: UnitsRepository) {}

  async list(request: FastifyRequest, reply: FastifyReply) {
    const units = await this.repository.findAllByOrganization(request.user.organizationId);
    reply.send(units);
  }

  async getById(request: FastifyRequest<{ Params: { unitId: string } }>, reply: FastifyReply) {
    const { unitId } = request.params;
    const unit = await this.repository.findByIdWithUtilization(unitId, request.user.organizationId);

    if (!unit) {
      return reply.code(404).send({ error: 'Unit not found' });
    }

    reply.send(unit);
  }

  async create(request: FastifyRequest<{ Body: CreateUnitInput }>, reply: FastifyReply) {
    const payload = request.body;

    if (payload.unitId) {
      const existing = await this.repository.findByUnitId(payload.unitId, request.user.organizationId);
      if (existing) {
        return reply.code(409).send({ error: `A unit with ID "${payload.unitId}" already exists.` });
      }
    }

    const unit = await this.repository.create({
      ...payload,
      description: payload.description ?? null,
      area: payload.area ?? null,
      organizationId: request.user.organizationId,
    });

    reply.code(201).send(unit);
  }

  async update(
    request: FastifyRequest<{ Params: { unitId: string }; Body: UpdateUnitInput }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;

    if (request.body.unitId) {
      const existing = await this.repository.findByUnitId(request.body.unitId, request.user.organizationId);
      if (existing && existing.id !== unitId) {
        return reply.code(409).send({ error: `A unit with ID "${request.body.unitId}" already exists.` });
      }
    }

    const updated = await this.repository.update(unitId, request.user.organizationId, request.body);

    if (!updated) {
      return reply.code(404).send({ error: 'Unit not found' });
    }

    reply.send(updated);
  }

  async remove(request: FastifyRequest<{ Params: { unitId: string } }>, reply: FastifyReply) {
    const { unitId } = request.params;
    const deleted = await this.repository.delete(unitId, request.user.organizationId);

    if (!deleted) {
      return reply.code(404).send({ error: 'Unit not found' });
    }

    reply.code(204).send();
  }
}
