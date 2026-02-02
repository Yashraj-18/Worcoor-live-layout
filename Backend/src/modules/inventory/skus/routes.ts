import type { FastifyInstance } from 'fastify';

import { requireRole } from '../../../common/rbac.js';
import { SkusService } from './service.js';
import {
  createSkuBodySchema,
  updateSkuBodySchema,
  skuQueryStringSchema,
  moveSkuBodySchema,
} from './schemas.js';
import type { CreateSkuInput, MoveSkuInput, SkuQueryInput, UpdateSkuInput } from './schemas.js';

const skuResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    skuId: { type: ['string', 'null'], maxLength: 100 },
    skuName: { type: 'string' },
    skuCategory: { type: 'string' },
    skuUnit: { type: 'string' },
    quantity: { type: 'number' },
    effectiveDate: { type: 'string', format: 'date' },
    expiryDate: { type: ['string', 'null'], format: 'date' },
    locationTagId: { type: ['string', 'null'], format: 'uuid' },
    organizationId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    locationTagName: { type: ['string', 'null'] },
    unitId: { type: ['string', 'null'], format: 'uuid' },
  },
};

const skuListResponseSchema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: skuResponseSchema },
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

const skuIdParamsSchema = {
  type: 'object',
  required: ['skuId'],
  properties: {
    skuId: { type: 'string', format: 'uuid' },
  },
};

type SkuParams = { skuId: string };

export async function skusRoutes(app: FastifyInstance) {
  const service = new SkusService();

  app.get<{ Querystring: SkuQueryInput }>('/', {
    preHandler: [app.authenticate],
    schema: {
      querystring: skuQueryStringSchema,
      response: {
        200: skuListResponseSchema,
      },
    },
    handler: (request, reply) => service.list(request, reply),
  });

  app.get<{ Params: { skuId: string } }>('/:skuId', {
    preHandler: [app.authenticate],
    schema: {
      params: skuIdParamsSchema,
      response: {
        200: skuResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.get(request, reply),
  });

  app.post<{ Body: CreateSkuInput }>('/', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      body: createSkuBodySchema,
      response: {
        201: skuResponseSchema,
        400: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.create(request, reply),
  });

  app.put<{ Params: SkuParams; Body: UpdateSkuInput }>('/:skuId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: skuIdParamsSchema,
      body: updateSkuBodySchema,
      response: {
        200: skuResponseSchema,
        400: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.update(request, reply),
  });

  app.delete<{ Params: SkuParams }>('/:skuId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: skuIdParamsSchema,
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.remove(request, reply),
  });

  app.put<{ Params: SkuParams; Body: MoveSkuInput }>('/:skuId/move', {
    preHandler: [app.authenticate, requireRole('admin', 'worker')],
    schema: {
      params: skuIdParamsSchema,
      body: moveSkuBodySchema,
      response: {
        200: skuResponseSchema,
        400: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.move(request, reply),
  });

  app.get<{ Params: SkuParams }>('/:skuId/history', {
    preHandler: [app.authenticate],
    schema: {
      params: skuIdParamsSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            movements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  fromLocationTagId: { type: ['string', 'null'], format: 'uuid' },
                  toLocationTagId: { type: 'string', format: 'uuid' },
                  movedAt: { type: 'string', format: 'date-time' },
                  fromLocationTagName: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
      },
    },
    handler: (request, reply) => service.history(request, reply),
  });
}
