// @ts-nocheck
import { COMPONENT_TYPES } from '../constants/warehouseComponents';

// Structural elements that can be linked
export const LINKABLE_ELEMENTS = [
  COMPONENT_TYPES.WAREHOUSE_BLOCK,
  COMPONENT_TYPES.STORAGE_ZONE,
  COMPONENT_TYPES.PROCESSING_AREA,
  COMPONENT_TYPES.CONTAINER_UNIT,
  COMPONENT_TYPES.ZONE_DIVIDER,
  COMPONENT_TYPES.AREA_BOUNDARY
];

// Connection tolerance in pixels
const SNAP_TOLERANCE = 10;

// Check if two elements can be linked
export const canLink = (element1, element2) => {
  if (!LINKABLE_ELEMENTS.includes(element1.type) || !LINKABLE_ELEMENTS.includes(element2.type)) {
    return false;
  }
  
  // All container elements can potentially link with each other
  return true;
};

// Check if element is a container type
export const isContainer = (type) => {
  return [
    COMPONENT_TYPES.WAREHOUSE_BLOCK,
    COMPONENT_TYPES.STORAGE_ZONE,
    COMPONENT_TYPES.PROCESSING_AREA,
    COMPONENT_TYPES.CONTAINER_UNIT
  ].includes(type);
};

// Check if element is a divider type
export const isDivider = (type) => {
  return [
    COMPONENT_TYPES.ZONE_DIVIDER,
    COMPONENT_TYPES.AREA_BOUNDARY
  ].includes(type);
};

// Get element bounds
export const getElementBounds = (element) => {
  return {
    left: element.x,
    right: element.x + element.width,
    top: element.y,
    bottom: element.y + element.height,
    centerX: element.x + element.width / 2,
    centerY: element.y + element.height / 2
  };
};

// Find potential connection points between two elements
export const findConnectionPoints = (element1, element2) => {
  if (!canLink(element1, element2)) return [];
  
  const bounds1 = getElementBounds(element1);
  const bounds2 = getElementBounds(element2);
  const connections = [];
  
  // Check for edge-to-edge connections (blocks touching)
  
  // Right edge of element1 to left edge of element2
  if (Math.abs(bounds1.right - bounds2.left) <= SNAP_TOLERANCE) {
    const overlapTop = Math.max(bounds1.top, bounds2.top);
    const overlapBottom = Math.min(bounds1.bottom, bounds2.bottom);
    if (overlapBottom > overlapTop) {
      connections.push({
        type: 'edge-to-edge',
        point1: { x: bounds1.right, y: (overlapTop + overlapBottom) / 2 },
        point2: { x: bounds2.left, y: (overlapTop + overlapBottom) / 2 },
        direction: 'horizontal',
        overlap: overlapBottom - overlapTop
      });
    }
  }
  
  // Left edge of element1 to right edge of element2
  if (Math.abs(bounds1.left - bounds2.right) <= SNAP_TOLERANCE) {
    const overlapTop = Math.max(bounds1.top, bounds2.top);
    const overlapBottom = Math.min(bounds1.bottom, bounds2.bottom);
    if (overlapBottom > overlapTop) {
      connections.push({
        type: 'edge-to-edge',
        point1: { x: bounds1.left, y: (overlapTop + overlapBottom) / 2 },
        point2: { x: bounds2.right, y: (overlapTop + overlapBottom) / 2 },
        direction: 'horizontal',
        overlap: overlapBottom - overlapTop
      });
    }
  }
  
  // Bottom edge of element1 to top edge of element2
  if (Math.abs(bounds1.bottom - bounds2.top) <= SNAP_TOLERANCE) {
    const overlapLeft = Math.max(bounds1.left, bounds2.left);
    const overlapRight = Math.min(bounds1.right, bounds2.right);
    if (overlapRight > overlapLeft) {
      connections.push({
        type: 'edge-to-edge',
        point1: { x: (overlapLeft + overlapRight) / 2, y: bounds1.bottom },
        point2: { x: (overlapLeft + overlapRight) / 2, y: bounds2.top },
        direction: 'vertical',
        overlap: overlapRight - overlapLeft
      });
    }
  }
  
  // Top edge of element1 to bottom edge of element2
  if (Math.abs(bounds1.top - bounds2.bottom) <= SNAP_TOLERANCE) {
    const overlapLeft = Math.max(bounds1.left, bounds2.left);
    const overlapRight = Math.min(bounds1.right, bounds2.right);
    if (overlapRight > overlapLeft) {
      connections.push({
        type: 'edge-to-edge',
        point1: { x: (overlapLeft + overlapRight) / 2, y: bounds1.top },
        point2: { x: (overlapLeft + overlapRight) / 2, y: bounds2.bottom },
        direction: 'vertical',
        overlap: overlapRight - overlapLeft
      });
    }
  }
  
  return connections;
};

// Snap element to connection point
export const snapToConnection = (element, targetElement, connection) => {
  const newElement = { ...element };
  
  if (connection.type === 'edge-to-edge') {
    if (connection.direction === 'horizontal') {
      // Snap horizontally (left-right connection)
      if (connection.point1.x > connection.point2.x) {
        // Element is to the right, snap its left edge to target's right edge
        newElement.x = connection.point2.x;
      } else {
        // Element is to the left, snap its right edge to target's left edge
        newElement.x = connection.point2.x - element.width;
      }
      // Align vertically to maximize overlap
      newElement.y = connection.point2.y - element.height / 2;
    } else if (connection.direction === 'vertical') {
      // Snap vertically (top-bottom connection)
      if (connection.point1.y > connection.point2.y) {
        // Element is below, snap its top edge to target's bottom edge
        newElement.y = connection.point2.y;
      } else {
        // Element is above, snap its bottom edge to target's top edge
        newElement.y = connection.point2.y - element.height;
      }
      // Align horizontally to maximize overlap
      newElement.x = connection.point2.x - element.width / 2;
    }
  }
  
  return newElement;
};

// Find all possible connections for an element with other elements
export const findAllConnections = (element, allElements) => {
  const connections = [];
  
  allElements.forEach(otherElement => {
    if (otherElement.id !== element.id) {
      const elementConnections = findConnectionPoints(element, otherElement);
      elementConnections.forEach(connection => {
        connections.push({
          ...connection,
          targetElement: otherElement
        });
      });
    }
  });
  
  return connections;
};

// Check if elements form a closed shape
export const detectClosedShape = (elements) => {
  if (elements.length < 3) return false;
  
  const linkableElements = elements.filter(el => LINKABLE_ELEMENTS.includes(el.type));
  if (linkableElements.length < 3) return false;
  
  // Simple closed shape detection - check if elements form a connected loop
  const connections = [];
  
  for (let i = 0; i < linkableElements.length; i++) {
    for (let j = i + 1; j < linkableElements.length; j++) {
      const elementConnections = findConnectionPoints(linkableElements[i], linkableElements[j]);
      if (elementConnections.length > 0) {
        connections.push({
          element1: linkableElements[i].id,
          element2: linkableElements[j].id,
          connections: elementConnections
        });
      }
    }
  }
  
  // Check if we have enough connections to form a closed shape
  return connections.length >= linkableElements.length;
};

// Extend element to connect with another element
export const extendToConnect = (element, targetElement) => {
  if (!canLink(element, targetElement)) return element;
  
  const bounds1 = getElementBounds(element);
  const bounds2 = getElementBounds(targetElement);
  const newElement = { ...element };
  
  // For container elements, we can extend them to bridge gaps
  if (isDivider(element.type)) {
    // Extend dividers to connect with other elements
    if (Math.abs(bounds1.centerY - bounds2.centerY) <= SNAP_TOLERANCE) {
      // Horizontal extension
      if (bounds1.right < bounds2.left) {
        // Extend to the right
        newElement.width = bounds2.left - bounds1.left;
      } else if (bounds1.left > bounds2.right) {
        // Extend to the left
        const newWidth = bounds1.right - bounds2.right;
        newElement.x = bounds2.right;
        newElement.width = newWidth;
      }
    } else if (Math.abs(bounds1.centerX - bounds2.centerX) <= SNAP_TOLERANCE) {
      // Vertical extension
      if (bounds1.bottom < bounds2.top) {
        // Extend downward
        newElement.height = bounds2.top - bounds1.top;
      } else if (bounds1.top > bounds2.bottom) {
        // Extend upward
        const newHeight = bounds1.bottom - bounds2.bottom;
        newElement.y = bounds2.bottom;
        newElement.height = newHeight;
      }
    }
  }
  
  return newElement;
};
