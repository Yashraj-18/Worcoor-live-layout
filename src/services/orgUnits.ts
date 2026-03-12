import { apiService } from '@/src/services/apiService';

export type OrgUnitStatus = 'LIVE' | 'OFFLINE' | 'MAINTENANCE' | 'PLANNING';
export type OrgUnitType = 'warehouse' | 'office' | 'production';

export type OrgUnit = {
  id: string;
  organizationId: string;
  unitId: string | null;
  unitName: string;
  unitType: OrgUnitType;
  status: OrgUnitStatus;
  description: string | null;
  area: string | null;
  totalLocations?: number;
  occupiedLocations?: number;
  utilizationPercentage?: number;
  createdAt: string;
};

export type CreateOrgUnitInput = {
  unitId: string;
  unitName: string;
  unitType: OrgUnitType;
  status: OrgUnitStatus;
  description?: string | null;
  area?: string | null;
};

export type UpdateOrgUnitInput = Partial<CreateOrgUnitInput>;

const BASE_PATH = '/api/units';

export const orgUnitService = {
  async list(): Promise<OrgUnit[]> {
    const response = await apiService.get({ path: BASE_PATH });
    return response.data as OrgUnit[];
  },

  async create(payload: CreateOrgUnitInput): Promise<OrgUnit> {
    const response = await apiService.post({
      path: BASE_PATH,
      data: payload,
    });
    return response.data as OrgUnit;
  },

  async update(unitId: string, payload: UpdateOrgUnitInput): Promise<OrgUnit> {
    const response = await apiService.put({
      path: `${BASE_PATH}/${unitId}`,
      data: payload,
    });
    return response.data as OrgUnit;
  },

  async remove(unitId: string): Promise<void> {
    await apiService.delete({ path: `${BASE_PATH}/${unitId}` });
  },
};
