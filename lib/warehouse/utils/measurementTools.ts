// @ts-nocheck
/**
 * Measurement and Scale Tools for True-to-Scale Mapping
 */

export const MEASUREMENT_UNITS = {
  PIXELS: 'px',
  METERS: 'm',
  FEET: 'ft',
  INCHES: 'in',
  CENTIMETERS: 'cm'
};

export const SCALE_PRESETS = {
  '1:100': { ratio: 100, name: '1:100 (Architectural)' },
  '1:200': { ratio: 200, name: '1:200 (Site Plan)' },
  '1:500': { ratio: 500, name: '1:500 (Large Site)' },
  '1:50': { ratio: 50, name: '1:50 (Detailed Plan)' },
  '1:25': { ratio: 25, name: '1:25 (Room Detail)' },
  'custom': { ratio: 1, name: 'Custom Scale' }
};

export class MeasurementSystem {
  constructor() {
    this.scale = 1; // pixels per unit
    this.unit = MEASUREMENT_UNITS.METERS;
    this.gridSize = 150; // pixels (increased 3x from 50)
    this.snapTolerance = 30; // pixels (increased 3x from 10)
    this.measurements = new Map();
  }

  /**
   * Set the scale ratio (pixels per real-world unit)
   */
  setScale(pixelsPerUnit, unit = MEASUREMENT_UNITS.METERS) {
    this.scale = pixelsPerUnit;
    this.unit = unit;
  }

  /**
   * Set scale from preset
   */
  setScaleFromPreset(presetKey, referenceLength = 1000) {
    const preset = SCALE_PRESETS[presetKey];
    if (preset) {
      // Calculate pixels per unit based on reference length
      this.scale = referenceLength / preset.ratio;
      this.unit = MEASUREMENT_UNITS.METERS;
    }
  }

  /**
   * Convert pixels to real-world units
   */
  pixelsToUnits(pixels) {
    return pixels / this.scale;
  }

  /**
   * Convert real-world units to pixels
   */
  unitsToPixels(units) {
    return units * this.scale;
  }

  /**
   * Calculate distance between two points in pixels
   */
  calculatePixelDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate real-world distance between two points
   */
  calculateRealDistance(point1, point2) {
    const pixelDistance = this.calculatePixelDistance(point1, point2);
    return this.pixelsToUnits(pixelDistance);
  }

  /**
   * Calculate area in pixels
   */
  calculatePixelArea(width, height) {
    return width * height;
  }

  /**
   * Calculate real-world area
   */
  calculateRealArea(width, height) {
    const realWidth = this.pixelsToUnits(width);
    const realHeight = this.pixelsToUnits(height);
    return realWidth * realHeight;
  }

  /**
   * Snap point to grid
   */
  snapToGrid(point) {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize
    };
  }

  /**
   * Check if point is near grid intersection
   */
  isNearGrid(point) {
    const snapped = this.snapToGrid(point);
    const distance = this.calculatePixelDistance(point, snapped);
    return distance <= this.snapTolerance;
  }

  /**
   * Format measurement for display
   */
  formatMeasurement(value, precision = 2) {
    return `${value.toFixed(precision)} ${this.unit}`;
  }

  /**
   * Create a measurement annotation
   */
  createMeasurement(id, startPoint, endPoint, label = '') {
    const pixelDistance = this.calculatePixelDistance(startPoint, endPoint);
    const realDistance = this.pixelsToUnits(pixelDistance);
    
    const measurement = {
      id,
      startPoint,
      endPoint,
      pixelDistance,
      realDistance,
      label: label || this.formatMeasurement(realDistance),
      createdAt: new Date().toISOString()
    };

    this.measurements.set(id, measurement);
    return measurement;
  }

  /**
   * Update measurement
   */
  updateMeasurement(id, updates) {
    const measurement = this.measurements.get(id);
    if (measurement) {
      const updated = { ...measurement, ...updates };
      
      // Recalculate distances if points changed
      if (updates.startPoint || updates.endPoint) {
        updated.pixelDistance = this.calculatePixelDistance(
          updated.startPoint, 
          updated.endPoint
        );
        updated.realDistance = this.pixelsToUnits(updated.pixelDistance);
        updated.label = this.formatMeasurement(updated.realDistance);
      }

      this.measurements.set(id, updated);
      return updated;
    }
    return null;
  }

  /**
   * Delete measurement
   */
  deleteMeasurement(id) {
    return this.measurements.delete(id);
  }

  /**
   * Get all measurements
   */
  getAllMeasurements() {
    return Array.from(this.measurements.values());
  }

  /**
   * Clear all measurements
   */
  clearMeasurements() {
    this.measurements.clear();
  }

  /**
   * Export measurements data
   */
  exportMeasurements() {
    return {
      scale: this.scale,
      unit: this.unit,
      measurements: Array.from(this.measurements.entries()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import measurements data
   */
  importMeasurements(data) {
    if (data.scale) this.scale = data.scale;
    if (data.unit) this.unit = data.unit;
    if (data.measurements) {
      this.measurements.clear();
      data.measurements.forEach(([id, measurement]) => {
        this.measurements.set(id, measurement);
      });
    }
  }
}

export class GridSystem {
  constructor(measurementSystem) {
    this.measurementSystem = measurementSystem;
    this.visible = true;
    this.majorGridSize = 300; // pixels (increased 3x from 100)
    this.minorGridSize = 60; // pixels (increased 3x from 20)
    this.majorGridColor = '#999';
    this.minorGridColor = '#ccc';
    this.snapEnabled = true;
  }

  /**
   * Set grid visibility
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * Set grid sizes
   */
  setGridSizes(majorSize, minorSize) {
    this.majorGridSize = majorSize;
    this.minorGridSize = minorSize;
  }

  /**
   * Enable/disable snap to grid
   */
  setSnapEnabled(enabled) {
    this.snapEnabled = enabled;
  }

  /**
   * Snap point to grid if enabled
   */
  snapPoint(point) {
    if (!this.snapEnabled) return point;
    return this.measurementSystem.snapToGrid(point);
  }

  /**
   * Get grid lines for rendering
   */
  getGridLines(viewBox) {
    const lines = [];
    
    if (!this.visible) return lines;

    const { x, y, width, height } = viewBox;
    
    // Major grid lines (vertical)
    for (let i = Math.floor(x / this.majorGridSize) * this.majorGridSize; 
         i <= x + width; 
         i += this.majorGridSize) {
      lines.push({
        type: 'major',
        orientation: 'vertical',
        position: i,
        start: y,
        end: y + height
      });
    }

    // Major grid lines (horizontal)
    for (let i = Math.floor(y / this.majorGridSize) * this.majorGridSize; 
         i <= y + height; 
         i += this.majorGridSize) {
      lines.push({
        type: 'major',
        orientation: 'horizontal',
        position: i,
        start: x,
        end: x + width
      });
    }

    // Minor grid lines (vertical)
    for (let i = Math.floor(x / this.minorGridSize) * this.minorGridSize; 
         i <= x + width; 
         i += this.minorGridSize) {
      if (i % this.majorGridSize !== 0) {
        lines.push({
          type: 'minor',
          orientation: 'vertical',
          position: i,
          start: y,
          end: y + height
        });
      }
    }

    // Minor grid lines (horizontal)
    for (let i = Math.floor(y / this.minorGridSize) * this.minorGridSize; 
         i <= y + height; 
         i += this.minorGridSize) {
      if (i % this.majorGridSize !== 0) {
        lines.push({
          type: 'minor',
          orientation: 'horizontal',
          position: i,
          start: x,
          end: x + width
        });
      }
    }

    return lines;
  }

  /**
   * Get real-world grid spacing
   */
  getRealGridSpacing() {
    return {
      major: this.measurementSystem.pixelsToUnits(this.majorGridSize),
      minor: this.measurementSystem.pixelsToUnits(this.minorGridSize)
    };
  }
}

export class AreaCalculator {
  constructor(measurementSystem) {
    this.measurementSystem = measurementSystem;
  }

  /**
   * Calculate area of a rectangle
   */
  calculateRectangleArea(width, height) {
    return {
      pixels: width * height,
      real: this.measurementSystem.calculateRealArea(width, height),
      formatted: this.measurementSystem.formatMeasurement(
        this.measurementSystem.calculateRealArea(width, height)
      ) + '²'
    };
  }

  /**
   * Calculate area of a polygon
   */
  calculatePolygonArea(points) {
    if (points.length < 3) return { pixels: 0, real: 0, formatted: '0 m²' };

    // Shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;

    const realArea = this.measurementSystem.pixelsToUnits(Math.sqrt(area)) ** 2;

    return {
      pixels: area,
      real: realArea,
      formatted: this.measurementSystem.formatMeasurement(realArea) + '²'
    };
  }

  /**
   * Calculate perimeter of a polygon
   */
  calculatePolygonPerimeter(points) {
    if (points.length < 2) return { pixels: 0, real: 0, formatted: '0 m' };

    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += this.measurementSystem.calculatePixelDistance(points[i], points[j]);
    }

    const realPerimeter = this.measurementSystem.pixelsToUnits(perimeter);

    return {
      pixels: perimeter,
      real: realPerimeter,
      formatted: this.measurementSystem.formatMeasurement(realPerimeter)
    };
  }
}

// Default measurement system instance
export const measurementSystem = new MeasurementSystem();
export const gridSystem = new GridSystem(measurementSystem);
export const areaCalculator = new AreaCalculator(measurementSystem);
