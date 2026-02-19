// @ts-nocheck
// Global type definitions for the warehouse management system

export interface WarehouseItem {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  customColor?: string;
  paletteColor?: string;
  label?: string;
  locationCode?: string;
  containerId?: string;
  containerLevel?: number;
  isContainer?: boolean;
  isShape?: boolean;
  isBoundary?: boolean;
  isHollow?: boolean;
  gridStep?: number;
  snapToGrid?: boolean;
  gridAligned?: boolean;
  zIndex?: number;
  rotation?: number;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  backgroundColor?: string;
  skus?: SKU[];
  rows?: number;
  cols?: number;
  orientation?: string;
  occupancyStatus?: string;
  capacity?: number;
  currentLoad?: number;
  stackMode?: string;
  stackedItems?: WarehouseItem[];
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SKU {
  id: string;
  uniqueId: string;
  sku: string;
  row: number;
  col: number;
  status?: string;
  category?: string;
  storageSpace?: number;
  availability?: string;
  createdAt?: number;
  lastModified?: number;
  metadata?: {
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    temperature?: string;
    hazardous?: boolean;
    priority?: string;
  };
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  item: WarehouseItem | null;
}

export interface ZoneContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  zone: WarehouseItem | null;
}

export interface StackManagerState {
  visible: boolean;
  item: WarehouseItem | null;
}

export interface InfoPopupState {
  visible: boolean;
  x: number;
  y: number;
  item: WarehouseItem | null;
}

export interface PanOffset {
  x: number;
  y: number;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  buildings?: Building[];
}

export interface Building {
  id: string;
  name: string;
  floors?: Floor[];
}

export interface Floor {
  id: string;
  name: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  type: string;
  locations?: Location[];
}

export interface Location {
  id: string;
  code: string;
  name: string;
}

export interface ComponentType {
  type: string;
  name: string;
  icon: string;
  defaultSize: { width: number; height: number };
  color?: string;
  category?: string;
  priority?: string;
  description?: string;
  isContainer?: boolean;
  containerLevel?: number;
  containerPadding?: number;
  isShape?: boolean;
  isBoundary?: boolean;
  isHollow?: boolean;
  gridStep?: number;
  snapToGrid?: boolean;
  gridAligned?: boolean;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  drawingTool?: boolean;
  [key: string]: any;
}

export interface LayoutData {
  name: string;
  items: WarehouseItem[];
  metadata?: {
    createdAt?: number;
    lastModified?: number;
    createdBy?: string;
    operationalStatus?: string;
    totalItems?: number;
  };
}

export interface SavedLayout {
  id: string;
  name: string;
  data: LayoutData;
  timestamp: number;
  status?: string;
}
