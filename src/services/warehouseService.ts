// @ts-nocheck
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

// ---------------------------------------------------------------------------
// Mapping helpers: frontend warehouseItem <-> backend Component
// ---------------------------------------------------------------------------

// Keys stored in the backend `metadata` JSONB column.
// Everything that is NOT a first-class DB column goes here.
const FIRST_CLASS_KEYS = new Set([
  'id', 'layoutId', 'organizationId', 'componentType', 'displayName',
  'positionX', 'positionY', 'width', 'height', 'locationTagId',
  'color', 'label', 'metadata', 'createdAt',
]);

/** Strip non-serializable values so the payload is safe for JSON / JSONB storage. */
function safeJsonClone(obj: Record<string, any>): Record<string, any> {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    // Fallback: manually filter out non-serializable entries
    const safe: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== 'function' && typeof v !== 'symbol' && v !== undefined) {
        try { JSON.stringify(v); safe[k] = v; } catch { /* skip */ }
      }
    }
    return safe;
  }
}

/** Return the string if it looks like a UUID, otherwise null. */
function toUuidOrNull(val: any): string | null {
  if (typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
    return val;
  }
  return null;
}

/**
 * Convert a backend Component row into the shape used by WarehouseLayoutBuilder
 * (warehouseItem).  The rich data stored in `metadata` is spread back onto the
 * item so the UI can access `compartmentContents`, `stack`, `locationData`, etc.
 */
export function componentToItem(c: Component): Record<string, any> {
  const meta = (c.metadata && typeof c.metadata === 'object') ? c.metadata : {};
  return {
    // Spread metadata first so first-class fields win on conflict
    ...meta,
    id: c.id,
    _backendId: c.id,           // keep a reference to the persisted id
    type: c.componentType,
    name: c.displayName,
    x: c.positionX,
    y: c.positionY,
    width: c.width,
    height: c.height,
    color: c.color ?? meta.color ?? 'transparent',
    label: c.label ?? meta.label ?? c.displayName,
    locationTagId: c.locationTagId ?? null,
  };
}

/**
 * Convert a frontend warehouseItem into a CreateComponentInput payload.
 * All extra keys (compartmentContents, stack, locationData, etc.) are
 * serialised into the `metadata` JSONB column.
 */
export function itemToCreatePayload(item: Record<string, any>): CreateComponentInput {
  const metadata: Record<string, any> = {};
  for (const [key, value] of Object.entries(item)) {
    if (!FIRST_CLASS_KEYS.has(key) && key !== 'id' && key !== '_backendId'
        && key !== 'type' && key !== 'name' && key !== 'x' && key !== 'y') {
      metadata[key] = value;
    }
  }

  return {
    componentType: item.type ?? item.componentType ?? 'unknown',
    displayName: item.name ?? item.displayName ?? item.label ?? 'Component',
    positionX: Math.round(item.x ?? item.positionX ?? 0),
    positionY: Math.round(item.y ?? item.positionY ?? 0),
    width: Math.round(item.width ?? 100),
    height: Math.round(item.height ?? 80),
    color: item.color || null,
    locationTagId: toUuidOrNull(item.locationTagId),
    label: item.label || null,
    metadata: Object.keys(metadata).length > 0 ? safeJsonClone(metadata) : null,
  };
}

/**
 * Build a partial UpdateComponentInput from a warehouseItem updates object.
 * Only includes fields that are present in `updates`.
 */
export function itemUpdatesToPayload(updates: Record<string, any>): UpdateComponentInput {
  const payload: UpdateComponentInput = {};

  if (updates.type !== undefined || updates.componentType !== undefined) {
    payload.componentType = updates.type ?? updates.componentType;
  }
  if (updates.name !== undefined || updates.displayName !== undefined) {
    payload.displayName = updates.name ?? updates.displayName;
  }
  if (updates.x !== undefined || updates.positionX !== undefined) {
    payload.positionX = Math.round(updates.x ?? updates.positionX);
  }
  if (updates.y !== undefined || updates.positionY !== undefined) {
    payload.positionY = Math.round(updates.y ?? updates.positionY);
  }
  if (updates.width !== undefined) {
    payload.width = Math.round(updates.width);
  }
  if (updates.height !== undefined) {
    payload.height = Math.round(updates.height);
  }
  if (updates.color !== undefined) {
    payload.color = updates.color;
  }
  if (updates.label !== undefined) {
    payload.label = updates.label;
  }
  if (updates.locationTagId !== undefined) {
    payload.locationTagId = toUuidOrNull(updates.locationTagId);
  }

  // Collect any rich data into metadata
  const metadataKeys = Object.keys(updates).filter(k =>
    !FIRST_CLASS_KEYS.has(k) && k !== 'id' && k !== '_backendId'
    && k !== 'type' && k !== 'name' && k !== 'x' && k !== 'y'
  );
  if (metadataKeys.length > 0) {
    const metadata: Record<string, any> = {};
    metadataKeys.forEach(k => { metadata[k] = updates[k]; });
    payload.metadata = safeJsonClone(metadata);
  }

  return payload;
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

  async getComponents(layoutId: string): Promise<Component[]> {
    const response = await apiService.get({
      path: `${LAYOUT_BASE_PATH}/${layoutId}/components`,
    });
    return response.data as Component[];
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
 
  async syncLayout(layoutId: string, payload: { components: any[]; deleteIds?: string[] }): Promise<{ status: string }> {
    const response = await apiService.put({
      path: `${LAYOUT_BASE_PATH}/${layoutId}/sync`,
      data: payload,
    });
    return response.data as { status: string };
  },
 
  async setComponentLocationTag(componentId: string, locationTagId: string | null): Promise<Component> {
    const response = await apiService.put({
      path: `${COMPONENT_BASE_PATH}/${componentId}/location-tag`,
      data: { locationTagId },
    });
    return response.data as Component;
  },
};
