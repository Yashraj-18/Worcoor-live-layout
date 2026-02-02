import type { FastifyInstance } from 'fastify';

import { requireRole } from '../../../common/rbac.js';
import { LayoutsRepository } from './repository.js';
import { LayoutsService } from './service.js';
import type { CreateLayoutInput, UpdateLayoutInput } from './schemas.js';

const layoutResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    unitId: { type: 'string', format: 'uuid' },
    organizationId: { type: 'string', format: 'uuid' },
    layoutName: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const layoutIdParamsSchema = {
  type: 'object',
  required: ['layoutId'],
  properties: {
    layoutId: { type: 'string', format: 'uuid' },
  },
};

const unitIdParamsSchema = {
  type: 'object',
  required: ['unitId'],
  properties: {
    unitId: { type: 'string', format: 'uuid' },
  },
};

const createLayoutBodySchema = {
  type: 'object',
  required: ['layoutName'],
  additionalProperties: false,
  properties: {
    layoutName: { type: 'string', minLength: 1, maxLength: 255 },
  },
};

const updateLayoutBodySchema = {
  ...createLayoutBodySchema,
  required: [],
};

type UnitParams = { unitId: string };
type LayoutParams = { layoutId: string };

export async function layoutsRoutes(app: FastifyInstance) {
  const repository = new LayoutsRepository();
  const service = new LayoutsService(repository);

  // GET /api/units/:unitId/layouts - List layouts for a unit
  app.get<{ Params: UnitParams }>('/', {
    preHandler: [app.authenticate],
    schema: {
      params: unitIdParamsSchema,
      response: {
        200: {
          type: 'array',
          items: layoutResponseSchema,
        },
      },
    },
    handler: (request, reply) => service.list(request, reply),
  });

  // POST /api/units/:unitId/layouts - Create layout for a unit
  app.post<{ Params: UnitParams; Body: CreateLayoutInput }>('/', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: unitIdParamsSchema,
      body: createLayoutBodySchema,
      response: {
        201: layoutResponseSchema,
      },
    },
    handler: (request, reply) => service.create(request, reply),
  });
}

// Separate routes for layout-specific operations (PUT, DELETE)
export async function layoutRoutes(app: FastifyInstance) {
  const repository = new LayoutsRepository();
  const service = new LayoutsService(repository);

  // PUT /api/layouts/:layoutId - Update layout
  app.put<{ Params: LayoutParams; Body: UpdateLayoutInput }>('/:layoutId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: layoutIdParamsSchema,
      body: updateLayoutBodySchema,
      response: {
        200: layoutResponseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: (request, reply) => service.update(request, reply),
  });

  // DELETE /api/layouts/:layoutId - Delete layout
  app.delete<{ Params: LayoutParams }>('/:layoutId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: layoutIdParamsSchema,
      response: {
        204: { type: 'null' },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: (request, reply) => service.remove(request, reply),
  });
}
