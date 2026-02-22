import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ReferenceDataRepository } from './repository.js';

export class ReferenceDataService {
  constructor(private readonly repository: ReferenceDataRepository) {}

  async getCounts(request: FastifyRequest, reply: FastifyReply) {
    const counts = await this.repository.getCounts(request.user.organizationId);
    reply.send(counts);
  }
}
