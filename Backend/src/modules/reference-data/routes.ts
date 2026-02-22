import type { FastifyInstance } from 'fastify';

import { ReferenceDataRepository } from './repository.js';
import { ReferenceDataService } from './service.js';

export async function referenceDataRoutes(app: FastifyInstance) {
  const repository = new ReferenceDataRepository();
  const service = new ReferenceDataService(repository);

  app.get('/counts', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            totalUnits: { type: 'integer' },
            totalSkus: { type: 'integer' },
            totalLocationTags: { type: 'integer' },
            totalAssets: { type: 'integer' },
          },
        },
      },
    },
    handler: (request, reply) => service.getCounts(request, reply),
  });
}
