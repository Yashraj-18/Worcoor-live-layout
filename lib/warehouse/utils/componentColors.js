import { COMPONENT_COLORS } from '../constants/warehouseComponents';

/**
 * Get the fixed color for a component type
 * @param {string} componentType - The component type
 * @param {string} category - The storage category (optional)
 * @returns {string} - The fixed color hex code
 */
export const getComponentColor = (componentType, category = null) => {
  // Always return transparent for all components
  return 'transparent';
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
      // Force storage units to use transparent color regardless of category
      const correctedColor = 'transparent';
      
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
    'Square Boundary': { color: 'transparent', description: 'Main warehouse boundary' }
  },
  'Boundaries': {
    'Solid Boundary': { color: 'transparent', description: 'Solid zone divisions' },
    'Dotted Boundary': { color: 'transparent', description: 'Dotted zone divisions' }
  },
  'Storage Components': {
    'Storage Unit': { color: 'transparent', description: 'Storage containers/units' },
    'Horizontal Storage Rack': { color: 'transparent', description: 'Horizontal storage racks/shelves' },
    'Vertical Storage Rack': { color: 'transparent', description: 'Vertical storage racks/shelves' }
  },
  'Zone Components': {
    'Warehouse Block': { color: 'transparent', description: 'Warehouse blocks' },
    'Storage Zone': { color: 'transparent', description: 'Storage zones' },
    'Processing Area': { color: 'transparent', description: 'Processing areas' },
    'Container Unit': { color: 'transparent', description: 'Container units' },
    'Zone Divider': { color: 'transparent', description: 'Zone dividers' },
    'Area Boundary': { color: 'transparent', description: 'Area boundaries' }
  }
};
