import type { FastifyInstance } from 'fastify';

import { LiveMapRepository } from './repository.js';
import { LiveMapService } from './service.js';

type UnitParams = { unitId: string };
type SearchQuery = { q: string };

const skuSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    skuName: { type: 'string' },
    quantity: { type: 'string' },
    skuUnit: { type: 'string' },
  },
};

const locationTagSchema = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    tagName: { type: 'string' },
    capacity: { type: 'integer' },
    currentItems: { type: 'number' },
    utilizationPercentage: { type: 'number' },
    skus: { type: 'array', items: skuSchema },
  },
};

const componentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    componentType: { type: 'string' },
    displayName: { type: 'string' },
    positionX: { type: 'integer' },
    positionY: { type: 'integer' },
    width: { type: 'integer' },
    height: { type: 'integer' },
    color: { type: ['string', 'null'] },
    locationTag: locationTagSchema,
  },
};

const layoutSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    layoutName: { type: 'string' },
    components: { type: 'array', items: componentSchema },
  },
};

const liveMapResponseSchema = {
  type: 'object',
  properties: {
    unit: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        unitName: { type: 'string' },
        status: { type: 'string' },
        utilizationPercentage: { type: 'number' },
      },
    },
    layouts: { type: 'array', items: layoutSchema },
  },
};

const searchResultSchema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    componentId: { type: ['string', 'null'], format: 'uuid' },
    locationTagId: { type: ['string', 'null'], format: 'uuid' },
  },
};

export async function unitSearchRoutes(app: FastifyInstance) {
  const repository = new LiveMapRepository();
  const service = new LiveMapService(repository);

  // GET /api/units/:unitId/search?q= - Search within unit (per Tech Architecture Doc)
  app.get<{ Params: UnitParams; Querystring: SearchQuery }>('/', {
    preHandler: [app.authenticate],
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: { type: 'array', items: searchResultSchema },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    handler: (request, reply) => service.search(request, reply),
  });
}

export async function liveMapRoutes(app: FastifyInstance) {
  const repository = new LiveMapRepository();
  const service = new LiveMapService(repository);

  // GET /api/units/:unitId/live-map - Get live map data
  app.get<{ Params: UnitParams }>('/', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: liveMapResponseSchema,
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    handler: (request, reply) => service.getLiveMap(request, reply),
  });

  // GET /api/units/:unitId/live-map/search?q=query - Search within unit
  app.get<{ Params: UnitParams; Querystring: SearchQuery }>('/search', {
    preHandler: [app.authenticate],
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: { type: 'array', items: searchResultSchema },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    handler: (request, reply) => service.search(request, reply),
  });
}