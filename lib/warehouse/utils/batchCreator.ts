// @ts-nocheck
/**
 * Batch Creator Utility
 * Automatically creates and arranges units within zones
 */

import { v4 as uuidv4 } from 'uuid';
import { hierarchicalManager } from './hierarchicalContainer';
import { getComponentColor } from './componentColors';

export class BatchCreator {
  constructor() {
    this.defaultSpacing = 2; // Space between units
  }

  // Create a grid of storage units within a zone (like in the reference image)
  createStorageGrid(zone, unitTemplate, options = {}) {
    const {
      rows = 'auto',
      columns = 'auto',
      spacing = this.defaultSpacing,
      fillEntireZone = true
    } = options;

    const bounds = hierarchicalManager.getContainerBounds(zone);
    const unitWidth = unitTemplate.defaultSize.width;
    const unitHeight = unitTemplate.defaultSize.height;

    // Calculate optimal grid dimensions
    let actualColumns = columns;
    let actualRows = rows;

    if (columns === 'auto') {
      actualColumns = Math.floor(bounds.width / (unitWidth + spacing));
    }

    if (rows === 'auto') {
      actualRows = Math.floor(bounds.height / (unitHeight + spacing));
    }

    const units = [];
    let unitCounter = 1;

    for (let row = 0; row < actualRows; row++) {
      for (let col = 0; col < actualColumns; col++) {
        const x = bounds.x + col * (unitWidth + spacing);
        const y = bounds.y + row * (unitHeight + spacing);

        // Check if unit fits within zone bounds
        if (x + unitWidth <= bounds.x + bounds.width && 
            y + unitHeight <= bounds.y + bounds.height) {
          
          const unit = {
            id: uuidv4(),
            type: unitTemplate.type,
            name: `${unitTemplate.name} ${unitCounter}`,
            x: x,
            y: y,
            width: unitWidth,
            height: unitHeight,
            color: unitTemplate.color,
            label: `${unitCounter}`,
            icon: unitTemplate.icon,
            containerLevel: 3,
            unitType: unitTemplate.unitType,
            containerId: zone.id,
            professionalStyle: true,
            gridPosition: { row, col }
          };

          units.push(unit);
          unitCounter++;
        }
      }
    }

    return units;
  }

  // Create the exact layout from the reference image
  createReferenceLayout(zone) {
    const bounds = hierarchicalManager.getContainerBounds(zone);
    
    // Create 3x9 grid like in the reference image
    const units = [];
    const unitWidth = 25;
    const unitHeight = 25;
    const spacing = 2;
    const rows = 9;
    const columns = 3;

    let unitCounter = 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = bounds.x + col * (unitWidth + spacing) + 5;
        const y = bounds.y + row * (unitHeight + spacing) + 5;

        const unit = {
          id: uuidv4(),
          type: 'storage_bay',
          name: `Unit ${zone.label}${unitCounter}`,
          x: x,
          y: y,
          width: unitWidth,
          height: unitHeight,
          color: getComponentColor('container_unit'),
          label: `${unitCounter}`,
          icon: '▫',
          containerLevel: 3,
          unitType: 'storage',
          containerId: zone.id,
          professionalStyle: true,
          gridPosition: { row, col }
        };

        units.push(unit);
        unitCounter++;
      }
    }

    return units;
  }

  // Fill zone with optimal number of units
  fillZoneOptimally(zone, unitTemplate) {
    const bounds = hierarchicalManager.getContainerBounds(zone);
    const unitWidth = unitTemplate.defaultSize.width;
    const unitHeight = unitTemplate.defaultSize.height;
    const spacing = 2;

    // Calculate how many units can fit
    const maxColumns = Math.floor(bounds.width / (unitWidth + spacing));
    const maxRows = Math.floor(bounds.height / (unitHeight + spacing));

    return this.createStorageGrid(zone, unitTemplate, {
      rows: maxRows,
      columns: maxColumns,
      spacing: spacing
    });
  }

  // Create specific layouts for different zone types
  createZoneLayout(zone, layoutType = 'storage') {
    switch (layoutType) {
      case 'storage':
        return this.createReferenceLayout(zone);
      
      case 'receiving':
        // Fewer, larger units for receiving areas
        return this.createStorageGrid(zone, {
          type: 'pallet_position',
          name: 'Pallet',
          defaultSize: { width: 30, height: 30 },
          color: getComponentColor('storage_unit', 'bulk'),
          icon: '▫',
          unitType: 'pallet'
        }, { rows: 2, columns: 3 });
      
      case 'dispatch':
        // Similar to receiving but green
        return this.createStorageGrid(zone, {
          type: 'pallet_position',
          name: 'Dispatch',
          defaultSize: { width: 30, height: 30 },
          color: getComponentColor('storage_unit'),
          icon: '▫',
          unitType: 'pallet'
        }, { rows: 2, columns: 3 });
      
      case 'office':
        // No units for office spaces
        return [];
      
      case 'transit':
        // Temporary storage positions
        return this.createStorageGrid(zone, {
          type: 'pallet_position',
          name: 'Temp',
          defaultSize: { width: 25, height: 25 },
          color: getComponentColor('storage_unit', 'dry_storage'),
          icon: '▫',
          unitType: 'pallet'
        }, { rows: 2, columns: 4 });
      
      default:
        return [];
    }
  }

  // Auto-fill all zones in a warehouse with appropriate units
  autoFillWarehouse(zones) {
    const allUnits = [];

    zones.forEach(zone => {
      if (zone.zoneType && zone.containerLevel === 2) {
        const units = this.createZoneLayout(zone, zone.zoneType);
        allUnits.push(...units);
      }
    });

    return allUnits;
  }

  // Calculate zone capacity
  calculateZoneCapacity(zone, unitTemplate) {
    const bounds = hierarchicalManager.getContainerBounds(zone);
    const unitWidth = unitTemplate.defaultSize.width;
    const unitHeight = unitTemplate.defaultSize.height;
    const spacing = 2;

    const maxColumns = Math.floor(bounds.width / (unitWidth + spacing));
    const maxRows = Math.floor(bounds.height / (unitHeight + spacing));

    return maxColumns * maxRows;
  }
}

// Export singleton instance
export const batchCreator = new BatchCreator();
