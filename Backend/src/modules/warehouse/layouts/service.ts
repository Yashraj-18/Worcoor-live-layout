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
    const normalizedPayload = {
      ...payload,
      status: payload.status ?? 'draft',
      layoutData: payload.layoutData ?? null,
      metadata: payload.metadata ?? null,
    };
    const layout = await this.repository.create({
      ...normalizedPayload,
      unitId,
      organizationId: request.user.organizationId,
    });

    reply.code(201).send(layout);
  }

  async getById(
    request: FastifyRequest<{ Params: { layoutId: string } }> ,
    reply: FastifyReply,
  ) {
    const { layoutId } = request.params;
    const layout = await this.repository.findById(layoutId, request.user.organizationId);

    if (!layout) {
      return reply.code(404).send({ error: 'Layout not found' });
    }

    reply.send(layout);
  }

  async update(
    request: FastifyRequest<{ Params: { layoutId: string }; Body: UpdateLayoutInput }>,
    reply: FastifyReply,
  ) {
    const { layoutId } = request.params;
    const payload = request.body;
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (payload.layoutName !== undefined) updateData.layoutName = payload.layoutName;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.layoutData !== undefined) updateData.layoutData = payload.layoutData;
    if (payload.metadata !== undefined) updateData.metadata = payload.metadata;

    const updated = await this.repository.update(
      layoutId,
      request.user.organizationId,
      updateData,
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
