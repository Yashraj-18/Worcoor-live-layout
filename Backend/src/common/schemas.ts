export const paginationQuerySchema = {
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, default: 0 },
  },
} as const;

export const paginationMetaSchema = {
  type: 'object',
  properties: {
    total: { type: 'integer' },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
    hasMore: { type: 'boolean' },
  },
  required: ['total', 'limit', 'offset', 'hasMore'],
} as const;

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    code: { type: 'string' },
    details: { type: 'object', additionalProperties: true },
  },
  required: ['error'],
} as const;

export function buildPaginatedResponseSchema(itemSchema: object) {
  return {
    type: 'object',
    properties: {
      items: { type: 'array', items: itemSchema },
      pagination: paginationMetaSchema,
    },
    required: ['items', 'pagination'],
  } as const;
}

export const commonResponses = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  404: errorResponseSchema,
  409: errorResponseSchema,
  500: errorResponseSchema,
} as const;
