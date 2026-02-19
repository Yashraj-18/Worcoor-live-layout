// @ts-nocheck
/**
 * Advanced Shape Creation Tools
 * Supports custom shapes, complex geometries, and facility-specific elements
 */

export const SHAPE_TYPES = {
  // Basic Shapes
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse',
  TRIANGLE: 'triangle',
  POLYGON: 'polygon',
  
  // Warehouse Specific
  L_SHAPE: 'l_shape',
  U_SHAPE: 'u_shape',
  T_SHAPE: 't_shape',
  LOADING_BAY: 'loading_bay',
  CONVEYOR_CURVE: 'conveyor_curve',
  RAMP: 'ramp',
  
  // Custom
  CUSTOM_PATH: 'custom_path',
  BEZIER_CURVE: 'bezier_curve',
  ROUNDED_RECTANGLE: 'rounded_rectangle'
};

export const SHAPE_CATEGORIES = {
  BASIC: 'Basic Shapes',
  WAREHOUSE: 'Warehouse Elements',
  STRUCTURAL: 'Structural Elements',
  CUSTOM: 'Custom Shapes'
};

export class ShapeCreator {
  constructor() {
    this.shapes = new Map();
    this.customShapes = new Map();
    this.shapeLibrary = this.initializeShapeLibrary();
  }

  initializeShapeLibrary() {
    return {
      [SHAPE_CATEGORIES.BASIC]: [
        {
          type: SHAPE_TYPES.RECTANGLE,
          name: 'Rectangle',
          icon: '⬜',
          description: 'Basic rectangular shape',
          defaultSize: { width: 100, height: 60 },
          generator: this.generateRectangle
        },
        {
          type: SHAPE_TYPES.CIRCLE,
          name: 'Circle',
          icon: '⭕',
          description: 'Perfect circle shape',
          defaultSize: { width: 80, height: 80 },
          generator: this.generateCircle
        },
        {
          type: SHAPE_TYPES.ELLIPSE,
          name: 'Ellipse',
          icon: '⭕',
          description: 'Oval/elliptical shape',
          defaultSize: { width: 120, height: 80 },
          generator: this.generateEllipse
        },
        {
          type: SHAPE_TYPES.TRIANGLE,
          name: 'Triangle',
          icon: '🔺',
          description: 'Triangular shape',
          defaultSize: { width: 80, height: 80 },
          generator: this.generateTriangle
        },
        {
          type: SHAPE_TYPES.ROUNDED_RECTANGLE,
          name: 'Rounded Rectangle',
          icon: '▢',
          description: 'Rectangle with rounded corners',
          defaultSize: { width: 100, height: 60 },
          generator: this.generateRoundedRectangle
        }
      ],
      [SHAPE_CATEGORIES.WAREHOUSE]: [
        {
          type: SHAPE_TYPES.L_SHAPE,
          name: 'L-Shaped Area',
          icon: '⌐',
          description: 'L-shaped storage or work area',
          defaultSize: { width: 150, height: 120 },
          generator: this.generateLShape
        },
        {
          type: SHAPE_TYPES.U_SHAPE,
          name: 'U-Shaped Area',
          icon: '⊔',
          description: 'U-shaped configuration',
          defaultSize: { width: 180, height: 120 },
          generator: this.generateUShape
        },
        {
          type: SHAPE_TYPES.T_SHAPE,
          name: 'T-Shaped Area',
          icon: '⊤',
          description: 'T-shaped layout element',
          defaultSize: { width: 150, height: 120 },
          generator: this.generateTShape
        },
        {
          type: SHAPE_TYPES.LOADING_BAY,
          name: 'Loading Bay',
          icon: '🚛',
          description: 'Truck loading bay with dock',
          defaultSize: { width: 160, height: 100 },
          generator: this.generateLoadingBay
        },
        {
          type: SHAPE_TYPES.CONVEYOR_CURVE,
          name: 'Curved Conveyor',
          icon: '🔄',
          description: 'Curved conveyor belt section',
          defaultSize: { width: 120, height: 120 },
          generator: this.generateConveyorCurve
        },
        {
          type: SHAPE_TYPES.RAMP,
          name: 'Ramp',
          icon: '📐',
          description: 'Inclined ramp or slope',
          defaultSize: { width: 140, height: 80 },
          generator: this.generateRamp
        }
      ],
      [SHAPE_CATEGORIES.CUSTOM]: [
        {
          type: SHAPE_TYPES.POLYGON,
          name: 'Custom Polygon',
          icon: '⬟',
          description: 'Multi-sided custom polygon',
          defaultSize: { width: 100, height: 100 },
          generator: this.generatePolygon
        },
        {
          type: SHAPE_TYPES.BEZIER_CURVE,
          name: 'Bezier Curve',
          icon: '〰️',
          description: 'Smooth curved path',
          defaultSize: { width: 150, height: 80 },
          generator: this.generateBezierCurve
        },
        {
          type: SHAPE_TYPES.CUSTOM_PATH,
          name: 'Custom Path',
          icon: '✏️',
          description: 'Free-form drawing path',
          defaultSize: { width: 100, height: 100 },
          generator: this.generateCustomPath
        }
      ]
    };
  }

  /**
   * Generate basic rectangle path
   */
  generateRectangle(width, height, options = {}) {
    const { x = 0, y = 0 } = options;
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }

  /**
   * Generate circle path
   */
  generateCircle(width, height, options = {}) {
    const { x = 0, y = 0 } = options;
    const radius = Math.min(width, height) / 2;
    const cx = x + width / 2;
    const cy = y + height / 2;
    return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`;
  }

  /**
   * Generate ellipse path
   */
  generateEllipse(width, height, options = {}) {
    const { x = 0, y = 0 } = options;
    const rx = width / 2;
    const ry = height / 2;
    const cx = x + rx;
    const cy = y + ry;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }

  /**
   * Generate triangle path
   */
  generateTriangle(width, height, options = {}) {
    const { x = 0, y = 0 } = options;
    return `M ${x + width / 2} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }

  /**
   * Generate rounded rectangle path
   */
  generateRoundedRectangle(width, height, options = {}) {
    const { x = 0, y = 0, radius = 10 } = options;
    const r = Math.min(radius, width / 2, height / 2);
    return `M ${x + r} ${y} 
            L ${x + width - r} ${y} 
            A ${r} ${r} 0 0 1 ${x + width} ${y + r}
            L ${x + width} ${y + height - r}
            A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}
            L ${x + r} ${y + height}
            A ${r} ${r} 0 0 1 ${x} ${y + height - r}
            L ${x} ${y + r}
            A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  }

  /**
   * Generate L-shaped path
   */
  generateLShape(width, height, options = {}) {
    const { x = 0, y = 0, thickness = 40 } = options;
    const t = Math.min(thickness, width / 2, height / 2);
    return `M ${x} ${y} 
            L ${x + width} ${y} 
            L ${x + width} ${y + t}
            L ${x + t} ${y + t}
            L ${x + t} ${y + height}
            L ${x} ${y + height} Z`;
  }

  /**
   * Generate U-shaped path
   */
  generateUShape(width, height, options = {}) {
    const { x = 0, y = 0, thickness = 30, opening = 60 } = options;
    const t = Math.min(thickness, width / 3);
    const o = Math.min(opening, width - 2 * t);
    const openingStart = x + (width - o) / 2;
    
    return `M ${x} ${y} 
            L ${x + width} ${y} 
            L ${x + width} ${y + height}
            L ${x + width - t} ${y + height}
            L ${x + width - t} ${y + t}
            L ${openingStart + o} ${y + t}
            L ${openingStart + o} ${y + height}
            L ${openingStart} ${y + height}
            L ${openingStart} ${y + t}
            L ${x + t} ${y + t}
            L ${x + t} ${y + height}
            L ${x} ${y + height} Z`;
  }

  /**
   * Generate T-shaped path
   */
  generateTShape(width, height, options = {}) {
    const { x = 0, y = 0, stemWidth = 40, capHeight = 30 } = options;
    const sw = Math.min(stemWidth, width);
    const ch = Math.min(capHeight, height / 2);
    const stemStart = x + (width - sw) / 2;
    
    return `M ${x} ${y} 
            L ${x + width} ${y} 
            L ${x + width} ${y + ch}
            L ${stemStart + sw} ${y + ch}
            L ${stemStart + sw} ${y + height}
            L ${stemStart} ${y + height}
            L ${stemStart} ${y + ch}
            L ${x} ${y + ch} Z`;
  }

  /**
   * Generate loading bay path
   */
  generateLoadingBay(width, height, options = {}) {
    const { x = 0, y = 0, dockWidth = 20 } = options;
    const dw = Math.min(dockWidth, width / 4);
    
    return `M ${x} ${y} 
            L ${x + width - dw} ${y} 
            L ${x + width - dw} ${y + height / 3}
            L ${x + width} ${y + height / 3}
            L ${x + width} ${y + 2 * height / 3}
            L ${x + width - dw} ${y + 2 * height / 3}
            L ${x + width - dw} ${y + height}
            L ${x} ${y + height} Z`;
  }

  /**
   * Generate curved conveyor path
   */
  generateConveyorCurve(width, height, options = {}) {
    const { x = 0, y = 0, innerRadius = 20 } = options;
    const outerRadius = Math.min(width, height) / 2;
    const ir = Math.max(innerRadius, outerRadius / 3);
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    return `M ${cx - outerRadius} ${cy}
            A ${outerRadius} ${outerRadius} 0 0 1 ${cx} ${cy - outerRadius}
            A ${outerRadius} ${outerRadius} 0 0 1 ${cx + outerRadius} ${cy}
            L ${cx + ir} ${cy}
            A ${ir} ${ir} 0 0 0 ${cx} ${cy - ir}
            A ${ir} ${ir} 0 0 0 ${cx - ir} ${cy} Z`;
  }

  /**
   * Generate ramp path
   */
  generateRamp(width, height, options = {}) {
    const { x = 0, y = 0, direction = 'up' } = options;
    
    if (direction === 'up') {
      return `M ${x} ${y + height} 
              L ${x + width} ${y} 
              L ${x + width} ${y + height / 4}
              L ${x} ${y + height} Z`;
    } else {
      return `M ${x} ${y} 
              L ${x + width} ${y + height} 
              L ${x + width} ${y + 3 * height / 4}
              L ${x} ${y} Z`;
    }
  }

  /**
   * Generate polygon path from points
   */
  generatePolygon(width, height, options = {}) {
    const { x = 0, y = 0, points = [] } = options;
    
    if (points.length < 3) {
      // Default hexagon
      const sides = 6;
      const radius = Math.min(width, height) / 2;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const generatedPoints = [];
      
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        generatedPoints.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle)
        });
      }
      
      return this.pointsToPath(generatedPoints);
    }
    
    return this.pointsToPath(points);
  }

  /**
   * Generate bezier curve path
   */
  generateBezierCurve(width, height, options = {}) {
    const { x = 0, y = 0, controlPoints = [] } = options;
    
    if (controlPoints.length === 0) {
      // Default S-curve
      return `M ${x} ${y + height / 2} 
              C ${x + width / 3} ${y}, ${x + 2 * width / 3} ${y + height}, ${x + width} ${y + height / 2}`;
    }
    
    // Custom bezier curve from control points
    let path = `M ${controlPoints[0].x} ${controlPoints[0].y}`;
    for (let i = 1; i < controlPoints.length; i += 3) {
      if (i + 2 < controlPoints.length) {
        path += ` C ${controlPoints[i].x} ${controlPoints[i].y}, ${controlPoints[i + 1].x} ${controlPoints[i + 1].y}, ${controlPoints[i + 2].x} ${controlPoints[i + 2].y}`;
      }
    }
    
    return path;
  }

  /**
   * Generate custom path from drawing points
   */
  generateCustomPath(width, height, options = {}) {
    const { x = 0, y = 0, drawingPoints = [] } = options;
    
    if (drawingPoints.length === 0) {
      return this.generateRectangle(width, height, { x, y });
    }
    
    return this.pointsToPath(drawingPoints);
  }

  /**
   * Convert points array to SVG path
   */
  pointsToPath(points) {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += ' Z';
    
    return path;
  }

  /**
   * Create a new shape instance
   */
  createShape(type, dimensions, position, options = {}) {
    const shapeInfo = this.findShapeInfo(type);
    if (!shapeInfo) return null;

    const shape = {
      id: this.generateShapeId(),
      type,
      name: options.name || shapeInfo.name,
      dimensions,
      position,
      path: shapeInfo.generator.call(this, dimensions.width, dimensions.height, {
        x: position.x,
        y: position.y,
        ...options
      }),
      style: {
        fill: options.fill || '#e3f2fd',
        stroke: options.stroke || '#1976d2',
        strokeWidth: options.strokeWidth || 2,
        ...options.style
      },
      properties: options.properties || {},
      createdAt: new Date().toISOString()
    };

    this.shapes.set(shape.id, shape);
    return shape;
  }

  /**
   * Find shape information by type
   */
  findShapeInfo(type) {
    for (const category of Object.values(this.shapeLibrary)) {
      const shape = category.find(s => s.type === type);
      if (shape) return shape;
    }
    return null;
  }

  /**
   * Save custom shape to library
   */
  saveCustomShape(name, path, dimensions, options = {}) {
    const customShape = {
      id: this.generateShapeId(),
      name,
      type: SHAPE_TYPES.CUSTOM_PATH,
      path,
      dimensions,
      icon: options.icon || '⭐',
      description: options.description || 'Custom shape',
      category: SHAPE_CATEGORIES.CUSTOM,
      createdAt: new Date().toISOString()
    };

    this.customShapes.set(customShape.id, customShape);
    return customShape;
  }

  /**
   * Get all shapes in library
   */
  getShapeLibrary() {
    return this.shapeLibrary;
  }

  /**
   * Get custom shapes
   */
  getCustomShapes() {
    return Array.from(this.customShapes.values());
  }

  /**
   * Generate unique shape ID
   */
  generateShapeId() {
    return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export shapes data
   */
  exportShapes() {
    return {
      shapes: Array.from(this.shapes.entries()),
      customShapes: Array.from(this.customShapes.entries()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import shapes data
   */
  importShapes(data) {
    if (data.shapes) {
      this.shapes.clear();
      data.shapes.forEach(([id, shape]) => {
        this.shapes.set(id, shape);
      });
    }

    if (data.customShapes) {
      this.customShapes.clear();
      data.customShapes.forEach(([id, shape]) => {
        this.customShapes.set(id, shape);
      });
    }
  }
}

// Default shape creator instance
export const shapeCreator = new ShapeCreator();
