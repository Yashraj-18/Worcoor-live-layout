/**
 * Component Panel Color Configuration
 * 
 * Centralized color definitions for all warehouse components displayed in the ComponentPanel.
 * This file serves as the single source of truth for component colors.
 * 
 * Color Format: Hex color codes (e.g., '#4CAF50')
 * 
 * Usage:
 * - Import this file in warehouseComponents.ts
 * - Use getComponentPanelColor(componentType) to retrieve colors
 */

import { COMPONENT_TYPES } from '../constants/componentTypes';

/**
 * Component Panel Color Palette
 * Define colors for each component type that will appear in the ComponentPanel
 * 
 * NOTE: Only includes component types that exist in COMPONENT_TYPES
 * Add new colors here when new component types are added to COMPONENT_TYPES
 */
export const COMPONENT_PANEL_COLORS: Record<string, string> = {
  // Floor Plan Components
  [COMPONENT_TYPES.SQUARE_BOUNDARY]: 'transparent',        // Transparent - Main warehouse boundary
  
  // Storage Components (1×1 to 2×2)
  [COMPONENT_TYPES.STORAGE_UNIT]: 'transparent',       // Transparent - No color (fresh start)
  [COMPONENT_TYPES.SKU_HOLDER]: 'transparent',             // Transparent - Horizontal storage racks
  [COMPONENT_TYPES.VERTICAL_SKU_HOLDER]: 'transparent',    // Transparent - Vertical storage racks
  [COMPONENT_TYPES.SPARE_UNIT]: 'transparent',             // Transparent - Spare units
  
  // Zone Components
  [COMPONENT_TYPES.WAREHOUSE_BLOCK]: 'transparent',        // Transparent - Warehouse blocks
  [COMPONENT_TYPES.STORAGE_ZONE]: 'transparent',           // Transparent - Storage zones
  [COMPONENT_TYPES.CONTAINER_UNIT]: 'transparent',         // Transparent - Container units
  [COMPONENT_TYPES.ZONE_DIVIDER]: 'transparent',           // Transparent - Zone dividers
  [COMPONENT_TYPES.AREA_BOUNDARY]: 'transparent',          // Transparent - Area boundaries
  
  // Common Areas
  [COMPONENT_TYPES.FIRE_EXIT_MARKING]: 'transparent',      // Transparent - Fire exit markings
  [COMPONENT_TYPES.SECURITY_AREA]: 'transparent',          // Transparent - Security areas
  [COMPONENT_TYPES.RESTROOMS_AREA]: 'transparent',         // Transparent - Restrooms
  [COMPONENT_TYPES.PATHWAYS_ARROWS]: 'transparent',        // Transparent - Pathway arrows
  
  // Office Spaces
  [COMPONENT_TYPES.CONFERENCE_ROOM]: 'transparent',        // Transparent - Conference rooms
  [COMPONENT_TYPES.MEETING_ROOMS]: 'transparent',          // Transparent - Meeting rooms
  [COMPONENT_TYPES.PANTRY_AREA]: 'transparent',            // Transparent - Pantry area
  [COMPONENT_TYPES.OPEN_STAGE]: 'transparent',             // Transparent - Open stage
  [COMPONENT_TYPES.SEATING_AREA]: 'transparent',           // Transparent - Seating area
  [COMPONENT_TYPES.BOOTHS]: 'transparent',                 // Transparent - Booths
  [COMPONENT_TYPES.GENERAL_AREA]: 'transparent',           // Transparent - General area
  
  // Primary Warehouse Operations
  [COMPONENT_TYPES.DISPATCH_GATES]: 'transparent',         // Transparent - Dispatch gates
  [COMPONENT_TYPES.INBOUND_GATES]: 'transparent',          // Transparent - Inbound gates
};

/**
 * Get the color for a specific component type
 * @param componentType - The component type from COMPONENT_TYPES
 * @returns Hex color code for the component
 */
export const getComponentPanelColor = (componentType: string): string => {
  return COMPONENT_PANEL_COLORS[componentType] || '#607D8B'; // Default to Blue Gray if not found
};

/**
 * Get all component colors
 * @returns Record of all component types and their colors
 */
export const getAllComponentPanelColors = (): Record<string, string> => {
  return { ...COMPONENT_PANEL_COLORS };
};

/**
 * Check if a component type has a defined color
 * @param componentType - The component type to check
 * @returns True if the component has a defined color
 */
export const hasComponentPanelColor = (componentType: string): boolean => {
  return componentType in COMPONENT_PANEL_COLORS;
};

/**
 * Update a component's color (for dynamic color changes)
 * @param componentType - The component type to update
 * @param color - The new hex color code
 */
export const updateComponentPanelColor = (componentType: string, color: string): void => {
  COMPONENT_PANEL_COLORS[componentType] = color;
};
