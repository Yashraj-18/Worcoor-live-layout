// @ts-nocheck
/**
 * Export Utilities for Layouts and Documentation
 * Supports multiple export formats including PNG, SVG, PDF, and CAD
 */

import { measurementSystem } from './measurementTools';
import { facilityHierarchy } from './facilityHierarchy';
import { getComponentColor } from './componentColors';

export const EXPORT_FORMATS = {
  PNG: 'png',
  SVG: 'svg',
  PDF: 'pdf',
  JSON: 'json',
  CAD: 'cad',
  EXCEL: 'xlsx'
};

export class LayoutExporter {
  constructor() {
    this.canvas = null;
    this.context = null;
  }

  /**
   * Export layout in specified format
   */
  async exportLayout(warehouseItems, format, options = {}) {
    const {
      filename = `warehouse_layout_${new Date().toISOString().split('T')[0]}`,
      includeGrid = false,
      includeMeasurements = false,
      includeLabels = true,
      scale = 1,
      backgroundColor = '#ffffff'
    } = options;

    switch (format) {
      case EXPORT_FORMATS.PNG:
        return await this.exportToPNG(warehouseItems, { ...options, filename });
      case EXPORT_FORMATS.SVG:
        return await this.exportToSVG(warehouseItems, { ...options, filename });
      case EXPORT_FORMATS.PDF:
        return await this.exportToPDF(warehouseItems, { ...options, filename });
      case EXPORT_FORMATS.JSON:
        return this.exportToJSON(warehouseItems, { ...options, filename });
      case EXPORT_FORMATS.CAD:
        return this.exportToCAD(warehouseItems, { ...options, filename });
      case EXPORT_FORMATS.EXCEL:
        return await this.exportToExcel(warehouseItems, { ...options, filename });
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PNG format
   */
  async exportToPNG(warehouseItems, options) {
    const { width = 1920, height = 1080, scale = 1, backgroundColor = '#ffffff' } = options;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds
    const bounds = this.calculateBounds(warehouseItems);
    const scaleFactor = Math.min(
      (width - 100) / bounds.width,
      (height - 100) / bounds.height
    ) * scale;

    const offsetX = (width - bounds.width * scaleFactor) / 2 - bounds.x * scaleFactor;
    const offsetY = (height - bounds.height * scaleFactor) / 2 - bounds.y * scaleFactor;

    // Draw grid if requested
    if (options.includeGrid) {
      this.drawGrid(ctx, width, height, scaleFactor, offsetX, offsetY);
    }

    // Draw warehouse items
    warehouseItems.forEach(item => {
      this.drawItemToCanvas(ctx, item, scaleFactor, offsetX, offsetY, options);
    });

    // Draw measurements if requested
    if (options.includeMeasurements) {
      const measurements = measurementSystem.getAllMeasurements();
      measurements.forEach(measurement => {
        this.drawMeasurementToCanvas(ctx, measurement, scaleFactor, offsetX, offsetY);
      });
    }

    // Convert to blob and download
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        this.downloadBlob(blob, `${options.filename}.png`);
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * Export to SVG format
   */
  async exportToSVG(warehouseItems, options) {
    const bounds = this.calculateBounds(warehouseItems);
    const { width = bounds.width + 100, height = bounds.height + 100 } = options;

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="100%" height="100%" fill="${options.backgroundColor || '#ffffff'}"/>`;

    // Grid
    if (options.includeGrid) {
      svg += this.generateGridSVG(width, height);
    }

    // Warehouse items
    warehouseItems.forEach(item => {
      svg += this.generateItemSVG(item, bounds);
    });

    // Measurements
    if (options.includeMeasurements) {
      const measurements = measurementSystem.getAllMeasurements();
      measurements.forEach(measurement => {
        svg += this.generateMeasurementSVG(measurement, bounds);
      });
    }

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    this.downloadBlob(blob, `${options.filename}.svg`);
    return blob;
  }

  /**
   * Export to PDF format
   */
  async exportToPDF(warehouseItems, options) {
    // For PDF export, we'll create an SVG first then convert
    const svgBlob = await this.exportToSVG(warehouseItems, { ...options, download: false });
    const svgText = await svgBlob.text();

    // Create a simple PDF structure (basic implementation)
    const pdfContent = this.generatePDFContent(svgText, warehouseItems, options);
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    this.downloadBlob(blob, `${options.filename}.pdf`);
    return blob;
  }

  /**
   * Export to JSON format
   */
  exportToJSON(warehouseItems, options) {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      metadata: {
        title: options.title || 'Warehouse Layout',
        description: options.description || 'Exported warehouse layout',
        scale: measurementSystem.scale,
        unit: measurementSystem.unit
      },
      facilities: facilityHierarchy.exportData(),
      warehouseItems: warehouseItems.map(item => ({
        ...item,
        // Remove any non-serializable properties
        element: undefined
      })),
      measurements: measurementSystem.exportMeasurements(),
      bounds: this.calculateBounds(warehouseItems)
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.downloadBlob(blob, `${options.filename}.json`);
    return blob;
  }

  /**
   * Export to CAD format (DXF)
   */
  exportToCAD(warehouseItems, options) {
    let dxfContent = this.generateDXFHeader();
    
    // Add entities
    dxfContent += 'SECTION\n2\nENTITIES\n';
    
    warehouseItems.forEach(item => {
      dxfContent += this.generateDXFEntity(item);
    });
    
    dxfContent += 'ENDSEC\n';
    dxfContent += this.generateDXFFooter();

    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    this.downloadBlob(blob, `${options.filename}.dxf`);
    return blob;
  }

  /**
   * Export to Excel format
   */
  async exportToExcel(warehouseItems, options) {
    // Create workbook data
    const workbookData = this.generateExcelData(warehouseItems);
    
    // Simple CSV format for now (can be enhanced with a proper Excel library)
    let csvContent = 'ID,Type,Name,X,Y,Width,Height,Location Code,Properties\n';
    
    warehouseItems.forEach(item => {
      const properties = JSON.stringify(item.properties || {}).replace(/"/g, '""');
      csvContent += `"${item.id}","${item.type}","${item.name || ''}",${item.x},${item.y},${item.width},${item.height},"${item.locationCode || ''}","${properties}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    this.downloadBlob(blob, `${options.filename}.csv`);
    return blob;
  }

  /**
   * Calculate bounds of all warehouse items
   */
  calculateBounds(warehouseItems) {
    if (warehouseItems.length === 0) {
      return { x: 0, y: 0, width: 1000, height: 1000 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    warehouseItems.forEach(item => {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.width);
      maxY = Math.max(maxY, item.y + item.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Draw warehouse item to canvas
   */
  drawItemToCanvas(ctx, item, scale, offsetX, offsetY, options) {
    const x = item.x * scale + offsetX;
    const y = item.y * scale + offsetY;
    const width = item.width * scale;
    const height = item.height * scale;

    // Set styles based on item type
    ctx.fillStyle = item.color || getComponentColor(item.type, item.category);
    ctx.strokeStyle = getComponentColor(item.type, item.category);
    ctx.lineWidth = 1;

    // Draw item
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Draw label if requested
    if (options.includeLabels && (item.name || item.locationCode)) {
      ctx.fillStyle = '#333333';
      ctx.font = `${Math.max(10, 12 * scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = item.locationCode || item.name || item.type;
      ctx.fillText(label, x + width / 2, y + height / 2);
    }
  }

  /**
   * Generate SVG for warehouse item
   */
  generateItemSVG(item, bounds) {
    const x = item.x - bounds.x + 50;
    const y = item.y - bounds.y + 50;
    
    let svg = `<rect x="${x}" y="${y}" width="${item.width}" height="${item.height}" `;
    svg += `fill="${item.color || getComponentColor(item.type, item.category)}" stroke="${getComponentColor(item.type, item.category)}" stroke-width="1"/>`;
    
    // Add label
    if (item.locationCode || item.name) {
      const label = item.locationCode || item.name || item.type;
      svg += `<text x="${x + item.width / 2}" y="${y + item.height / 2}" `;
      svg += `text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="12" fill="#333333">`;
      svg += `${label}</text>`;
    }
    
    return svg;
  }

  /**
   * Generate DXF entity for warehouse item
   */
  generateDXFEntity(item) {
    // Simple rectangle entity
    return `0
LWPOLYLINE
8
0
90
4
70
1
10
${item.x}
20
${item.y}
10
${item.x + item.width}
20
${item.y}
10
${item.x + item.width}
20
${item.y + item.height}
10
${item.x}
20
${item.y + item.height}
`;
  }

  /**
   * Generate DXF header
   */
  generateDXFHeader() {
    return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
`;
  }

  /**
   * Generate DXF footer
   */
  generateDXFFooter() {
    return `0
EOF
`;
  }

  /**
   * Generate PDF content (basic implementation)
   */
  generatePDFContent(svgContent, warehouseItems, options) {
    // This is a very basic PDF structure
    // In a real implementation, you'd use a proper PDF library like jsPDF
    const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${svgContent.length}
>>
stream
${svgContent}
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${200 + svgContent.length}
%%EOF`;

    return pdfHeader;
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Draw grid to canvas
   */
  drawGrid(ctx, width, height, scale, offsetX, offsetY) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    const gridSize = 50 * scale;
    
    // Vertical lines
    for (let x = offsetX % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = offsetY % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  /**
   * Generate grid SVG
   */
  generateGridSVG(width, height) {
    let svg = '<defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">';
    svg += '<path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" stroke-width="1"/>';
    svg += '</pattern></defs>';
    svg += `<rect width="100%" height="100%" fill="url(#grid)"/>`;
    return svg;
  }
}

// Default layout exporter instance
export const layoutExporter = new LayoutExporter();
