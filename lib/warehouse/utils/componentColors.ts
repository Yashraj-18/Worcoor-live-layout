import { getComponentPanelColor } from '../config/componentPanelColors';

interface WarehouseItem {
  id?: string;
  type: string;
  category?: string;
  color?: string;
  [key: string]: any;
}

interface ColorLegendItem {
  color: string;
  description: string;
}

/**
 * Get the fixed color for a component type
 * @param componentType - The component type
 * @param category - The storage category (optional)
 * @returns The fixed color hex code
 */
export const getComponentColor = (componentType: string, category: string | null = null): string => {
  // Use the centralized color system
  const color = getComponentPanelColor(componentType);
  
  // Debug log for vertical storage racks
  if (componentType === 'vertical_sku_holder') {
    console.log(`Vertical storage rack color: ${color}`);
  }
  
  return color;
};

/**
 * Apply fixed color to a component item
 * @param item - The component item
 * @returns The item with fixed color applied
 */
export const applyFixedColor = (item: WarehouseItem): WarehouseItem => {
  return {
    ...item,
    color: getComponentColor(item.type, item.category || null)
  };
};

/**
 * Ensure all items in an array have fixed colors
 * @param items - Array of component items
 * @returns Items with fixed colors applied
 */
export const ensureFixedColors = (items: WarehouseItem[]): WarehouseItem[] => {
  return items.map(applyFixedColor);
};

/**
 * Force refresh colors for all storage units and storage racks to ensure they use transparent colors
 * @param items - Array of component items
 * @returns Items with corrected storage unit and storage rack colors
 */
export const forceRefreshStorageUnitColors = (items: WarehouseItem[]): WarehouseItem[] => {
  return items.map(item => {
    // Force Storage Units and Storage Racks to always be transparent
    if (item.type === 'storage_unit' || item.type === 'sku_holder' || item.type === 'vertical_sku_holder') {
      const correctedColor = 'transparent';
      
      console.log(`Force refreshing ${item.type} ${item.id}: ${item.color} -> ${correctedColor}`);
      
      return {
        ...item,
        color: correctedColor
      };
    }
    return item;
  });
};

/**
 * Color coding legend for UI display
 */
export const COLOR_LEGEND: Record<string, Record<string, ColorLegendItem>> = {
  'Floor Plan': {
    'Square Boundary': { color: '#263238', description: 'Main warehouse boundary' }
  },
  'Boundaries': {
    'Solid Boundary': { color: '#607D8B', description: 'Solid zone divisions' },
    'Dotted Boundary': { color: '#90A4AE', description: 'Dotted zone divisions' }
  },
  'Storage Components': {
    'Storage Unit': { color: 'transparent', description: 'Storage containers/units' },
    'Horizontal Storage Rack': { color: 'transparent', description: 'Horizontal storage racks/shelves' },
    'Vertical Storage Rack': { color: 'transparent', description: 'Vertical storage racks/shelves' }
  },
  'Zone Components': {
    'Warehouse Block': { color: '#FF9800', description: 'Warehouse blocks' },
    'Storage Zone': { color: '#9C27B0', description: 'Storage zones' },
    'Processing Area': { color: '#F44336', description: 'Processing areas' },
    'Container Unit': { color: '#00BCD4', description: 'Container units' },
    'Zone Divider': { color: '#795548', description: 'Zone dividers' },
    'Area Boundary': { color: '#607D8B', description: 'Area boundaries' }
  }
};
