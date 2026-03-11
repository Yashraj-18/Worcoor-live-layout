/**
 * Component Status Color Configuration
 * 
 * Entry point for storage component status colors and borders.
 * This file serves as the centralized location where all storage components
 * (storage units and storage racks) fetch their status colors and border configurations.
 * 
 * Current Implementation: All variants use 'transparent' with status-based borders
 * Status-based borders represent location tag and SKU assignment status:
 * - Red: Location tags attached to component AND SKUs assigned to those location tags
 * - Orange: Partially configured - some location tags have SKUs, others don't
 * - Green: Location tags attached to component BUT no SKUs assigned
 * - Black: No location tags attached (default in layout editor)
 * 
 * Applies to:
 * - Storage Unit variants (8 types)
 * - Horizontal Storage Rack (compartment-based)
 * - Vertical Storage Rack (compartment-based with levels)
 * 
 * Color Format: Hex color codes (e.g., '#4CAF50') or 'transparent'
 * Border Format: CSS border string (e.g., '1px solid #000000')
 */

/**
 * Storage capacity status types
 */
export type CapacityStatus = 'full' | 'partial' | 'empty' | 'unknown';

/**
 * Border configuration for storage components
 */
export interface StorageComponentBorderConfig {
  /** Border when no location is assigned */
  noLocation: string;
  /** Border when location is assigned */
  withLocation: string;
  /** Border color (default) */
  color: string;
  /** Border radius */
  borderRadius: number;
}

/**
 * Status-based border colors for location tag and SKU assignment representation
 */
export interface CapacityBorderColors {
  /** Red - Location tags attached AND SKUs assigned */
  full: string;
  /** Orange - Partially configured - some location tags have SKUs, others don't */
  partial: string;
  /** Green - Location tags attached BUT no SKUs assigned */
  empty: string;
  /** Black - No location tags attached (default) */
  unknown: string;
}

/**
 * Storage Component Status Colors
 * All storage components fetch their colors from here
 */
export const STORAGE_COMPONENT_STATUS_COLORS: Record<string, string> = {
  // Storage Unit Variants
  'Storage Unit': 'transparent',
  'Open Storage Space': 'transparent',
  'Dispatch Staging Area': 'transparent',
  'Grading Area': 'transparent',
  'Processing Area': 'transparent',
  'Production Area': 'transparent',
  'Packaging Area': 'transparent',
  'Cold Storage': 'transparent',
  
  // Storage Racks
  'Horizontal Storage Rack': 'transparent',
  'Vertical Storage Rack': 'transparent',
};

/**
 * Capacity-based border colors
 * Colors represent location tag and SKU assignment status:
 * - full (Red): Location tags attached AND SKUs assigned to those location tags
 * - partial (Orange): Partially configured - some location tags have SKUs, others don't
 * - empty (Green): Location tags attached BUT no SKUs assigned
 * - unknown (Black): No location tags attached (default in layout editor)
 */
export const CAPACITY_BORDER_COLORS: CapacityBorderColors = {
  full: '#B71C1C',      // Red - SKUs assigned (utilised)
  partial: '#E65100',   // Orange - Partially configured
  empty: '#1B5E20',     // Green - No SKUs assigned (available)
  unknown: '#000000',   // Black - No location tags attached (default)
};

/**
 * Storage Component Border Configuration
 * All storage unit variants fetch their border styles from here
 */
export const STORAGE_COMPONENT_BORDER_CONFIG: StorageComponentBorderConfig = {
  noLocation: '1px solid #000000',      // Black border when no location assigned
  withLocation: '2px solid #000000',    // Black border when location assigned (until backend data available)
  color: '#000000',                     // Default border color (black - no backend data)
  borderRadius: 0,                      // Sharp corners, no rounding
};

/**
 * Get the status color for a storage component
 * @param componentName - The name of the storage component
 * @returns Color value (currently 'transparent' for all)
 */
export const getStorageComponentStatusColor = (componentName: string): string => {
  return STORAGE_COMPONENT_STATUS_COLORS[componentName] || 'transparent';
};

/**
 * Get the border color based on capacity status
 * @param capacityStatus - The capacity status from backend
 * @returns Hex color code for the border
 */
export const getCapacityBorderColor = (capacityStatus: CapacityStatus): string => {
  return CAPACITY_BORDER_COLORS[capacityStatus] || CAPACITY_BORDER_COLORS.unknown;
};

/**
 * Get the border style for a storage component
 * @param hasLocation - Whether the component has a location assigned
 * @param capacityStatus - Optional capacity status from backend
 * @returns CSS border string
 */
export const getStorageComponentBorder = (
  hasLocation: boolean, 
  capacityStatus?: CapacityStatus
): string => {
  // If no location assigned, use thin gray border
  if (!hasLocation) {
    return `1px solid ${CAPACITY_BORDER_COLORS.unknown}`;
  }
  
  // If location assigned, use thick capacity-based color for better visibility
  const color = capacityStatus 
    ? getCapacityBorderColor(capacityStatus)
    : STORAGE_COMPONENT_BORDER_CONFIG.color;
  
  return `4px solid ${color}`;  // 4px for better visibility
};

/**
 * Get the complete border configuration
 * @returns Border configuration object
 */
export const getStorageComponentBorderConfig = (): StorageComponentBorderConfig => {
  return { ...STORAGE_COMPONENT_BORDER_CONFIG };
};

/**
 * Get all storage component status colors
 * @returns Record of all component names and their status colors
 */
export const getAllStorageComponentStatusColors = (): Record<string, string> => {
  return { ...STORAGE_COMPONENT_STATUS_COLORS };
};

/**
 * Determine capacity status based on location tags and SKU assignments
 * @param hasLocationTags - Whether location tags are attached to the component
 * @param hasSkusAssigned - Whether SKUs are assigned to those location tags
 * @returns CapacityStatus based on the new logic
 */
export const determineCapacityStatus = (
  hasLocationTags: boolean,
  hasSkusAssigned: boolean
): CapacityStatus => {
  // No location tags attached - default state in layout editor
  if (!hasLocationTags) {
    return 'unknown';
  }
  
  // Location tags attached AND SKUs assigned - fully configured
  if (hasSkusAssigned) {
    return 'full';
  }
  
  // Location tags attached BUT no SKUs assigned - needs SKU assignment
  return 'empty';
};

/**
 * Enhanced capacity status determination for multi-location components
 * Evaluates all location tags to determine accurate status
 * @param locationIds - Array of location IDs assigned to the component
 * @param locationTagsMap - Backend location tags data with SKU counts
 * @returns CapacityStatus based on comprehensive evaluation of all locations
 */
export const determineCapacityStatusForMultiLocation = (
  locationIds: string[],
  locationTagsMap: Record<string, any>
): CapacityStatus => {
  
  // No location IDs provided
  if (!locationIds || locationIds.length === 0) {
    return 'unknown';  // Black - no locations
  }

  // Get valid location tags from backend
  const locationTags = locationIds
    .map(id => {
      const tag = locationTagsMap[id];
      if (tag) {
        return {
          id: tag.id,
          name: tag.locationTagName,
          currentItems: tag.currentItems,
          capacity: tag.capacity
        };
      }
      return tag;
    })
    .filter(tag => tag !== undefined && tag !== null);


  // Check if we have missing locations (requested but not found in map)
  const missingLocationCount = locationIds.length - locationTags.length;

  // If no location tags found at all, return unknown
  if (locationTags.length === 0 && missingLocationCount === 0) {
    return 'unknown';  // Black - no valid location tags
  }

  // Count locations with SKUs assigned
  const locationsWithSkus = locationTags.filter(tag => tag.currentItems > 0);
  const totalLocations = locationIds.length; // Use requested count, not found count
  const locationsWithSkusCount = locationsWithSkus.length;

  
  // All locations have SKUs assigned - fully configured
  if (locationsWithSkusCount === totalLocations) {
    return 'full';     // Green - all have SKUs
  } 
  // No locations have SKUs assigned - completely empty
  else if (locationsWithSkusCount === 0) {
    return 'empty';    // Red - none have SKUs
  } 
  // Mixed scenario - some have SKUs, some don't (including missing locations)
  else {
    return 'partial';  // Orange - partially configured
  }
};

/**
 * Extract all location IDs from a component (handles both single and multi-location)
 * @param item - Component item data
 * @param compartmentData - Optional compartment data for rack compartments
 * @returns Array of all location IDs
 */
export const extractAllLocationIds = (
  item: any, 
  compartmentData?: any
): string[] => {
  const locationIds: string[] = [];

  // For compartments (rack storage)
  if (compartmentData) {
    // Add single location IDs
    if (compartmentData.locationId) {
      locationIds.push(compartmentData.locationId);
    }
    if (compartmentData.primaryLocationId) {
      locationIds.push(compartmentData.primaryLocationId);
    }
    if (compartmentData.uniqueId) {
      locationIds.push(compartmentData.uniqueId);
    }
    
    // Add array of location IDs (multi-location support)
    if (Array.isArray(compartmentData.locationIds)) {
      locationIds.push(...compartmentData.locationIds);
    }
    
    // Add location IDs from level mappings (vertical racks)
    if (Array.isArray(compartmentData.levelLocationMappings)) {
      compartmentData.levelLocationMappings.forEach((mapping: any) => {
        const locId = mapping?.locationId || mapping?.locId;
        if (locId) {
          locationIds.push(locId);
        }
      });
    }
  } 
  // For storage units and other components
  else {
    // Add single location IDs
    if (item.locationId) {
      locationIds.push(item.locationId);
    }
    if (item.locationData?.primaryLocationId) {
      locationIds.push(item.locationData.primaryLocationId);
    }
    if (item.inventoryData?.locationId) {
      locationIds.push(item.inventoryData.locationId);
    }
    if (item.inventoryData?.uniqueId) {
      locationIds.push(item.inventoryData.uniqueId);
    }
    
    // Add array of location IDs (multi-location support)
    if (Array.isArray(item.locationData?.locationIds)) {
      locationIds.push(...item.locationData.locationIds);
    }
  }

  // Remove duplicates and filter out empty strings
  return Array.from(new Set(locationIds.filter(id => id && id.trim() !== '')));
};
