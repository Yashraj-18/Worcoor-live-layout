import type { FastifyInstance } from 'fastify';

import { requireRole } from '../../../common/rbac.js';
import { UnitsRepository } from './repository.js';
import { UnitsService } from './service.js';
import { createUnitSchema, updateUnitSchema, type CreateUnitInput, type UpdateUnitInput } from './schemas.js';

const unitResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    organizationId: { type: 'string', format: 'uuid' },
    unitId: { type: ['string', 'null'], maxLength: 100 },
    unitName: { type: 'string' },
    unitType: { type: 'string' },
    status: { type: 'string', enum: ['LIVE', 'OFFLINE', 'MAINTENANCE', 'PLANNING'] },
    description: { type: ['string', 'null'] },
    area: { type: ['string', 'null'], maxLength: 100 },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const unitIdParamsSchema = {
  type: 'object',
  required: ['unitId'],
  properties: {
    unitId: { type: 'string', format: 'uuid' },
  },
};

const createUnitBodySchema = {
  type: 'object',
  required: ['unitId', 'unitName', 'unitType', 'status'],
  additionalProperties: false,
  properties: {
    unitId: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: '^[a-zA-Z0-9_-]+$',
    },
    unitName: { type: 'string', minLength: 1, maxLength: 255 },
    unitType: { type: 'string', minLength: 1, maxLength: 100 },
    status: { type: 'string', enum: ['LIVE', 'OFFLINE', 'MAINTENANCE', 'PLANNING'] },
    description: { type: ['string', 'null'], maxLength: 1000 },
    area: {
      anyOf: [
        { type: 'null' },
        {
          type: 'string',
          maxLength: 100,
          pattern: '^\\d+(?:\\.\\d+)?\\s+sq\\s+[A-Za-z]+$',
        },
      ],
    },
  },
};

const updateUnitBodySchema = {
  ...createUnitBodySchema,
  required: [],
};

type UnitParams = { unitId: string };

export async function unitsRoutes(app: FastifyInstance) {
  const repository = new UnitsRepository();
  const service = new UnitsService(repository);

  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: {
          type: 'array',
          items: unitResponseSchema,
        },
      },
    },
    handler: (request, reply) => service.list(request, reply),
  });

  app.get<{ Params: UnitParams }>('/:unitId', {
    preHandler: [app.authenticate],
    schema: {
      params: unitIdParamsSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            ...unitResponseSchema.properties,
            totalLocations: { type: 'integer' },
            occupiedLocations: { type: 'integer' },
            utilizationPercentage: { type: 'number' },
          },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    handler: (request, reply) => service.getById(request, reply),
  });

  app.post<{ Body: CreateUnitInput }>('/', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      body: createUnitBodySchema,
      response: {
        201: unitResponseSchema,
      },
    },
    handler: (request, reply) => service.create(request, reply),
  });

  app.put<{ Params: UnitParams; Body: UpdateUnitInput }>('/:unitId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: unitIdParamsSchema,
      body: updateUnitBodySchema,
      response: {
        200: unitResponseSchema,
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

  app.delete<{ Params: UnitParams }>('/:unitId', {
    preHandler: [app.authenticate, requireRole('admin')],
    schema: {
      params: unitIdParamsSchema,
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
