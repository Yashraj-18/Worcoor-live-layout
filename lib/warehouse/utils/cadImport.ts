// @ts-nocheck
/**
 * CAD File Import Utilities
 * Supports importing architectural drawings and converting them to warehouse layouts
 */

export const SUPPORTED_CAD_FORMATS = {
  DXF: 'dxf',
  SVG: 'svg',
  PDF: 'pdf',
  DWG: 'dwg' // Limited support
};

export const CAD_LAYER_TYPES = {
  WALLS: 'walls',
  DOORS: 'doors',
  WINDOWS: 'windows',
  DIMENSIONS: 'dimensions',
  TEXT: 'text',
  EQUIPMENT: 'equipment',
  FURNITURE: 'furniture',
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  HVAC: 'hvac'
};

export class CADImporter {
  constructor() {
    this.supportedFormats = Object.values(SUPPORTED_CAD_FORMATS);
    this.importedData = null;
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
  }

  /**
   * Check if file format is supported
   */
  isSupportedFormat(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return this.supportedFormats.includes(extension);
  }

  /**
   * Import CAD file
   */
  async importFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch (extension) {
      case SUPPORTED_CAD_FORMATS.SVG:
        return await this.importSVG(file);
      case SUPPORTED_CAD_FORMATS.DXF:
        return await this.importDXF(file);
      case SUPPORTED_CAD_FORMATS.PDF:
        return await this.importPDF(file);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  /**
   * Import SVG file
   */
  async importSVG(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const svgContent = event.target.result;
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
          
          const importedData = this.parseSVG(svgDoc);
          this.importedData = importedData;
          
          resolve({
            format: SUPPORTED_CAD_FORMATS.SVG,
            data: importedData,
            layers: this.extractLayers(importedData),
            bounds: this.calculateBounds(importedData)
          });
        } catch (error) {
          reject(new Error(`Failed to parse SVG: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse SVG document
   */
  parseSVG(svgDoc) {
    const elements = [];
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('Invalid SVG file');
    }

    // Extract viewBox or dimensions
    const viewBox = svgElement.getAttribute('viewBox');
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    
    let bounds = { x: 0, y: 0, width: 1000, height: 1000 };
    
    if (viewBox) {
      const [x, y, w, h] = viewBox.split(' ').map(Number);
      bounds = { x, y, width: w, height: h };
    } else if (width && height) {
      bounds.width = parseFloat(width);
      bounds.height = parseFloat(height);
    }

    // Parse different element types
    this.parseElements(svgElement, elements, '');

    return {
      bounds,
      elements,
      metadata: {
        title: svgDoc.querySelector('title')?.textContent || 'Imported CAD',
        description: svgDoc.querySelector('desc')?.textContent || ''
      }
    };
  }

  /**
   * Parse SVG elements recursively
   */
  parseElements(parent, elements, layerName) {
    const children = Array.from(parent.children);
    
    children.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const id = element.getAttribute('id') || '';
      const className = element.getAttribute('class') || '';
      const currentLayer = layerName || this.determineLayer(id, className, tagName);
      
      switch (tagName) {
        case 'rect':
          elements.push(this.parseRectangle(element, currentLayer));
          break;
        case 'circle':
          elements.push(this.parseCircle(element, currentLayer));
          break;
        case 'ellipse':
          elements.push(this.parseEllipse(element, currentLayer));
          break;
        case 'line':
          elements.push(this.parseLine(element, currentLayer));
          break;
        case 'polyline':
        case 'polygon':
          elements.push(this.parsePolygon(element, currentLayer));
          break;
        case 'path':
          elements.push(this.parsePath(element, currentLayer));
          break;
        case 'text':
          elements.push(this.parseText(element, currentLayer));
          break;
        case 'g':
          // Group - recurse into children
          const groupLayer = element.getAttribute('id') || currentLayer;
          this.parseElements(element, elements, groupLayer);
          break;
      }
    });
  }

  /**
   * Determine layer type from element attributes
   */
  determineLayer(id, className, tagName) {
    const identifier = (id + ' ' + className).toLowerCase();
    
    if (identifier.includes('wall') || identifier.includes('partition')) {
      return CAD_LAYER_TYPES.WALLS;
    }
    if (identifier.includes('door') || identifier.includes('entrance')) {
      return CAD_LAYER_TYPES.DOORS;
    }
    if (identifier.includes('window')) {
      return CAD_LAYER_TYPES.WINDOWS;
    }
    if (identifier.includes('dimension') || identifier.includes('measure')) {
      return CAD_LAYER_TYPES.DIMENSIONS;
    }
    if (identifier.includes('text') || identifier.includes('label')) {
      return CAD_LAYER_TYPES.TEXT;
    }
    if (identifier.includes('equipment') || identifier.includes('machine')) {
      return CAD_LAYER_TYPES.EQUIPMENT;
    }
    
    // Default based on element type
    switch (tagName) {
      case 'rect':
      case 'line':
        return CAD_LAYER_TYPES.WALLS;
      case 'text':
        return CAD_LAYER_TYPES.TEXT;
      default:
        return CAD_LAYER_TYPES.EQUIPMENT;
    }
  }

  /**
   * Parse rectangle element
   */
  parseRectangle(element, layer) {
    return {
      type: 'rectangle',
      layer,
      x: parseFloat(element.getAttribute('x') || 0),
      y: parseFloat(element.getAttribute('y') || 0),
      width: parseFloat(element.getAttribute('width') || 0),
      height: parseFloat(element.getAttribute('height') || 0),
      style: this.parseStyle(element),
      id: element.getAttribute('id'),
      originalElement: element
    };
  }

  /**
   * Parse circle element
   */
  parseCircle(element, layer) {
    const cx = parseFloat(element.getAttribute('cx') || 0);
    const cy = parseFloat(element.getAttribute('cy') || 0);
    const r = parseFloat(element.getAttribute('r') || 0);
    
    return {
      type: 'circle',
      layer,
      x: cx - r,
      y: cy - r,
      width: r * 2,
      height: r * 2,
      radius: r,
      centerX: cx,
      centerY: cy,
      style: this.parseStyle(element),
      id: element.getAttribute('id'),
      originalElement: element
    };
  }

  /**
   * Parse line element
   */
  parseLine(element, layer) {
    return {
      type: 'line',
      layer,
      x1: parseFloat(element.getAttribute('x1') || 0),
      y1: parseFloat(element.getAttribute('y1') || 0),
      x2: parseFloat(element.getAttribute('x2') || 0),
      y2: parseFloat(element.getAttribute('y2') || 0),
      style: this.parseStyle(element),
      id: element.getAttribute('id'),
      originalElement: element
    };
  }

  /**
   * Parse polygon/polyline element
   */
  parsePolygon(element, layer) {
    const points = element.getAttribute('points') || '';
    const pointArray = points.trim().split(/[\s,]+/).map(Number);
    const coordinates = [];
    
    for (let i = 0; i < pointArray.length; i += 2) {
      coordinates.push({
        x: pointArray[i],
        y: pointArray[i + 1]
      });
    }
    
    return {
      type: element.tagName.toLowerCase(),
      layer,
      points: coordinates,
      style: this.parseStyle(element),
      id: element.getAttribute('id'),
      originalElement: element
    };
  }

  /**
   * Parse path element
   */
  parsePath(element, layer) {
    return {
      type: 'path',
      layer,
      pathData: element.getAttribute('d') || '',
      style: this.parseStyle(element),
      id: element.getAttribute('id'),
      originalElement: element
    };
  }

  /**
   * Parse text element
   */
  parseText(element, layer) {
    return {
      type: 'text',
      layer,
      x: parseFloat(element.getAttribute('x') || 0),
      y: parseFloat(element.getAttribute('y') || 0),
      text: element.textContent || '',
      style: this.parseStyle(element),
      id: element.getAttribute('id'),
      originalElement: element
    };
  }

  /**
   * Parse element style
   */
  parseStyle(element) {
    const style = {};
    const styleAttr = element.getAttribute('style');
    const fill = element.getAttribute('fill');
    const stroke = element.getAttribute('stroke');
    const strokeWidth = element.getAttribute('stroke-width');
    
    if (styleAttr) {
      styleAttr.split(';').forEach(rule => {
        const [property, value] = rule.split(':').map(s => s.trim());
        if (property && value) {
          style[property] = value;
        }
      });
    }
    
    if (fill) style.fill = fill;
    if (stroke) style.stroke = stroke;
    if (strokeWidth) style.strokeWidth = strokeWidth;
    
    return style;
  }

  /**
   * Extract layers from imported data
   */
  extractLayers(data) {
    const layers = new Map();
    
    data.elements.forEach(element => {
      if (!layers.has(element.layer)) {
        layers.set(element.layer, {
          name: element.layer,
          elements: [],
          visible: true,
          color: this.getLayerColor(element.layer)
        });
      }
      layers.get(element.layer).elements.push(element);
    });
    
    return Array.from(layers.values());
  }

  /**
   * Get default color for layer type
   */
  getLayerColor(layerType) {
    const colors = {
      [CAD_LAYER_TYPES.WALLS]: '#333333',
      [CAD_LAYER_TYPES.DOORS]: '#8BC34A',
      [CAD_LAYER_TYPES.WINDOWS]: '#2196F3',
      [CAD_LAYER_TYPES.DIMENSIONS]: '#FF5722',
      [CAD_LAYER_TYPES.TEXT]: '#9C27B0',
      [CAD_LAYER_TYPES.EQUIPMENT]: '#FF9800',
      [CAD_LAYER_TYPES.FURNITURE]: '#795548',
      [CAD_LAYER_TYPES.ELECTRICAL]: '#FFC107',
      [CAD_LAYER_TYPES.PLUMBING]: '#00BCD4',
      [CAD_LAYER_TYPES.HVAC]: '#4CAF50'
    };
    
    return colors[layerType] || '#666666';
  }

  /**
   * Calculate bounds of imported data
   */
  calculateBounds(data) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    data.elements.forEach(element => {
      switch (element.type) {
        case 'rectangle':
          minX = Math.min(minX, element.x);
          minY = Math.min(minY, element.y);
          maxX = Math.max(maxX, element.x + element.width);
          maxY = Math.max(maxY, element.y + element.height);
          break;
        case 'circle':
          minX = Math.min(minX, element.centerX - element.radius);
          minY = Math.min(minY, element.centerY - element.radius);
          maxX = Math.max(maxX, element.centerX + element.radius);
          maxY = Math.max(maxY, element.centerY + element.radius);
          break;
        case 'line':
          minX = Math.min(minX, element.x1, element.x2);
          minY = Math.min(minY, element.y1, element.y2);
          maxX = Math.max(maxX, element.x1, element.x2);
          maxY = Math.max(maxY, element.y1, element.y2);
          break;
        case 'polygon':
        case 'polyline':
          element.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
          break;
      }
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Convert CAD elements to warehouse components
   */
  convertToWarehouseComponents(layers, conversionRules = {}) {
    const components = [];
    
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      layer.elements.forEach(element => {
        const component = this.convertElement(element, conversionRules);
        if (component) {
          components.push(component);
        }
      });
    });
    
    return components;
  }

  /**
   * Convert individual element to warehouse component
   */
  convertElement(element, rules) {
    const rule = rules[element.layer] || this.getDefaultConversionRule(element.layer);
    
    if (!rule || !rule.componentType) return null;
    
    const component = {
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: rule.componentType,
      x: element.x || 0,
      y: element.y || 0,
      width: element.width || 50,
      height: element.height || 50,
      properties: {
        imported: true,
        originalLayer: element.layer,
        originalId: element.id
      }
    };
    
    // Apply any transformations
    if (rule.transform) {
      rule.transform(component, element);
    }
    
    return component;
  }

  /**
   * Get default conversion rule for layer
   */
  getDefaultConversionRule(layerType) {
    const rules = {
      [CAD_LAYER_TYPES.WALLS]: {
        componentType: 'draw_wall'
      },
      [CAD_LAYER_TYPES.DOORS]: {
        componentType: 'door'
      },
      [CAD_LAYER_TYPES.EQUIPMENT]: {
        componentType: 'storage_area'
      },
      [CAD_LAYER_TYPES.FURNITURE]: {
        componentType: 'workstation'
      }
    };
    
    return rules[layerType];
  }

  /**
   * Set scale for imported data
   */
  setScale(scale) {
    this.scale = scale;
  }

  /**
   * Set offset for imported data
   */
  setOffset(x, y) {
    this.offset = { x, y };
  }

  /**
   * Apply scale and offset transformations
   */
  applyTransformations(components) {
    return components.map(component => ({
      ...component,
      x: (component.x * this.scale) + this.offset.x,
      y: (component.y * this.scale) + this.offset.y,
      width: component.width * this.scale,
      height: component.height * this.scale
    }));
  }
}

// Default CAD importer instance
export const cadImporter = new CADImporter();
