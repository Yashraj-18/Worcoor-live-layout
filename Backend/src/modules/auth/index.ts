import { FastifyInstance } from 'fastify';

import { authRoutes } from './routes.js';

export async function registerAuthModule(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/api/auth' });
}
