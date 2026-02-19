import type { FastifyInstance } from 'fastify';

import { requireRole } from '../../../common/rbac.js';
import { ComponentsService } from './service.js';
import { ComponentsRepository } from './repository.js';
import type {
  CreateComponentInput,
  UpdateComponentInput,
  UpdateLocationTagInput,
} from './schemas.js';

const componentResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    layoutId: { type: 'string', format: 'uuid' },
    organizationId: { type: 'string', format: 'uuid' },
    componentType: { type: 'string' },
    displayName: { type: 'string' },
    positionX: { type: 'integer' },
    positionY: { type: 'integer' },
    width: { type: 'integer' },
    height: { type: 'integer' },
    color: { type: ['string', 'null'] },
    locationTagId: { oneOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }] },
    locationTagName: { type: ['string', 'null'] },
    label: { type: ['string', 'null'] },
    metadata: { type: ['object', 'null'], additionalProperties: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const createComponentBodySchema = {
  type: 'object',
  required: ['componentType', 'displayName', 'positionX', 'positionY', 'width', 'height'],
  additionalProperties: false,
  properties: {
    componentType: { type: 'string', minLength: 1, maxLength: 100 },
    displayName: { type: 'string', minLength: 1, maxLength: 255 },
    positionX: { type: 'integer' },
    positionY: { type: 'integer' },
    width: { type: 'integer', minimum: 1 },
    height: { type: 'integer', minimum: 1 },
    color: { type: ['string', 'null'], maxLength: 50 },
    locationTagId: { oneOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }] },
    locationTagName: { type: ['string', 'null'], maxLength: 255 },
    label: { type: ['string', 'null'], maxLength: 255 },
    metadata: { type: ['object', 'null'], additionalProperties: true },
  },
};

const updateComponentBodySchema = {
  ...createComponentBodySchema,
  required: [],
};

const layoutIdParamsSchema = {
  type: 'object',
  required: ['layoutId'],
  properties: {
    layoutId: { type: 'string', format: 'uuid' },
  },
};

const componentIdParamsSchema = {
  type: 'object',
  required: ['componentId'],
  properties: {
    componentId: { type: 'string', format: 'uuid' },
  },
};

const updateLocationTagBodySchema = {
  type: 'object',
  required: ['locationTagId'],
  properties: {
    locationTagId: { oneOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }] },
  },
};

type LayoutParams = { layoutId: string };
type ComponentParams = { componentId: string };

export async function componentsRoutes(app: FastifyInstance) {
  const repository = new ComponentsRepository();
  const service = new ComponentsService(repository);

  // GET /api/layouts/:layoutId/components
  app.get<{ Params: LayoutParams }>('/', {
    preHandler: [app.authenticate],
    schema: {
      params: layoutIdParamsSchema,
      response: {
        200: { type: 'array', items: componentResponseSchema },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.list(request, reply),
  });

  // POST /api/layouts/:layoutId/components
  app.post<{ Params: LayoutParams; Body: CreateComponentInput }>('/', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: layoutIdParamsSchema,
      body: createComponentBodySchema,
      response: {
        201: componentResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.create(request, reply),
  });
}

export async function componentRoutes(app: FastifyInstance) {
  const repository = new ComponentsRepository();
  const service = new ComponentsService(repository);

  // PUT /api/components/:componentId
  app.put<{ Params: ComponentParams; Body: UpdateComponentInput }>('/:componentId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: componentIdParamsSchema,
      body: updateComponentBodySchema,
      response: {
        200: componentResponseSchema,
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.update(request, reply),
  });

  // DELETE /api/components/:componentId
  app.delete<{ Params: ComponentParams }>('/:componentId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: componentIdParamsSchema,
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.remove(request, reply),
  });

  // PUT /api/components/:componentId/location-tag
  app.put<{ Params: ComponentParams; Body: UpdateLocationTagInput }>(
    '/:componentId/location-tag',
    {
      preHandler: [app.authenticate, requireRole('admin')],
      schema: {
        params: componentIdParamsSchema,
        body: updateLocationTagBodySchema,
        response: {
          200: componentResponseSchema,
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
      handler: (request, reply) => service.updateLocationTag(request, reply),
    },
  );
}
