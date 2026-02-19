// @ts-nocheck
/**
 * Boundary Manager - Ensures components stay within floor plan boundaries
 * and auto-adjusts floor plan dimensions when needed
 */

/**
 * Check if an item is within the floor plan boundary
 * @param {Object} item - The item to check
 * @param {Object} floorPlan - The floor plan boundary component
 * @returns {boolean} - True if item is within bounds
 */
export const isItemWithinBoundary = (item, floorPlan) => {
  if (!floorPlan || !item) return true;
  
  const itemRight = item.x + item.width;
  const itemBottom = item.y + item.height;
  const floorRight = floorPlan.x + floorPlan.width;
  const floorBottom = floorPlan.y + floorPlan.height;
  
  return (
    item.x >= floorPlan.x &&
    item.y >= floorPlan.y &&
    itemRight <= floorRight &&
    itemBottom <= floorBottom
  );
};

/**
 * Constrain item position to stay within floor plan boundary
 * @param {Object} item - The item to constrain
 * @param {Object} floorPlan - The floor plan boundary component
 * @returns {Object} - Constrained position {x, y}
 */
export const constrainToBoundary = (item, floorPlan) => {
  if (!floorPlan || !item) return { x: item.x, y: item.y };
  
  const padding = floorPlan.containerPadding || 20;
  const minX = floorPlan.x + padding;
  const minY = floorPlan.y + padding;
  const maxX = floorPlan.x + floorPlan.width - padding - item.width;
  const maxY = floorPlan.y + floorPlan.height - padding - item.height;
  
  return {
    x: Math.max(minX, Math.min(item.x, maxX)),
    y: Math.max(minY, Math.min(item.y, maxY))
  };
};

/**
 * Calculate required floor plan dimensions to contain all items
 * @param {Array} items - All items in the layout
 * @param {Object} currentFloorPlan - Current floor plan component
 * @returns {Object} - Required dimensions {width, height, needsResize}
 */
export const calculateRequiredBoundarySize = (items, currentFloorPlan) => {
  if (!currentFloorPlan || items.length === 0) {
    return { width: currentFloorPlan?.width || 800, height: currentFloorPlan?.height || 500, needsResize: false };
  }
  
  const padding = currentFloorPlan.containerPadding || 20;
  const gridSize = 60; // Major grid size for floor plan
  
  // Find the maximum extents of all items (excluding the floor plan itself)
  let maxRight = currentFloorPlan.x;
  let maxBottom = currentFloorPlan.y;
  
  items.forEach(item => {
    if (item.id === currentFloorPlan.id) return; // Skip floor plan itself
    if (item.containerLevel === 1) return; // Skip other boundaries
    
    const itemRight = item.x + item.width;
    const itemBottom = item.y + item.height;
    
    maxRight = Math.max(maxRight, itemRight);
    maxBottom = Math.max(maxBottom, itemBottom);
  });
  
  // Calculate required dimensions with padding
  const requiredWidth = maxRight - currentFloorPlan.x + padding;
  const requiredHeight = maxBottom - currentFloorPlan.y + padding;
  
  // Snap to grid
  const snappedWidth = Math.ceil(requiredWidth / gridSize) * gridSize;
  const snappedHeight = Math.ceil(requiredHeight / gridSize) * gridSize;
  
  // Check if resize is needed
  const needsResize = snappedWidth > currentFloorPlan.width || snappedHeight > currentFloorPlan.height;
  
  return {
    width: Math.max(currentFloorPlan.width, snappedWidth),
    height: Math.max(currentFloorPlan.height, snappedHeight),
    needsResize
  };
};

/**
 * Auto-adjust floor plan to fit all items
 * @param {Array} items - All items in the layout
 * @param {Function} onUpdateItem - Callback to update floor plan dimensions
 * @returns {Object} - Updated floor plan or null if no update needed
 */
export const autoAdjustFloorPlan = (items, onUpdateItem) => {
  // Find the floor plan (containerLevel === 1)
  const floorPlan = items.find(item => item.containerLevel === 1 && item.isContainer);
  
  if (!floorPlan) return null;
  
  const { width, height, needsResize } = calculateRequiredBoundarySize(items, floorPlan);
  
  if (needsResize) {
    onUpdateItem(floorPlan.id, { width, height });
    return { id: floorPlan.id, width, height };
  }
  
  return null;
};

/**
 * Validate item placement and return corrected position
 * @param {Object} item - The item being placed/moved
 * @param {Array} allItems - All items in the layout
 * @returns {Object} - Validated position {x, y, isValid}
 */
export const validateItemPlacement = (item, allItems) => {
  // Find the floor plan
  const floorPlan = allItems.find(i => i.containerLevel === 1 && i.isContainer);
  
  if (!floorPlan) {
    return { x: item.x, y: item.y, isValid: true };
  }
  
  // Check if item is within bounds
  const isWithin = isItemWithinBoundary(item, floorPlan);
  
  if (isWithin) {
    return { x: item.x, y: item.y, isValid: true };
  }
  
  // Constrain to boundary
  const constrained = constrainToBoundary(item, floorPlan);
  
  return {
    x: constrained.x,
    y: constrained.y,
    isValid: false,
    needsBoundaryExpansion: true
  };
};

/**
 * Check if item resize would exceed floor plan boundary
 * @param {Object} item - The item being resized
 * @param {number} newWidth - New width
 * @param {number} newHeight - New height
 * @param {Array} allItems - All items in the layout
 * @returns {Object} - Validation result {isValid, constrainedWidth, constrainedHeight}
 */
export const validateItemResize = (item, newWidth, newHeight, allItems) => {
  const floorPlan = allItems.find(i => i.containerLevel === 1 && i.isContainer);
  
  if (!floorPlan) {
    return { isValid: true, constrainedWidth: newWidth, constrainedHeight: newHeight };
  }
  
  const padding = floorPlan.containerPadding || 20;
  const maxWidth = floorPlan.x + floorPlan.width - padding - item.x;
  const maxHeight = floorPlan.y + floorPlan.height - padding - item.y;
  
  const constrainedWidth = Math.min(newWidth, maxWidth);
  const constrainedHeight = Math.min(newHeight, maxHeight);
  
  const isValid = constrainedWidth === newWidth && constrainedHeight === newHeight;
  
  return {
    isValid,
    constrainedWidth: Math.max(15, constrainedWidth), // Minimum size
    constrainedHeight: Math.max(15, constrainedHeight),
    needsBoundaryExpansion: !isValid
  };
};

/**
 * Get floor plan component from items array
 * @param {Array} items - All items in the layout
 * @returns {Object|null} - Floor plan component or null
 */
export const getFloorPlan = (items) => {
  return items.find(item => item.containerLevel === 1 && item.isContainer) || null;
};

/**
 * Check if any items are outside the floor plan
 * @param {Array} items - All items in the layout
 * @returns {Array} - Array of items that are outside bounds
 */
export const getItemsOutsideBoundary = (items) => {
  const floorPlan = getFloorPlan(items);
  
  if (!floorPlan) return [];
  
  return items.filter(item => {
    if (item.id === floorPlan.id) return false;
    if (item.containerLevel === 1) return false;
    return !isItemWithinBoundary(item, floorPlan);
  });
};
