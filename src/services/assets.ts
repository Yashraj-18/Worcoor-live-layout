import { apiService } from '@/src/services/apiService';

export type Asset = {
  id: string;
  assetId: string | null;
  assetName: string;
  assetType: string;
  organizationId: string;
  locationTagId: string | null;
  createdAt: string;
  locationTagName: string | null;
  unitId?: string | null;
};

export type CreateAssetInput = {
  assetId?: string | null;
  assetName: string;
  assetType: string;
  locationTagId?: string | null;
};

export type UpdateAssetInput = Partial<CreateAssetInput>;

export type AssetListQuery = {
  search?: string;
  locationTagId?: string;
  unitId?: string;
  limit?: number;
  offset?: number;
};

export type AssetListResponse = {
  items: Asset[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

const BASE_PATH = '/api/assets';

export const assetService = {
  async list(params?: AssetListQuery, config?: { signal?: AbortSignal }): Promise<AssetListResponse> {
    const response = await apiService.get({
      path: BASE_PATH,
      params,
    }, config);
    return response.data as AssetListResponse;
  },

  async get(assetId: string): Promise<Asset> {
    const response = await apiService.get({
      path: `${BASE_PATH}/${assetId}`,
    });
    return response.data as Asset;
  },

  async create(payload: CreateAssetInput): Promise<Asset> {
    const response = await apiService.post({
      path: BASE_PATH,
      data: payload,
    });
    return response.data as Asset;
  },

  async update(assetId: string, payload: UpdateAssetInput): Promise<Asset> {
    const response = await apiService.put({
      path: `${BASE_PATH}/${assetId}`,
      data: payload,
    });
    return response.data as Asset;
  },

  async remove(assetId: string): Promise<void> {
    await apiService.delete({
      path: `${BASE_PATH}/${assetId}`,
    });
  },
};
