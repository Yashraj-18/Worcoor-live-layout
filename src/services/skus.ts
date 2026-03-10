import { apiService } from '@/src/services/apiService';

export type SkuCategory = 'raw_material' | 'finished_good';
export type SkuUnit = 'kg' | 'liters' | 'pieces' | 'boxes';

export type Sku = {
  id: string;
  skuId: string | null;
  skuName: string;
  skuCategory: SkuCategory;
  skuUnit: SkuUnit;
  quantity: number;
  effectiveDate: string;
  expiryDate: string | null;
  locationTagId: string | null;
  organizationId: string;
  createdAt: string;
  locationTagName: string | null;
  unitId?: string | null;
};

export type CreateSkuInput = {
  skuId?: string | null;
  skuName: string;
  skuCategory: SkuCategory;
  skuUnit: SkuUnit;
  quantity: number;
  effectiveDate: string;
  expiryDate?: string | null;
  locationTagId?: string | null;
};

export type UpdateSkuInput = Partial<CreateSkuInput>;

export type SkuListQuery = {
  search?: string;
  locationTagId?: string;
  unitId?: string;
  limit?: number;
  offset?: number;
};

export type SkuListResponse = {
  items: Sku[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

const BASE_PATH = '/api/skus';

export const skuService = {
  async list(params?: SkuListQuery, config?: { signal?: AbortSignal }): Promise<SkuListResponse> {
    const response = await apiService.get({
      path: BASE_PATH,
      params,
    }, config);
    return response.data as SkuListResponse;
  },

  async get(skuId: string): Promise<Sku> {
    const response = await apiService.get({
      path: `${BASE_PATH}/${skuId}`,
    });
    return response.data as Sku;
  },

  async create(payload: CreateSkuInput): Promise<Sku> {
    const response = await apiService.post({
      path: BASE_PATH,
      data: payload,
    });
    return response.data as Sku;
  },

  async update(skuId: string, payload: UpdateSkuInput): Promise<Sku> {
    const response = await apiService.put({
      path: `${BASE_PATH}/${skuId}`,
      data: payload,
    });
    return response.data as Sku;
  },

  async remove(skuId: string): Promise<void> {
    await apiService.delete({
      path: `${BASE_PATH}/${skuId}`,
    });
  },
};
