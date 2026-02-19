// @ts-nocheck
// Type definitions for warehouse constants

export interface ComponentDefinition {
  type: string;
  name: string;
  icon: string;
  color?: string;
  defaultSize: { width: number; height: number };
  description?: string;
  category?: string;
  priority?: string;
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
  rows?: number;
  cols?: number;
  [key: string]: any;
}

export interface ComponentCategory {
  category: string;
  icon: string;
  priority: string;
  expanded: boolean;
  components: ComponentDefinition[];
}

export type ComponentColors = Record<string, string>;
export type StatusColors = Record<string, string>;
export type OrientationColors = Record<string, string>;
export type StorageCategoryColors = Record<string, string>;
