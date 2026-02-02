import type { FastifyInstance } from 'fastify';

import { requireRole } from '../../../common/rbac.js';
import { SkuMovementsService } from './service.js';
import { skuMovementQuerystringSchema } from './schemas.js';
import type { SkuMovementQueryInput } from './schemas.js';

const movementItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    skuId: { type: 'string', format: 'uuid' },
    skuName: { type: ['string', 'null'] },
    fromLocationTagId: { type: ['string', 'null'], format: 'uuid' },
    fromLocationTagName: { type: ['string', 'null'] },
    toLocationTagId: { type: 'string', format: 'uuid' },
    toLocationTagName: { type: ['string', 'null'] },
    toUnitId: { type: ['string', 'null'], format: 'uuid' },
    movedAt: { type: 'string', format: 'date-time' },
    movedByUserId: { type: ['string', 'null'], format: 'uuid' },
    moverEmail: { type: ['string', 'null'], format: 'email' },
  },
};

const movementListResponseSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: movementItemSchema,
    },
    pagination: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  },
};

export async function skuMovementsRoutes(app: FastifyInstance) {
  const service = new SkuMovementsService();

  app.get<{ Querystring: SkuMovementQueryInput }>('/', {
    preHandler: [app.authenticate, requireRole('admin', 'worker')],
    schema: {
      querystring: skuMovementQuerystringSchema,
      response: {
        200: movementListResponseSchema,
      },
    },
    handler: (request, reply) => service.list(request, reply),
  });
}
