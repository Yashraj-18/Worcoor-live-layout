import type { FastifyReply, FastifyRequest } from 'fastify';

import type { LayoutsRepository } from './repository.js';
import type { CreateLayoutInput, UpdateLayoutInput } from './schemas.js';

export class LayoutsService {
  constructor(private readonly repository: LayoutsRepository) {}

  async list(
    request: FastifyRequest<{ Params: { unitId: string } }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;
    const layouts = await this.repository.findAllByUnit(unitId, request.user.organizationId);
    reply.send(layouts);
  }

  async create(
    request: FastifyRequest<{ Params: { unitId: string }; Body: CreateLayoutInput }>,
    reply: FastifyReply,
  ) {
    const { unitId } = request.params;
    const payload = request.body;
    const layout = await this.repository.create({
      ...payload,
      unitId,
      organizationId: request.user.organizationId,
    });

    reply.code(201).send(layout);
  }

  async update(
    request: FastifyRequest<{ Params: { layoutId: string }; Body: UpdateLayoutInput }>,
    reply: FastifyReply,
  ) {
    const { layoutId } = request.params;
    const updated = await this.repository.update(
      layoutId,
      request.user.organizationId,
      request.body,
    );

    if (!updated) {
      return reply.code(404).send({ error: 'Layout not found' });
    }

    reply.send(updated);
  }

  async remove(
    request: FastifyRequest<{ Params: { layoutId: string } }>,
    reply: FastifyReply,
  ) {
    const { layoutId } = request.params;
    const deleted = await this.repository.delete(layoutId, request.user.organizationId);

    if (!deleted) {
      return reply.code(404).send({ error: 'Layout not found' });
    }

    reply.code(204).send();
  }
}
