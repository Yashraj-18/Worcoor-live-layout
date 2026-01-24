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
  PROCESSING_AREA: 'processing_area',
  CONTAINER_UNIT: 'container_unit',
  ZONE_DIVIDER: 'zone_divider',
  AREA_BOUNDARY: 'area_boundary',
  
  // Floor Plan Components
  SQUARE_BOUNDARY: 'square_boundary',
  
  // Boundaries
  SOLID_BOUNDARY: 'solid_boundary',
  DOTTED_BOUNDARY: 'dotted_boundary',
  
  // Storage Components (1×1 to 2×2)
  STORAGE_UNIT: 'storage_unit',
  SKU_HOLDER: 'sku_holder',
  VERTICAL_SKU_HOLDER: 'vertical_sku_holder',
  SPARE_UNIT: 'spare_unit',
  
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
  OPEN_STORAGE_SPACE: 'open_storage_space',
  DISPATCH_STAGING_AREA: 'dispatch_staging_area',
  DISPATCH_GATES: 'dispatch_gates',
  INBOUND_GATES: 'inbound_gates',
  GRADING_AREA: 'grading_area',
  PACKAGING_AREA: 'packaging_area',
  OFFICE_SPACE_AREA: 'office_space_area',
  COLD_STORAGE: 'cold_storage'
};
