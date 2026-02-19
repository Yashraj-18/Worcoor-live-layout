// @ts-nocheck
/**
 * Hierarchical Container System
 * Manages warehouse layout with 3 layers: Boundaries -> Zones -> Units
 */

export class HierarchicalContainerManager {
  constructor() {
    this.zoneLabelCounters = {
      storage: 0,
      receiving: 0,
      dispatch: 0,
      office: 0,
      transit: 0
    };
    this.gridSize = 60; // Grid snap size (increased 3x from 20)
  }

  // Generate auto-labels for zones (A, B, C... for storage, R1, R2... for receiving, etc.)
  generateZoneLabel(zoneType) {
    switch (zoneType) {
      case 'storage':
        return String.fromCharCode(65 + this.zoneLabelCounters.storage++); // A, B, C...
      case 'receiving':
        return `R${++this.zoneLabelCounters.receiving}`; // R1, R2, R3...
      case 'dispatch':
        return `D${++this.zoneLabelCounters.dispatch}`; // D1, D2, D3...
      case 'office':
        return `O${++this.zoneLabelCounters.office}`; // O1, O2, O3...
      case 'transit':
        return `T${++this.zoneLabelCounters.transit}`; // T1, T2, T3...
      default:
        return 'Z1';
    }
  }

  // Reset label counters
  resetLabelCounters() {
    this.zoneLabelCounters = {
      storage: 0,
      receiving: 0,
      dispatch: 0,
      office: 0,
      transit: 0
    };
  }

  // Snap coordinates to grid
  snapToGrid(x, y) {
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize
    };
  }

  // Check if item can be placed in container based on hierarchy
  canPlaceInContainer(draggedItem, targetContainer) {
    if (!targetContainer.isContainer) return false;

    const draggedLevel = draggedItem.containerLevel || 0;
    const targetLevel = targetContainer.containerLevel || 0;

    // Can only place items in containers of the previous level
    // Level 1 (Boundary) can contain Level 2 (Zones)
    // Level 2 (Zones) can contain Level 3 (Units)
    return draggedLevel === targetLevel + 1;
  }

  // Get valid container for item based on hierarchy
  getValidContainer(x, y, draggedItem, allItems) {
    const draggedLevel = draggedItem.containerLevel || 0;
    
    // Find containers that can hold this item
    const validContainers = allItems.filter(item => {
      if (!item.isContainer) return false;
      
      const containerLevel = item.containerLevel || 0;
      return draggedLevel === containerLevel + 1 && this.isPointInsideContainer(x, y, item);
    });

    // Return the most specific (highest level) container
    return validContainers.reduce((best, current) => {
      if (!best) return current;
      return (current.containerLevel || 0) > (best.containerLevel || 0) ? current : best;
    }, null);
  }

  // Check if point is inside container with padding
  isPointInsideContainer(x, y, container) {
    if (!container.isContainer) return false;
    
    const padding = container.containerPadding || 10;
    const innerX = container.x + padding;
    const innerY = container.y + padding;
    const innerWidth = container.width - (padding * 2);
    const innerHeight = container.height - (padding * 2);
    
    return x >= innerX && x <= innerX + innerWidth && y >= innerY && y <= innerY + innerHeight;
  }

  // Get container bounds for positioning
  getContainerBounds(container) {
    if (!container.isContainer) return null;
    
    const padding = container.containerPadding || 10;
    return {
      x: container.x + padding,
      y: container.y + padding,
      width: container.width - (padding * 2),
      height: container.height - (padding * 2)
    };
  }

  // Check for collisions between items
  checkCollision(item1, item2) {
    return !(item1.x + item1.width <= item2.x || 
             item2.x + item2.width <= item1.x || 
             item1.y + item1.height <= item2.y || 
             item2.y + item2.height <= item1.y);
  }

  // Find all items that would collide with the new item
  findCollisions(newItem, existingItems) {
    return existingItems.filter(item => 
      item.id !== newItem.id && this.checkCollision(newItem, item)
    );
  }

  // Auto-arrange units within a zone in a grid pattern
  autoArrangeUnits(zone, units, columns = null) {
    if (!zone.isContainer || units.length === 0) return units;

    const bounds = this.getContainerBounds(zone);
    const unitWidth = units[0].width;
    const unitHeight = units[0].height;
    const spacing = 5;

    // Calculate optimal columns if not specified
    if (!columns) {
      columns = Math.floor(bounds.width / (unitWidth + spacing));
    }

    const arrangedUnits = units.map((unit, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      return {
        ...unit,
        x: bounds.x + col * (unitWidth + spacing),
        y: bounds.y + row * (unitHeight + spacing),
        containerId: zone.id
      };
    });

    return arrangedUnits;
  }

  // Batch create units within a zone
  batchCreateUnits(zone, unitTemplate, count, columns = null) {
    const units = [];
    
    for (let i = 0; i < count; i++) {
      units.push({
        ...unitTemplate,
        id: `${zone.id}_unit_${i + 1}`,
        name: `${unitTemplate.name} ${i + 1}`,
        containerId: zone.id
      });
    }

    return this.autoArrangeUnits(zone, units, columns);
  }

  // Get hierarchy path for an item (e.g., "Warehouse > Zone A > Unit A1")
  getHierarchyPath(item, allItems) {
    const path = [item.name];
    let currentItem = item;

    while (currentItem.containerId) {
      const container = allItems.find(i => i.id === currentItem.containerId);
      if (container) {
        path.unshift(container.name);
        currentItem = container;
      } else {
        break;
      }
    }

    return path.join(' > ');
  }

  // Validate container hierarchy rules
  validateHierarchy(items) {
    const errors = [];

    items.forEach(item => {
      if (item.containerId) {
        const container = items.find(i => i.id === item.containerId);
        if (!container) {
          errors.push(`Item ${item.name} references non-existent container`);
        } else if (!this.canPlaceInContainer(item, container)) {
          errors.push(`Item ${item.name} cannot be placed in container ${container.name} due to hierarchy rules`);
        }
      }
    });

    return errors;
  }
}

// Export singleton instance
export const hierarchicalManager = new HierarchicalContainerManager();

// Container level constants
export const CONTAINER_LEVELS = {
  BOUNDARY: 1,
  ZONE: 2,
  UNIT: 3
};

// Zone type configurations
export const ZONE_CONFIGS = {
  storage: {
    labelPrefix: '',
    color: '#4CAF50',
    allowedUnits: ['storage_bay', 'pallet_position', 'shelf_unit']
  },
  receiving: {
    labelPrefix: 'R',
    color: '#FF9800',
    allowedUnits: ['storage_bay', 'pallet_position', 'equipment_space']
  },
  dispatch: {
    labelPrefix: 'D',
    color: '#F44336',
    allowedUnits: ['storage_bay', 'pallet_position', 'equipment_space']
  },
  office: {
    labelPrefix: 'O',
    color: '#9C27B0',
    allowedUnits: ['equipment_space']
  },
  transit: {
    labelPrefix: 'T',
    color: '#607D8B',
    allowedUnits: ['pallet_position', 'equipment_space']
  }
};
