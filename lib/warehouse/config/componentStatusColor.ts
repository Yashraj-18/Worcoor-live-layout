/**
 * Component Status Color Configuration
 * 
 * Entry point for storage component status colors and borders.
 * This file serves as the centralized location where all storage components
 * (storage units and storage racks) fetch their status colors and border configurations.
 * 
 * Current Implementation: All variants use 'transparent' with status-based borders
 * Status-based borders represent location tag and SKU assignment status:
 * - Green: Location tags attached to component AND SKUs assigned to those location tags
 * - Orange: Partially used (currently commented out/not in use)
 * - Red: Location tags attached to component BUT no SKUs assigned
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
  /** Green - Location tags attached AND SKUs assigned */
  full: string;
  /** Orange - Partially used (not currently in use) */
  partial: string;
  /** Red - Location tags attached BUT no SKUs assigned */
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
 * - full (Green): Location tags attached AND SKUs assigned to those location tags
 * - partial (Orange): Currently not in use (commented out)
 * - empty (Red): Location tags attached BUT no SKUs assigned
 * - unknown (Black): No location tags attached (default in layout editor)
 */
export const CAPACITY_BORDER_COLORS: CapacityBorderColors = {
  full: '#2E7D32',      // Dark Green - Location tags attached + SKUs assigned
  partial: '#FF9800',   // Orange - Partially used (not currently in use)
  empty: '#C62828',     // Dark Red - Location tags attached but no SKUs assigned
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
  // If no location assigned, use gray border
  if (!hasLocation) {
    return `1px solid ${CAPACITY_BORDER_COLORS.unknown}`;
  }
  
  // If location assigned, use capacity-based color
  const color = capacityStatus 
    ? getCapacityBorderColor(capacityStatus)
    : STORAGE_COMPONENT_BORDER_CONFIG.color;
  
  return `2px solid ${color}`;
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
  
  // Note: 'partial' status is currently not in use (commented out)
};
