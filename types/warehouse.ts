// Core enums
export type UnitStatus = 'LIVE' | 'OFFLINE' | 'MAINTENANCE' | 'PLANNING';
export type UnitOfMeasurement = 'meters' | 'feet' | 'inches' | 'centimeters';
export type LayoutStatus = 'operational' | 'draft' | 'archived';
export type SearchResultType = 'location' | 'sku';

// Primitive warehouse models
export interface LocationTag {
  id: string;
  unitId: string;
  organizationId: string;
  locationTagName: string;
  capacity: number;
  length: number | null;
  breadth: number | null;
  height: number | null;
  unitOfMeasurement: UnitOfMeasurement | null;
  currentItems: number;
  utilizationPercentage: number;
  createdAt: string;
}

export interface Sku {
  id: string;
  skuId?: string | null;
  skuName: string;
  skuCategory: string;
  skuUnit: string;
  quantity: number;
  effectiveDate: string;
  expiryDate?: string | null;
  locationTagId?: string | null;
  locationTagName?: string | null;
  unitId?: string | null;
  organizationId: string;
  createdAt: string;
}

export interface Layout {
  id: string;
  unitId: string;
  organizationId: string;
  layoutName: string;
  status: LayoutStatus;
  layoutData: Record<string, any> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Component {
  id: string;
  layoutId: string;
  organizationId: string;
  componentType: string;
  displayName: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color: string | null;
  locationTagId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Live map data structures
export interface LiveMapSku {
  id: string;
  skuName: string;
  quantity: number;
  skuUnit: string;
}

export interface LiveMapLocationTag {
  id: string;
  tagName: string;
  capacity: number;
  currentItems: number;
  utilizationPercentage: number;
  skus: LiveMapSku[];
}

export interface LiveMapComponent {
  id: string;
  componentType: string;
  displayName: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color: string | null;
  locationTag: LiveMapLocationTag | null;
}

export interface LiveMapLayout {
  id: string;
  layoutName: string;
  components: LiveMapComponent[];
}

export interface LiveMapResponse {
  unit: {
    id: string;
    unitName: string;
    status: UnitStatus;
    utilizationPercentage: number;
  };
  layouts: LiveMapLayout[];
}

// Search
export interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  componentId?: string | null;
  locationTagId?: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
}

// Layout + component inputs
export interface CreateLayoutInput {
  layoutName: string;
  status?: LayoutStatus;
  layoutData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateLayoutInput extends Partial<CreateLayoutInput> {}

export interface CreateComponentInput {
  componentType: string;
  displayName: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color?: string | null;
  locationTagId?: string | null;
}

export interface UpdateComponentInput {
  displayName?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  color?: string | null;
}
