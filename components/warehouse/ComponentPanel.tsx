'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useDrag } from 'react-dnd';

import { DRAG_TYPES, WAREHOUSE_COMPONENTS } from '@/lib/warehouse/constants/warehouseComponents';
import { getLucideIcon, getIconSize, getIconColor, ICON_RENDER_PROPS, getCategoryIcon } from '@/lib/warehouse/constants/lucideIconMapping';
import { ChevronDown, ChevronRight } from 'lucide-react';



interface ComponentItem {

  type: string;

  name: string;

  icon: string;

  color: string;

  defaultSize?: { width: number; height: number };

  description: string;

  drawingTool?: boolean;

  priority?: 'high' | 'medium' | 'low' | string;

  isBoundary?: boolean;

  isHollow?: boolean;

  borderWidth?: number;

  borderColor?: string;

  gridStep?: number;

  [key: string]: any; // Allow additional properties

}



interface DraggableComponentProps {

  component: ComponentItem;

}



interface ComponentCategoryData {

  category: string;

  icon?: string;

  priority?: string;

  expanded?: boolean;

  components: ComponentItem[];

  [key: string]: any; // Allow additional properties

}



interface ComponentCategoryProps {

  category: ComponentCategoryData;

  isExpanded: boolean;

  onToggle: () => void;

}



const DraggableComponent: React.FC<DraggableComponentProps> = ({ component }) => {

  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({

    type: DRAG_TYPES.COMPONENT,

    item: {

      ...component,

      // Ensure all required properties are included

      type: component.type,

      name: component.name,

      icon: component.icon,

      color: component.color,

      defaultSize: component.defaultSize || { width: 50, height: 50 },

      description: component.description,

      drawingTool: component.drawingTool || false,

      priority: component.priority || 'medium'

    },

    collect: (monitor: any) => ({

      isDragging: monitor.isDragging(),

    }),

    canDrag: () => true,

    end: (item, monitor) => {

      // Reset any visual states after drag ends

      if (!monitor.didDrop()) {

        // Handle failed drop if needed

        console.log('Drop failed for:', item.name);

      }

    }

  });



  // Connect the drag source to the ref

  useEffect(() => {

    if (ref.current) {

      drag(ref.current);

    }

  }, [drag]);



  // Create custom drag preview with label

  useEffect(() => {

    const img = new Image();

    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // 1x1 transparent gif

    img.onload = () => preview(img);

  }, [preview]);



  // Get the appropriate Lucide icon for this component
  const LucideIcon = getLucideIcon(component.type);
  const iconSize = getIconSize(component.priority, component.category);
  const iconColor = getIconColor(component.priority);

  return (

    <div

      ref={ref}

      className={`component-item ${isDragging ? 'dragging' : ''} ${component.drawingTool ? 'drawing-tool' : ''}`}

      data-priority={component.priority || 'medium'}

      data-type={component.type}

      style={{

        backgroundColor: component.color,

        opacity: isDragging ? 0.7 : 1,

        border: '1px solid rgba(255,255,255,0.2)',

        borderRadius: '8px',

        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',

        cursor: 'grab',

        display: 'flex',

        flexDirection: 'column',

        alignItems: 'center',

        justifyContent: 'center',

        padding: '8px',

        minHeight: '60px',

        position: 'relative'

      }}

      title={`${component.description}${component.priority ? ` (${component.priority} priority)` : ''}\nDrag to canvas to add`}

    >

      {/* Lucide Icon */}
      <div className="component-icon" style={{
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LucideIcon 
          size={iconSize} 
          color={iconColor}
          {...ICON_RENDER_PROPS}
        />
      </div>

      {/* Component Name */}
      <div className="component-name" style={{

        color: 'white',

        fontWeight: '600',

        fontSize: '10px',

        textAlign: 'center',

        lineHeight: '1.2',

        textShadow: '0 1px 2px rgba(0,0,0,0.8)',

        wordWrap: 'break-word',

        overflow: 'hidden',

        display: '-webkit-box',

        WebkitLineClamp: '2',

        WebkitBoxOrient: 'vertical',

        alignItems: 'center',

        justifyContent: 'center',

        width: '100%',

        maxWidth: '100%'

      }}>{component.name}</div>

                </div>

  );

};



const ComponentCategory: React.FC<ComponentCategoryProps> = ({ category, isExpanded, onToggle }) => {
  // Get the appropriate icon for this category
  const CategoryIcon = getCategoryIcon(category.category);

  // Sort components by priority (high -> medium -> low)

  const sortedItems = [...(category.components || [])].sort((a: ComponentItem, b: ComponentItem) => {

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

    const aPriority = priorityOrder[a.priority as string] || 1;

    const bPriority = priorityOrder[b.priority as string] || 1;

    return aPriority - bPriority;

  });



  return (

    <div className="component-category" data-category={category.category}>

      <div 

        className="category-header" 

        onClick={onToggle}

        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}

      >

        <span className="category-toggle" style={{ display: 'flex', alignItems: 'center' }}>
          {isExpanded ? (
            <ChevronDown size={16} color="#6b7280" />
          ) : (
            <ChevronRight size={16} color="#6b7280" />
          )}
        </span>

        <span className="category-icon" style={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon size={18} color="#374151" />
        </span>

        <span className="category-title" style={{ fontWeight: '600', color: '#374151' }}>
          {category.category}
        </span>

        <span className="category-count" style={{ 
          fontSize: '12px', 
          color: '#6b7280'
        }}>
          ({(category.components || []).length})
        </span>

              </div>

      {isExpanded && (

        <div className="category-items animate-fade-in">

          {sortedItems.map((component, index) => (

            <DraggableComponent key={index} component={component} />

          ))}

        </div>

      )}

    </div>

  );

};



const ComponentPanel = () => {

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({

    'Primary Components': true,

    'Storage & Inventory': false,

    'Operations': false,

    'Facilities': false,

    'Multi-Level Facilities': false,

    'Advanced Shapes': false,

    'Structure & Layout': false,

    'Traffic & Flow': false,

    'Utilities & Safety': false,

    'Shapes': false,

    'Layout Boundaries': true,

    'Zone Types': true,

    'Unit Types': true,

    'Common Areas': false,

    'Office Spaces': false

  });



  const toggleCategory = (categoryName: string) => {

    setExpandedCategories(prev => ({

      ...prev,

      [categoryName]: !prev[categoryName]

    }));

  };



  const expandAll = () => {

    const allExpanded: Record<string, boolean> = {};

    WAREHOUSE_COMPONENTS.forEach((cat: any) => {

      allExpanded[cat.category] = true;

    });

    setExpandedCategories(allExpanded);

  };



  const collapseAll = () => {

    const allCollapsed: Record<string, boolean> = {};

    WAREHOUSE_COMPONENTS.forEach((cat: any) => {

      allCollapsed[cat.category] = false;

    });

    setExpandedCategories(allCollapsed);

  };



  return (

    <div className="component-panel animate-slide-right">

      {/* Header */}

      <div className="flex items-center justify-between p-6 border-b border-slate-700/50 h-20 bg-slate-900/50">

        <div className="flex items-center gap-3">

          <h3 className="text-xl font-bold text-white">Components</h3>

        </div>

      </div>

      

      {/* Categories Container */}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">

        {WAREHOUSE_COMPONENTS.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-12 text-center">

            <div className="text-4xl mb-4 opacity-30">📦</div>

            <div className="text-slate-400 font-medium mb-2">No components available</div>

            <div className="text-slate-500 text-sm">Components will be added step by step</div>

          </div>

        ) : (

          WAREHOUSE_COMPONENTS.map((category, index) => (

            <ComponentCategory

              key={index}

              category={category}

              isExpanded={expandedCategories[category.category]}

              onToggle={() => toggleCategory(category.category)}

            />

          ))

        )}

      </div>

    </div>

  );

};



export default ComponentPanel;



