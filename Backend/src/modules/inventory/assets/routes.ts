import type { FastifyInstance } from 'fastify';

import { requireRole } from '../../../common/rbac.js';
import { AssetsService, type AssetParams } from './service.js';
import {
  assetQueryStringSchema,
  createAssetBodySchema,
  updateAssetBodySchema,
  moveAssetBodySchema,
  type AssetQueryInput,
  type CreateAssetInput,
  type UpdateAssetInput,
  type MoveAssetInput,
} from './schemas.js';

const assetResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    assetName: { type: 'string' },
    assetType: { type: 'string' },
    organizationId: { type: 'string', format: 'uuid' },
    locationTagId: { type: ['string', 'null'], format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    locationTagName: { type: ['string', 'null'] },
    unitId: { type: ['string', 'null'], format: 'uuid' },
  },
};

const assetListResponseSchema = {
  type: 'object',
  properties: {
    items: { type: 'array', items: assetResponseSchema },
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

const assetIdParamsSchema = {
  type: 'object',
  required: ['assetId'],
  properties: {
    assetId: { type: 'string', format: 'uuid' },
  },
};

export async function assetsRoutes(app: FastifyInstance) {
  const service = new AssetsService();

  app.get<{ Querystring: AssetQueryInput }>('/', {
    preHandler: [app.authenticate],
    schema: {
      querystring: assetQueryStringSchema,
      response: {
        200: assetListResponseSchema,
      },
    },
    handler: (request, reply) => service.list(request, reply),
  });

  app.get<{ Params: AssetParams }>('/:assetId', {
    preHandler: [app.authenticate],
    schema: {
      params: assetIdParamsSchema,
      response: {
        200: assetResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.get(request, reply),
  });

  app.post<{ Body: CreateAssetInput }>('/', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      body: createAssetBodySchema,
      response: {
        201: assetResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.create(request, reply),
  });

  app.put<{ Params: AssetParams; Body: UpdateAssetInput }>('/:assetId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: assetIdParamsSchema,
      body: updateAssetBodySchema,
      response: {
        200: assetResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.update(request, reply),
  });

  app.delete<{ Params: AssetParams }>('/:assetId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: assetIdParamsSchema,
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.remove(request, reply),
  });

  app.put<{ Params: AssetParams; Body: MoveAssetInput }>('/:assetId/move', {
    preHandler: [app.authenticate, requireRole('admin', 'worker')],
    schema: {
      params: assetIdParamsSchema,
      body: moveAssetBodySchema,
      response: {
        200: assetResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.move(request, reply),
  });
}
