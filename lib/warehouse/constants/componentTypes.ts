// @ts-nocheck
/**
 * Component Types Constants
 * 
 * Defines all warehouse component type identifiers.
 * This file is separate to avoid circular dependencies.
 */

export const COMPONENT_TYPES = {
  // Basic structural elements
  WAREHOUSE_BLOCK: 'warehouse_block',
  STORAGE_ZONE: 'storage_zone',
  CONTAINER_UNIT: 'container_unit',
  ZONE_DIVIDER: 'zone_divider',
  AREA_BOUNDARY: 'area_boundary',
  
  // Floor Plan Components
  SQUARE_BOUNDARY: 'square_boundary',
  
  // Storage Components (1×1 to 2×2)
  STORAGE_UNIT: 'storage_unit',
  SKU_HOLDER: 'sku_holder',
  VERTICAL_SKU_HOLDER: 'vertical_sku_holder',
  
  // Common Areas
  FIRE_EXIT_MARKING: 'fire_exit_marking',
  SECURITY_AREA: 'security_area',
  RESTROOMS_AREA: 'restrooms_area',
  PATHWAYS_ARROWS: 'pathways_arrows',
  
  // Office Spaces
  CONFERENCE_ROOM: 'conference_room',
  MEETING_ROOMS: 'meeting_rooms',
  PANTRY_AREA: 'pantry_area',
  OPEN_STAGE: 'open_stage',
  SEATING_AREA: 'seating_area',
  BOOTHS: 'booths',
  GENERAL_AREA: 'general_area',
  
  // Primary Warehouse Operations
      DISPATCH_GATES: 'dispatch_gates',
  INBOUND_GATES: 'inbound_gates'
};
