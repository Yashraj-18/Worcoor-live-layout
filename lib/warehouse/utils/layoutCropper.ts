// @ts-nocheck
/**
 * Layout Cropper Utility
 * Eliminates white space from warehouse layouts by cropping to actual content bounds
 */

import { COMPONENT_TYPES } from '../constants/warehouseComponents';

export class LayoutCropper {
  /**
   * Calculate the bounding box of all warehouse content
   * Uses aggressive cropping to eliminate all unnecessary white space
   */
  static calculateContentBounds(items) {
    if (!items || items.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }

    // Calculate bounds from ALL items (most aggressive approach)
    const bounds = items.reduce((acc, item) => ({
      minX: Math.min(acc.minX, item.x),
      minY: Math.min(acc.minY, item.y),
      maxX: Math.max(acc.maxX, item.x + item.width),
      maxY: Math.max(acc.maxY, item.y + item.height)
    }), {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });

    // Use minimal padding for tightest crop
    const padding = 10; // Reduced from 20-50 to 10
    
    return {
      minX: bounds.minX - padding,
      minY: bounds.minY - padding,
      maxX: bounds.maxX + padding,
      maxY: bounds.maxY + padding,
      width: (bounds.maxX - bounds.minX) + (padding * 2),
      height: (bounds.maxY - bounds.minY) + (padding * 2)
    };
  }

  /**
   * Crop layout by adjusting all item positions to eliminate white space
   */
  static cropLayout(items) {
    if (!items || items.length === 0) {
      return {
        croppedItems: [],
        bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 },
        offset: { x: 0, y: 0 }
      };
    }

    // Calculate content bounds
    const bounds = this.calculateContentBounds(items);
    
    // Calculate offset to move content to origin (0,0)
    const offset = {
      x: bounds.minX,
      y: bounds.minY
    };

    // Adjust all item positions relative to the new bounds
    const croppedItems = items.map(item => ({
      ...item,
      x: item.x - offset.x,
      y: item.y - offset.y
    }));

    // Update bounds to start from origin
    const croppedBounds = {
      minX: 0,
      minY: 0,
      maxX: bounds.width,
      maxY: bounds.height,
      width: bounds.width,
      height: bounds.height
    };

    return {
      croppedItems,
      bounds: croppedBounds,
      offset,
      originalBounds: bounds
    };
  }

  /**
   * Create a focused operational map by cropping to tightest possible bounds
   */
  static createOperationalMap(items) {
    const cropResult = this.cropLayout(items);
    
    // Additional metadata for operational maps
    const floorPlanComponents = cropResult.croppedItems.filter(item => 
      item.type === COMPONENT_TYPES.SQUARE_BOUNDARY
    );
    
    const operationalComponents = cropResult.croppedItems.filter(item => 
      item.type !== COMPONENT_TYPES.SQUARE_BOUNDARY
    );

    // Calculate space efficiency
    const originalArea = cropResult.originalBounds.width * cropResult.originalBounds.height;
    const croppedArea = cropResult.bounds.width * cropResult.bounds.height;
    const spaceEfficiency = Math.round((croppedArea / originalArea) * 100);

    return {
      ...cropResult,
      metadata: {
        totalComponents: cropResult.croppedItems.length,
        floorPlanComponents: floorPlanComponents.length,
        operationalComponents: operationalComponents.length,
        croppedDimensions: {
          width: Math.round(cropResult.bounds.width),
          height: Math.round(cropResult.bounds.height)
        },
        whitespaceRemoved: {
          x: Math.round(cropResult.offset.x),
          y: Math.round(cropResult.offset.y)
        },
        spaceEfficiency: spaceEfficiency,
        compressionRatio: Math.round((1 - (croppedArea / originalArea)) * 100)
      }
    };
  }

  /**
   * Ultra-tight cropping with zero padding for maximum space efficiency
   */
  static createUltraTightCrop(items) {
    if (!items || items.length === 0) {
      return {
        croppedItems: [],
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
        offset: { x: 0, y: 0 }
      };
    }

    // Calculate bounds with zero padding
    const bounds = items.reduce((acc, item) => ({
      minX: Math.min(acc.minX, item.x),
      minY: Math.min(acc.minY, item.y),
      maxX: Math.max(acc.maxX, item.x + item.width),
      maxY: Math.max(acc.maxY, item.y + item.height)
    }), {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });

    // Zero padding for ultra-tight crop
    const offset = {
      x: bounds.minX,
      y: bounds.minY
    };

    // Adjust all item positions to start from (0,0)
    const croppedItems = items.map(item => ({
      ...item,
      x: item.x - offset.x,
      y: item.y - offset.y
    }));

    const croppedBounds = {
      minX: 0,
      minY: 0,
      maxX: bounds.maxX - bounds.minX,
      maxY: bounds.maxY - bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY
    };

    return {
      croppedItems,
      bounds: croppedBounds,
      offset,
      originalBounds: bounds
    };
  }

  /**
   * Generate preview dimensions for cropped layout
   */
  static getPreviewDimensions(items, maxWidth = 400, maxHeight = 300) {
    const cropResult = this.cropLayout(items);
    const { width, height } = cropResult.bounds;
    
    // Calculate scale to fit within preview dimensions
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      scale,
      originalWidth: width,
      originalHeight: height
    };
  }

  /**
   * Validate if layout has meaningful content to crop
   */
  static hasValidContent(items) {
    if (!items || items.length === 0) return false;
    
    // Check if we have at least one floor plan boundary or multiple components
    const hasFloorPlan = items.some(item => item.type === COMPONENT_TYPES.SQUARE_BOUNDARY);
    const hasMultipleComponents = items.length > 1;
    
    return hasFloorPlan || hasMultipleComponents;
  }

  /**
   * Get cropping statistics for debugging/info
   */
  static getCroppingStats(items) {
    if (!items || items.length === 0) {
      return { message: "No items to analyze" };
    }

    const originalBounds = this.calculateContentBounds(items);
    const cropResult = this.cropLayout(items);
    const ultraTightResult = this.createUltraTightCrop(items);
    
    return {
      originalDimensions: {
        width: Math.round(originalBounds.width),
        height: Math.round(originalBounds.height)
      },
      standardCroppedDimensions: {
        width: Math.round(cropResult.bounds.width),
        height: Math.round(cropResult.bounds.height)
      },
      ultraTightDimensions: {
        width: Math.round(ultraTightResult.bounds.width),
        height: Math.round(ultraTightResult.bounds.height)
      },
      whitespaceRemoved: {
        standard: {
          x: Math.round(cropResult.offset.x),
          y: Math.round(cropResult.offset.y)
        },
        ultraTight: {
          x: Math.round(ultraTightResult.offset.x),
          y: Math.round(ultraTightResult.offset.y)
        }
      },
      itemsProcessed: items.length,
      hasFloorPlan: items.some(item => item.type === COMPONENT_TYPES.SQUARE_BOUNDARY),
      spaceEfficiency: {
        standard: Math.round((cropResult.bounds.width * cropResult.bounds.height) / (originalBounds.width * originalBounds.height) * 100),
        ultraTight: Math.round((ultraTightResult.bounds.width * ultraTightResult.bounds.height) / (originalBounds.width * originalBounds.height) * 100)
      }
    };
  }
}

export default LayoutCropper;
