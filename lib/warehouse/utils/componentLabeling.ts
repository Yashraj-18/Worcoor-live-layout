// @ts-nocheck
/**
 * Enhanced Component Labeling System
 * Generates consistent, professional display names for warehouse components
 */

import { COMPONENT_TYPES } from '../constants/warehouseComponents';

interface LabelInfo {
  autoLabel: string;
  displayName: string;
  categoryText: string;
  fullLabel: string;
  showCategory: boolean;
}

interface ValidationResult {
  isValid: boolean;
  formattedLabel?: string;
  error?: string;
}

interface WarehouseItem {
  type: string;
  category?: string;
  label?: string;
  name?: string;
  locationId?: string;
  skuData?: {
    sku?: string;
  };
  labelInfo?: LabelInfo;
  [key: string]: any;
}

/**
 * Generate automatic label for storage components with enhanced formatting
 * @param componentType - The component type
 * @param index - The component index
 * @param category - The storage category (optional)
 * @returns Generated label
 */
export const generateStorageComponentLabel = (componentType: string, index: number, category: string | null = null): string | null => {
  const componentLabels: Record<string, string> = {
    [COMPONENT_TYPES.STORAGE_UNIT]: 'SU',
    [COMPONENT_TYPES.SKU_HOLDER]: 'HSR',
    [COMPONENT_TYPES.VERTICAL_SKU_HOLDER]: 'VSR'
  };

  const prefix = componentLabels[componentType];
  if (!prefix) return null;

  const baseLabel = `${prefix}-${String(index).padStart(3, '0')}`;
  
  // Add category suffix for storage units only
  if (componentType === COMPONENT_TYPES.STORAGE_UNIT && category) {
    const categoryLabels: Record<string, string> = {
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
export const generateStorageUnitLabel = (componentType: string, index: number, category: string | null = null): string | null => {
  return generateStorageComponentLabel(componentType, index, category);
};

/**
 * Generate display name for storage units based on category
 * @param category - The storage category
 * @returns Display name
 */
export const getStorageUnitDisplayName = (category: string | null = null): string => {
  const categoryNames: Record<string, string> = {
    'dry_storage': 'Dry Storage Unit',
    'cold_storage': 'Cold Storage Unit',
    'hazardous': 'Hazardous Storage Unit',
    'fragile': 'Fragile Storage Unit',
    'bulk': 'Bulk Storage Unit'
  };
  
  return categoryNames[category || ''] || 'Storage Unit';
};

/**
 * Generate comprehensive label information for storage units
 * @param item - The storage unit item
 * @param index - The component index
 * @returns Label information
 */
export const generateStorageUnitLabelInfo = (item: WarehouseItem, index: number): LabelInfo | null => {
  if (item.type !== COMPONENT_TYPES.STORAGE_UNIT) {
    return null;
  }

  const autoLabel = generateStorageUnitLabel(item.type, index, item.category || null) || '';
  const displayName = getStorageUnitDisplayName(item.category || null);
  
  // Enhanced category text formatting
  const getCategoryDisplayText = (category?: string): string => {
    const categoryDisplayNames: Record<string, string> = {
      'storage': 'Storage',
      'dry_storage': 'Dry Storage',
      'cold_storage': 'Cold Storage',
      'hazardous': 'Hazardous',
      'fragile': 'Fragile',
      'bulk': 'Bulk Storage'
    };
    return categoryDisplayNames[category || ''] || 'Storage';
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
 * @param items - Array of warehouse items
 * @returns Items with enhanced labeling
 */
export const applyEnhancedLabeling = (items: WarehouseItem[]): WarehouseItem[] => {
  let storageUnitIndex = 1;
  
  return items.map(item => {
    if (item.type === COMPONENT_TYPES.STORAGE_UNIT) {
      const labelInfo = generateStorageUnitLabelInfo(item, storageUnitIndex);
      storageUnitIndex++;
      
      if (labelInfo) {
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
    }
    
    return item;
  });
};

/**
 * Get label for display in different contexts
 * @param item - The storage unit item
 * @param context - Display context ('tooltip', 'properties', 'export')
 * @returns Appropriate label for context
 */
export const getContextualLabel = (item: WarehouseItem, context: string = 'default'): string => {
  if (item.type !== COMPONENT_TYPES.STORAGE_UNIT) {
    return item.name || item.label || 'Component';
  }

  // Priority: locationId > custom label > auto-generated label
  let displayLabel = '';
  
  // First check for multiple location IDs
  if (item.locationData && item.locationData.isMultiLocation && item.locationData.locationIds) {
    const ids = item.locationData.locationIds;
    if (ids.length === 1) {
      displayLabel = ids[0];
    } else {
      displayLabel = `${ids[0]} +${ids.length - 1}`;
    }
  } else if (item.locationId) {
    displayLabel = item.locationId;
  } else if (item.skuData && item.skuData.sku) {
    displayLabel = item.skuData.sku;
  } else if (item.label && item.label !== item.name) {
    displayLabel = item.label;
  } else {
    // Fallback to auto-generated label
    const labelInfo = item.labelInfo || generateStorageUnitLabelInfo(item, 1);
    displayLabel = labelInfo ? labelInfo.fullLabel : '';
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
      return labelInfo ? labelInfo.categoryText : '';
    default:
      return displayLabel;
  }
};

/**
 * Validate and format custom labels for storage units
 * @param customLabel - User-provided custom label
 * @param componentType - The component type
 * @returns Validation result and formatted label
 */
export const validateStorageUnitLabel = (customLabel: string, componentType: string): ValidationResult => {
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
