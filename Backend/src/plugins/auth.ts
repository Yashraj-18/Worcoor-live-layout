import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';

import { AppEnv } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export type JwtRole = 'admin' | 'worker' | 'viewer';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      organizationId: string;
      role: JwtRole;
    };
    user: {
      userId: string;
      organizationId: string;
      role: JwtRole;
    };
  }
}

export async function registerAuth(app: FastifyInstance, env: AppEnv) {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      request.log.error(error);
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}
