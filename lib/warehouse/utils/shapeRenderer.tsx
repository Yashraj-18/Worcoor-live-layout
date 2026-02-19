// @ts-nocheck
/**
 * Shape Renderer Utility
 * Generates SVG paths and renders shapes for warehouse components
 */

import { getComponentColor } from './componentColors';

export const generateShapePath = (shapeType: string, width: number, height: number, options: any = {}) => {
  const { x = 0, y = 0 } = options as { x?: number; y?: number };

  switch (shapeType) {
    case 'shape_rectangle':
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    
    case 'shape_circle':
      const radius = Math.min(width, height) / 2;
      const cx = x + width / 2;
      const cy = y + height / 2;
      return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`;
    
    case 'shape_ellipse':
      const rx = width / 2;
      const ry = height / 2;
      const ecx = x + rx;
      const ecy = y + ry;
      return `M ${ecx - rx} ${ecy} A ${rx} ${ry} 0 1 0 ${ecx + rx} ${ecy} A ${rx} ${ry} 0 1 0 ${ecx - rx} ${ecy}`;
    
    case 'shape_triangle':
      return `M ${x + width / 2} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    
    case 'shape_rounded_rectangle':
      const r = Math.min(10, width / 4, height / 4);
      return `M ${x + r} ${y} 
              L ${x + width - r} ${y} 
              A ${r} ${r} 0 0 1 ${x + width} ${y + r}
              L ${x + width} ${y + height - r}
              A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}
              L ${x + r} ${y + height}
              A ${r} ${r} 0 0 1 ${x} ${y + height - r}
              L ${x} ${y + r}
              A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
    
    case 'shape_l_area':
      const thickness = Math.min(40, width / 3, height / 3);
      return `M ${x} ${y} 
              L ${x + width} ${y} 
              L ${x + width} ${y + thickness}
              L ${x + thickness} ${y + thickness}
              L ${x + thickness} ${y + height}
              L ${x} ${y + height} Z`;
    
    case 'shape_u_area':
      const uThickness = Math.min(30, width / 4);
      const opening = Math.min(width * 0.4, width - 2 * uThickness);
      const openingStart = x + (width - opening) / 2;
      return `M ${x} ${y} 
              L ${x + width} ${y} 
              L ${x + width} ${y + height}
              L ${x + width - uThickness} ${y + height}
              L ${x + width - uThickness} ${y + uThickness}
              L ${openingStart + opening} ${y + uThickness}
              L ${openingStart + opening} ${y + height}
              L ${openingStart} ${y + height}
              L ${openingStart} ${y + uThickness}
              L ${x + uThickness} ${y + uThickness}
              L ${x + uThickness} ${y + height}
              L ${x} ${y + height} Z`;
    
    case 'shape_t_area':
      const tThickness = Math.min(30, height / 3);
      const stemWidth = Math.min(40, width / 3);
      const stemStart = x + (width - stemWidth) / 2;
      return `M ${x} ${y} 
              L ${x + width} ${y} 
              L ${x + width} ${y + tThickness}
              L ${stemStart + stemWidth} ${y + tThickness}
              L ${stemStart + stemWidth} ${y + height}
              L ${stemStart} ${y + height}
              L ${stemStart} ${y + tThickness}
              L ${x} ${y + tThickness} Z`;
    
    case 'shape_loading_bay':
      const dockWidth = width * 0.8;
      const dockHeight = height * 0.6;
      const rampWidth = width * 0.2;
      return `M ${x} ${y} 
              L ${x + dockWidth} ${y} 
              L ${x + dockWidth} ${y + dockHeight}
              L ${x + width} ${y + dockHeight + height * 0.2}
              L ${x + width} ${y + height}
              L ${x} ${y + height} Z`;
    
    case 'shape_conveyor_curve':
      const curveRadius = Math.min(width, height) / 2;
      const curveCx = x + width / 2;
      const curveCy = y + height / 2;
      return `M ${curveCx - curveRadius} ${curveCy} 
              A ${curveRadius} ${curveRadius} 0 0 1 ${curveCx} ${curveCy - curveRadius}
              A ${curveRadius} ${curveRadius} 0 0 1 ${curveCx + curveRadius} ${curveCy}
              A ${curveRadius} ${curveRadius} 0 0 1 ${curveCx} ${curveCy + curveRadius}
              A ${curveRadius} ${curveRadius} 0 0 1 ${curveCx - curveRadius} ${curveCy} Z`;
    
    case 'shape_ramp':
      return `M ${x} ${y + height} 
              L ${x + width} ${y} 
              L ${x + width} ${y + height * 0.2}
              L ${x} ${y + height} Z`;
    
    case 'shape_polygon':
      // Default hexagon
      const sides = 6;
      const polygonRadius = Math.min(width, height) / 2;
      const polygonCx = x + width / 2;
      const polygonCy = y + height / 2;
      let polygonPath = '';
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = polygonCx + polygonRadius * Math.cos(angle);
        const py = polygonCy + polygonRadius * Math.sin(angle);
        polygonPath += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
      }
      return polygonPath + ' Z';
    
    case 'shape_bezier_curve':
      const cp1x = x + width * 0.25;
      const cp1y = y;
      const cp2x = x + width * 0.75;
      const cp2y = y + height;
      return `M ${x} ${y + height / 2} 
              C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x + width} ${y + height / 2}`;
    
    case 'shape_custom_path':
      // Default star shape
      const starRadius = Math.min(width, height) / 2;
      const starCx = x + width / 2;
      const starCy = y + height / 2;
      const innerRadius = starRadius * 0.5;
      let starPath = '';
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? starRadius : innerRadius;
        const px = starCx + radius * Math.cos(angle);
        const py = starCy + radius * Math.sin(angle);
        starPath += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
      }
      return starPath + ' Z';
    
    default:
      // Default rectangle
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }
};

export const renderShapeComponent = (item: any) => {
  if (!item.isShape) {
    return null;
  }

  const path = generateShapePath(item.type, item.width, item.height);
  const isContainer = item.isContainer;
  
  return (
    <svg
      width={item.width}
      height={item.height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }}
    >
      <path
        d={path}
        fill={isContainer ? 'transparent' : 
             (item.type === 'sku_holder' || item.type === 'vertical_sku_holder') ? 'transparent' :
             (item.color || getComponentColor(item.type, item.category))}
        stroke={isContainer ? 'transparent' : 
               (item.type === 'sku_holder' || item.type === 'vertical_sku_holder') ? 'transparent' :
               (item.color || getComponentColor(item.type, item.category))}
        strokeWidth={isContainer ? "3" : "1"}
        opacity={isContainer ? "1" : "0.8"}
        strokeDasharray={isContainer ? "none" : "none"}
      />
      {/* Add inner border for containers to show the containment area */}
      {isContainer && item.containerPadding && (
        <path
          d={generateShapePath(item.type, item.width - (item.containerPadding * 2), item.height - (item.containerPadding * 2), { x: item.containerPadding, y: item.containerPadding })}
          fill="none"
          stroke={isContainer ? 'transparent' : 
               (item.type === 'sku_holder' || item.type === 'vertical_sku_holder') ? 'transparent' :
               (item.color || getComponentColor(item.type, item.category))}
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="5,5"
        />
      )}
    </svg>
  );
};

export const isPointInsideContainer = (x: number, y: number, container: any) => {
  if (!container.isContainer) return false;
  
  const padding = container.containerPadding || 10;
  const innerX = container.x + padding;
  const innerY = container.y + padding;
  const innerWidth = container.width - (padding * 2);
  const innerHeight = container.height - (padding * 2);
  
  // Basic rectangular containment check - can be enhanced for complex shapes
  return x >= innerX && x <= innerX + innerWidth && y >= innerY && y <= innerY + innerHeight;
};

export const getContainerBounds = (container: any) => {
  if (!container.isContainer) return null;
  
  const padding = container.containerPadding || 10;
  return {
    x: container.x + padding,
    y: container.y + padding,
    width: container.width - (padding * 2),
    height: container.height - (padding * 2)
  };
};
