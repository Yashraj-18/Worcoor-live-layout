export const createSkuBodySchema = {
  type: 'object',
  required: ['skuName', 'skuCategory', 'skuUnit', 'quantity', 'effectiveDate'],
  additionalProperties: false,
  properties: {
    skuId: { type: ['string', 'null'], minLength: 1, maxLength: 100 },
    skuName: { type: 'string', minLength: 1, maxLength: 255 },
    skuCategory: { type: 'string', minLength: 1, maxLength: 100 },
    skuUnit: { type: 'string', enum: ['kg', 'liters', 'pieces', 'boxes'] },
    quantity: { type: 'number', exclusiveMinimum: 0 },
    effectiveDate: { type: 'string', format: 'date' },
    expiryDate: { type: ['string', 'null'], format: 'date' },
    locationTagId: { type: ['string', 'null'], format: 'uuid' },
  },
} as const;

export const updateSkuBodySchema = {
  ...createSkuBodySchema,
  required: [],
} as const;

export const skuQueryStringSchema = {
  type: 'object',
  properties: {
    search: { type: 'string', minLength: 2, maxLength: 255 },
    locationTagId: { type: 'string', format: 'uuid' },
    unitId: { type: 'string', format: 'uuid' },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, default: 0 },
  },
} as const;

export const moveSkuBodySchema = {
  type: 'object',
  required: ['toLocationTagId'],
  properties: {
    toLocationTagId: { type: 'string', format: 'uuid' },
  },
} as const;

export type CreateSkuInput = {
  skuId?: string | null;
  skuName: string;
  skuCategory: string;
  skuUnit: 'kg' | 'liters' | 'pieces' | 'boxes';
  quantity: number;
  effectiveDate: string;
  expiryDate?: string | null;
  locationTagId?: string | null;
};

export type UpdateSkuInput = Partial<CreateSkuInput>;

export type SkuQueryInput = {
  search?: string;
  locationTagId?: string;
  unitId?: string;
  limit?: number;
  offset?: number;
};

export type MoveSkuInput = {
  toLocationTagId: string;
};
