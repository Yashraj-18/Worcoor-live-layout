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
  [COMPONENT_TYPES.SQUARE_BOUNDARY]: '#263238',        // Dark Gray - Main warehouse boundary
  
  // Boundary Components
  [COMPONENT_TYPES.SOLID_BOUNDARY]: '#607D8B',         // Blue Gray - Solid divisions
  [COMPONENT_TYPES.DOTTED_BOUNDARY]: '#90A4AE',        // Light Blue Gray - Dotted divisions
  
  // Storage Components (1×1 to 2×2)
  [COMPONENT_TYPES.STORAGE_UNIT]: 'transparent',       // Transparent - No color (fresh start)
  [COMPONENT_TYPES.SKU_HOLDER]: 'transparent',             // Transparent - Horizontal storage racks
  [COMPONENT_TYPES.VERTICAL_SKU_HOLDER]: 'transparent',    // Transparent - Vertical storage racks
  [COMPONENT_TYPES.SPARE_UNIT]: '#8D6E63',             // Brown - Spare units
  
  // Zone Components
  [COMPONENT_TYPES.WAREHOUSE_BLOCK]: '#FF9800',        // Orange - Warehouse blocks
  [COMPONENT_TYPES.STORAGE_ZONE]: '#9C27B0',           // Purple - Storage zones
  [COMPONENT_TYPES.PROCESSING_AREA]: '#F44336',        // Red - Processing areas
  [COMPONENT_TYPES.CONTAINER_UNIT]: '#00BCD4',         // Cyan - Container units
  [COMPONENT_TYPES.ZONE_DIVIDER]: '#795548',           // Brown - Zone dividers
  [COMPONENT_TYPES.AREA_BOUNDARY]: '#607D8B',          // Blue Gray - Area boundaries
  
  // Common Areas
  [COMPONENT_TYPES.FIRE_EXIT_MARKING]: '#D32F2F',      // Dark Red - Fire exit markings
  [COMPONENT_TYPES.SECURITY_AREA]: '#546E7A',          // Blue Gray - Security areas
  [COMPONENT_TYPES.RESTROOMS_AREA]: '#B0BEC5',         // Light Blue Gray - Restrooms
  [COMPONENT_TYPES.PATHWAYS_ARROWS]: '#FFEB3B',        // Yellow - Pathway arrows
  
  // Office Spaces
  [COMPONENT_TYPES.CONFERENCE_ROOM]: '#3F51B5',        // Indigo - Conference rooms
  [COMPONENT_TYPES.MEETING_ROOMS]: '#009688',          // Teal - Meeting rooms
  [COMPONENT_TYPES.PANTRY_AREA]: '#795548',            // Brown - Pantry area
  [COMPONENT_TYPES.OPEN_STAGE]: '#E91E63',             // Pink - Open stage
  [COMPONENT_TYPES.SEATING_AREA]: '#607D8B',           // Blue Gray - Seating area
  [COMPONENT_TYPES.BOOTHS]: '#FF5722',                 // Deep Orange - Booths
  [COMPONENT_TYPES.GENERAL_AREA]: '#9E9E9E',           // Gray - General area
  
  // Primary Warehouse Operations
  [COMPONENT_TYPES.OPEN_STORAGE_SPACE]: '#4CAF50',     // Green - Open storage space
  [COMPONENT_TYPES.DISPATCH_STAGING_AREA]: '#FF9800',  // Orange - Dispatch staging
  [COMPONENT_TYPES.DISPATCH_GATES]: '#2196F3',         // Blue - Dispatch gates
  [COMPONENT_TYPES.INBOUND_GATES]: '#00BCD4',          // Cyan - Inbound gates
  [COMPONENT_TYPES.GRADING_AREA]: '#9C27B0',           // Purple - Grading area
  [COMPONENT_TYPES.PACKAGING_AREA]: '#FF5722',         // Deep Orange - Packaging area
  [COMPONENT_TYPES.OFFICE_SPACE_AREA]: '#607D8B',      // Blue Gray - Office space area
  [COMPONENT_TYPES.COLD_STORAGE]: '#00BCD4',           // Cyan Blue - Cold storage
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
