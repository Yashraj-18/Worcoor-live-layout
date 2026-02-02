export const skuMovementQuerystringSchema = {
  type: 'object',
  properties: {
    skuId: { type: 'string', format: 'uuid' },
    fromLocationTagId: { type: 'string', format: 'uuid' },
    toLocationTagId: { type: 'string', format: 'uuid' },
    unitId: { type: 'string', format: 'uuid' },
    movedByUserId: { type: 'string', format: 'uuid' },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, default: 0 },
  },
} as const;

export type SkuMovementQueryInput = {
  skuId?: string;
  fromLocationTagId?: string;
  toLocationTagId?: string;
  unitId?: string;
  movedByUserId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};
