import { apiService } from '@/src/services/apiService';

export type ReferenceDataCounts = {
  totalUnits: number;
  totalSkus: number;
  totalLocationTags: number;
  totalAssets: number;
};

const BASE_PATH = '/api/reference-data';

export const referenceDataService = {
  async getCounts(): Promise<ReferenceDataCounts> {
    const response = await apiService.get({ path: `${BASE_PATH}/counts` });
    return response.data as ReferenceDataCounts;
  },
};
