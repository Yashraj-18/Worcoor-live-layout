import type { FastifyReply, FastifyRequest } from 'fastify';

import { SkuMovementsRepository } from './repository.js';
import type { SkuMovementQueryInput } from './schemas.js';

export class SkuMovementsService {
  constructor(private readonly repository = new SkuMovementsRepository()) {}

  async list(
    request: FastifyRequest<{ Querystring: SkuMovementQueryInput }>,
    reply: FastifyReply,
  ) {
    const organizationId = request.user.organizationId;
    const result = await this.repository.list(organizationId, request.query ?? {});

    reply.send(result);
  }
}
