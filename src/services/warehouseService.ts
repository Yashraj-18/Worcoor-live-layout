import { apiService } from '@/src/services/apiService';
import type {
  LiveMapResponse,
  SearchResponse,
  LocationTag,
  Layout,
  Component,
  CreateLayoutInput,
  UpdateLayoutInput,
  CreateComponentInput,
  UpdateComponentInput,
} from '@/types/warehouse';

const UNIT_BASE_PATH = '/api/units';
const LAYOUT_BASE_PATH = '/api/layouts';
const COMPONENT_BASE_PATH = '/api/components';

function buildUnitPath(unitId: string, suffix: string) {
  return `${UNIT_BASE_PATH}/${unitId}${suffix}`;
}

export const warehouseService = {
  async getLiveMap(unitId: string): Promise<LiveMapResponse> {
    const response = await apiService.get({
      path: buildUnitPath(unitId, '/live-map'),
    });
    return response.data as LiveMapResponse;
  },

  async search(unitId: string, query: string): Promise<SearchResponse> {
    if (query.trim().length < 2) {
      return { results: [] };
    }

    const response = await apiService.get({
      path: buildUnitPath(unitId, '/search'),
      params: { q: query },
    });
    return response.data as SearchResponse;
  },

  async getLocationTags(unitId: string): Promise<LocationTag[]> {
    const response = await apiService.get({
      path: buildUnitPath(unitId, '/location-tags'),
    });
    return response.data as LocationTag[];
  },

  async getLayouts(unitId: string): Promise<Layout[]> {
    const response = await apiService.get({
      path: buildUnitPath(unitId, '/layouts'),
    });
    return response.data as Layout[];
  },

  async getLayout(layoutId: string): Promise<Layout> {
    const response = await apiService.get({
      path: `${LAYOUT_BASE_PATH}/${layoutId}`,
    });
    return response.data as Layout;
  },

  async createLayout(unitId: string, payload: CreateLayoutInput): Promise<Layout> {
    const response = await apiService.post({
      path: buildUnitPath(unitId, '/layouts'),
      data: payload,
    });
    return response.data as Layout;
  },

  async updateLayout(layoutId: string, payload: UpdateLayoutInput): Promise<Layout> {
    const response = await apiService.put({
      path: `${LAYOUT_BASE_PATH}/${layoutId}`,
      data: payload,
    });
    return response.data as Layout;
  },

  async deleteLayout(layoutId: string): Promise<void> {
    await apiService.delete({
      path: `${LAYOUT_BASE_PATH}/${layoutId}`,
    });
  },

  async createComponent(layoutId: string, payload: CreateComponentInput): Promise<Component> {
    const response = await apiService.post({
      path: `${LAYOUT_BASE_PATH}/${layoutId}/components`,
      data: payload,
    });
    return response.data as Component;
  },

  async updateComponent(componentId: string, payload: UpdateComponentInput): Promise<Component> {
    const response = await apiService.put({
      path: `${COMPONENT_BASE_PATH}/${componentId}`,
      data: payload,
    });
    return response.data as Component;
  },

  async deleteComponent(componentId: string): Promise<void> {
    await apiService.delete({
      path: `${COMPONENT_BASE_PATH}/${componentId}`,
    });
  },

  async setComponentLocationTag(componentId: string, locationTagId: string | null): Promise<Component> {
    const response = await apiService.put({
      path: `${COMPONENT_BASE_PATH}/${componentId}/location-tag`,
      data: { locationTagId },
    });
    return response.data as Component;
  },
};
