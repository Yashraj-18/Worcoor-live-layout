import { FastifyInstance } from 'fastify';

import { referenceDataRoutes } from './routes.js';

export async function registerReferenceDataModule(app: FastifyInstance) {
  await app.register(referenceDataRoutes, { prefix: '/api/reference-data' });
}
