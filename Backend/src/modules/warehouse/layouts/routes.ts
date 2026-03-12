import type { FastifyInstance } from 'fastify';
 
import { requireRole } from '../../../common/rbac.js';
import { LayoutsRepository } from './repository.js';
import { LayoutsService } from './service.js';
import {
  createLayoutSchema,
  updateLayoutSchema,
  syncLayoutSchema,
  type CreateLayoutInput,
  type UpdateLayoutInput,
  type SyncLayoutInput,
} from './schemas.js';
 
const layoutResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    unitId: { type: 'string', format: 'uuid' },
    organizationId: { type: 'string', format: 'uuid' },
    layoutName: { type: 'string' },
    status: { type: 'string', enum: ['operational', 'draft', 'archived'] },
    layoutData: { type: ['object', 'null'], additionalProperties: true },
    metadata: { type: ['object', 'null'], additionalProperties: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: ['string', 'null'], format: 'date-time' },
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
    status: { type: 'string', enum: ['operational', 'draft', 'archived'] },
    layoutData: { type: ['object', 'null'], additionalProperties: true },
    metadata: { type: ['object', 'null'], additionalProperties: true },
  },
};
 
const updateLayoutBodySchema = {
  ...createLayoutBodySchema,
  required: [],
};
 
const syncLayoutBodySchema = {
  type: 'object',
  required: ['components'],
  properties: {
    components: {
      type: 'array',
      items: {
        type: 'object',
        required: ['componentType', 'displayName', 'positionX', 'positionY', 'width', 'height'],
        additionalProperties: true,
        properties: {
          id: { type: 'string', format: 'uuid' },
          componentType: { type: 'string' },
          displayName: { type: 'string' },
        },
      },
    },
    deleteIds: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
    },
  },
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
 
  // GET /api/layouts/:layoutId - Get single layout with full data
  app.get<{ Params: LayoutParams }>('/:layoutId', {
    preHandler: [app.authenticate],
    schema: {
      params: layoutIdParamsSchema,
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
    handler: (request, reply) => service.getById(request, reply),
  });
 
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
 
  // PUT /api/layouts/:layoutId/sync - Atomic component synchronization
  app.put<{ Params: LayoutParams; Body: SyncLayoutInput }>('/:layoutId/sync', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: layoutIdParamsSchema,
      body: syncLayoutBodySchema,
      response: {
        200: { type: 'object', properties: { status: { type: 'string' } } },
      },
    },
    handler: (request, reply) => service.sync(request, reply),
  });
}
