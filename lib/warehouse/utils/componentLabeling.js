/**
 * Enhanced Component Labeling System
 * Generates consistent, professional display names for warehouse components
 */

import { COMPONENT_TYPES } from '../constants/warehouseComponents';

/**
 * Generate automatic label for storage components with enhanced formatting
 * @param {string} componentType - The component type
 * @param {number} index - The component index
 * @param {string} category - The storage category (optional)
 * @returns {string} - Generated label
 */
export const generateStorageComponentLabel = (componentType, index, category = null) => {
  const componentLabels = {
    [COMPONENT_TYPES.STORAGE_UNIT]: 'SU',
    [COMPONENT_TYPES.SKU_HOLDER]: 'HSR',
    [COMPONENT_TYPES.VERTICAL_SKU_HOLDER]: 'VSR'
  };

  const prefix = componentLabels[componentType];
  if (!prefix) return null;

  const baseLabel = `${prefix}-${String(index).padStart(3, '0')}`;
  
  // Add category suffix for storage units only
  if (componentType === COMPONENT_TYPES.STORAGE_UNIT && category) {
    const categoryLabels = {
      'dry_storage': 'DS',
      'cold_storage': 'CS', 
      'hazardous': 'HZ',
      'fragile': 'FR',
      'bulk': 'BK'
    };
    
    const categorySuffix = categoryLabels[category];
    if (categorySuffix) {
      return `${baseLabel}-${categorySuffix}`;
    }
  }
  
  return baseLabel;
};

/**
 * Legacy function for backward compatibility
 */
export const generateStorageUnitLabel = (componentType, index, category = null) => {
  return generateStorageComponentLabel(componentType, index, category);
};

/**
 * Generate display name for storage units based on category
 * @param {string} category - The storage category
 * @returns {string} - Display name
 */
export const getStorageUnitDisplayName = (category = null) => {
  const categoryNames = {
    'dry_storage': 'Dry Storage Unit',
    'cold_storage': 'Cold Storage Unit',
    'hazardous': 'Hazardous Storage Unit',
    'fragile': 'Fragile Storage Unit',
    'bulk': 'Bulk Storage Unit'
  };
  
  return categoryNames[category] || 'Storage Unit';
};

/**
 * Generate comprehensive label information for storage units
 * @param {object} item - The storage unit item
 * @param {number} index - The component index
 * @returns {object} - Label information
 */
export const generateStorageUnitLabelInfo = (item, index) => {
  if (item.type !== COMPONENT_TYPES.STORAGE_UNIT) {
    return null;
  }

  const autoLabel = generateStorageUnitLabel(item.type, index, item.category);
  const displayName = getStorageUnitDisplayName(item.category);
  // Enhanced category text formatting
  const getCategoryDisplayText = (category) => {
    const categoryDisplayNames = {
      'storage': 'Storage',
      'dry_storage': 'Dry Storage',
      'cold_storage': 'Cold Storage',
      'hazardous': 'Hazardous',
      'fragile': 'Fragile',
      'bulk': 'Bulk Storage'
    };
    return categoryDisplayNames[category] || 'Storage';
  };
  
  const categoryText = getCategoryDisplayText(item.category);

  return {
    autoLabel,
    displayName,
    categoryText,
    fullLabel: item.label || autoLabel,
    showCategory: true
  };
};

/**
 * Apply enhanced labeling to storage unit items
 * @param {array} items - Array of warehouse items
 * @returns {array} - Items with enhanced labeling
 */
export const applyEnhancedLabeling = (items) => {
  let storageUnitIndex = 1;
  
  return items.map(item => {
    if (item.type === COMPONENT_TYPES.STORAGE_UNIT) {
      const labelInfo = generateStorageUnitLabelInfo(item, storageUnitIndex);
      storageUnitIndex++;
      
      return {
        ...item,
        autoLabel: labelInfo.autoLabel,
        displayName: labelInfo.displayName,
        categoryText: labelInfo.categoryText,
        // Use custom label if provided, otherwise use auto-generated
        label: item.label || labelInfo.autoLabel,
        labelInfo: labelInfo
      };
    }
    
    return item;
  });
};

/**
 * Get label for display in different contexts
 * @param {object} item - The storage unit item
 * @param {string} context - Display context ('tooltip', 'properties', 'export')
 * @returns {string} - Appropriate label for context
 */
export const getContextualLabel = (item, context = 'default') => {
  if (item.type !== COMPONENT_TYPES.STORAGE_UNIT) {
    return item.name || item.label || 'Component';
  }

  // Priority: locationId > custom label > auto-generated label
  let displayLabel = '';
  
  // First check for location ID from dropdown selection
  if (item.locationId) {
    displayLabel = item.locationId;
  } else if (item.skuData && item.skuData.sku) {
    displayLabel = item.skuData.sku;
  } else if (item.label && item.label !== item.name) {
    displayLabel = item.label;
  } else {
    // Fallback to auto-generated label
    const labelInfo = item.labelInfo || generateStorageUnitLabelInfo(item, 1);
    displayLabel = labelInfo.fullLabel;
  }
  
  switch (context) {
    case 'tooltip':
      return `Storage Unit (${displayLabel})`;
    case 'properties':
      return displayLabel;
    case 'export':
      return `${displayLabel} - Storage Unit`;
    case 'category':
      const labelInfo = item.labelInfo || generateStorageUnitLabelInfo(item, 1);
      return labelInfo.categoryText;
    default:
      return displayLabel;
  }
};

/**
 * Validate and format custom labels for storage units
 * @param {string} customLabel - User-provided custom label
 * @param {string} componentType - The component type
 * @returns {object} - Validation result and formatted label
 */
export const validateStorageUnitLabel = (customLabel, componentType) => {
  if (componentType !== COMPONENT_TYPES.STORAGE_UNIT) {
    return { isValid: true, formattedLabel: customLabel };
  }

  // Remove extra spaces and validate format
  const trimmed = customLabel.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Label cannot be empty' };
  }
  
  if (trimmed.length > 20) {
    return { isValid: false, error: 'Label must be 20 characters or less' };
  }
  
  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validPattern = /^[A-Za-z0-9\-_\s]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Label can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true, formattedLabel: trimmed.toUpperCase() };
};
