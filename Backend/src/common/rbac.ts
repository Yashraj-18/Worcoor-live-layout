import type { FastifyReply, FastifyRequest } from 'fastify';

import type { JwtRole } from '../plugins/auth.js';

export function requireRole(...allowedRoles: JwtRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}
