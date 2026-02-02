export const createAssetBodySchema = {
  type: 'object',
  required: ['assetName', 'assetType'],
  additionalProperties: false,
  properties: {
    assetName: { type: 'string', minLength: 1, maxLength: 255 },
    assetType: { type: 'string', minLength: 1, maxLength: 100 },
    locationTagId: { type: ['string', 'null'], format: 'uuid' },
  },
} as const;

export const updateAssetBodySchema = {
  ...createAssetBodySchema,
  required: [],
} as const;

export const assetQueryStringSchema = {
  type: 'object',
  properties: {
    search: { type: 'string', minLength: 2, maxLength: 255 },
    locationTagId: { type: 'string', format: 'uuid' },
    unitId: { type: 'string', format: 'uuid' },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    offset: { type: 'integer', minimum: 0, default: 0 },
  },
} as const;

export const moveAssetBodySchema = {
  type: 'object',
  required: ['toLocationTagId'],
  properties: {
    toLocationTagId: { type: 'string', format: 'uuid' },
  },
} as const;

export type CreateAssetInput = {
  assetName: string;
  assetType: string;
  locationTagId?: string | null;
};

export type UpdateAssetInput = Partial<CreateAssetInput>;

export type AssetQueryInput = {
  search?: string;
  locationTagId?: string;
  unitId?: string;
  limit?: number;
  offset?: number;
};

export type MoveAssetInput = {
  toLocationTagId: string;
};
