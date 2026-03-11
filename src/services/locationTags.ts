import { apiService } from '@/src/services/apiService';

export type MeasurementUnit = 'meters' | 'feet' | 'inches' | 'centimeters';

export type LocationTag = {
  id: string;
  organizationId: string;
  unitId: string;
  locationTagName: string;
  capacity: number;
  length: number | null;
  breadth: number | null;
  height: number | null;
  unitOfMeasurement: MeasurementUnit | null;
  currentItems: number;
  utilizationPercentage: number;
  createdAt: string;
};

export type CreateLocationTagInput = {
  unitId: string;
  locationTagName: string;
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
  unitOfMeasurement?: MeasurementUnit | null;
};

export type UpdateLocationTagInput = Partial<CreateLocationTagInput>;

const BASE_PATH = '/api/location-tags';

export const locationTagService = {
  async listByUnit(unitId: string, config?: { signal?: AbortSignal }): Promise<LocationTag[]> {
    const response = await apiService.get({ path: `/api/units/${unitId}/location-tags` }, config);
    return response.data as LocationTag[];
  },

  async create(payload: CreateLocationTagInput): Promise<LocationTag> {
    const response = await apiService.post({
      path: BASE_PATH,
      data: payload,
    });
    return response.data as LocationTag;
  },

  async update(locationTagId: string, payload: UpdateLocationTagInput): Promise<LocationTag> {
    const response = await apiService.put({
      path: `${BASE_PATH}/${locationTagId}`,
      data: payload,
    });
    return response.data as LocationTag;
  },

  async remove(locationTagId: string): Promise<void> {
    await apiService.delete({ path: `${BASE_PATH}/${locationTagId}` });
  },
};
