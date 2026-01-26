import { COMPONENT_COLORS, STORAGE_CATEGORY_COLORS } from '../constants/warehouseComponents';

/**
 * Get the fixed color for a component type
 * @param {string} componentType - The component type
 * @param {string} category - The storage category (optional)
 * @returns {string} - The fixed color hex code
 */
export const getComponentColor = (componentType, category = null) => {
  // For storage units, always return the base green color unless a specific category is assigned
  if (componentType === 'storage_unit') {
    // If a category is specified and exists in STORAGE_CATEGORY_COLORS, use it
    if (category && STORAGE_CATEGORY_COLORS[category]) {
      return STORAGE_CATEGORY_COLORS[category];
    }
    // Otherwise, always return the fixed base green color for storage units
    return COMPONENT_COLORS[componentType] || '#4CAF50';
  }
  
  const color = COMPONENT_COLORS[componentType] || '#607D8B'; // Default to blue-gray if not found
  
  // Debug log for vertical storage racks
  if (componentType === 'vertical_sku_holder') {
    console.log(`Vertical storage rack color: ${color}`);
  }
  
  return color;
};

/**
 * Apply fixed color to a component item
 * @param {object} item - The component item
 * @returns {object} - The item with fixed color applied
 */
export const applyFixedColor = (item) => {
  return {
    ...item,
    color: getComponentColor(item.type, item.category)
  };
};

/**
 * Ensure all items in an array have fixed colors
 * @param {array} items - Array of component items
 * @returns {array} - Items with fixed colors applied
 */
export const ensureFixedColors = (items) => {
  return items.map(applyFixedColor);
};

/**
 * Force refresh colors for all storage units to ensure they use the base green color
 * @param {array} items - Array of component items
 * @returns {array} - Items with corrected storage unit colors
 */
export const forceRefreshStorageUnitColors = (items) => {
  return items.map(item => {
    if (item.type === 'storage_unit') {
      // Force storage units to use base green color unless they have a specific category
      const correctedColor = item.category && STORAGE_CATEGORY_COLORS[item.category] 
        ? STORAGE_CATEGORY_COLORS[item.category] 
        : COMPONENT_COLORS[item.type] || '#4CAF50';
      
      console.log(`Force refreshing storage unit ${item.id}: ${item.color} -> ${correctedColor} (category: ${item.category || 'none'})`);
      
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
export const COLOR_LEGEND = {
  'Floor Plan': {
    'Square Boundary': { color: '#263238', description: 'Main warehouse boundary' }
  },
  'Boundaries': {
    'Solid Boundary': { color: '#607D8B', description: 'Solid zone divisions' },
    'Dotted Boundary': { color: '#90A4AE', description: 'Dotted zone divisions' }
  },
  'Storage Components': {
    'Storage Unit': { color: '#4CAF50', description: 'Storage containers/units' },
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
