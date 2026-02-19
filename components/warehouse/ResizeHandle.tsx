// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';

/**
 * ResizeHandle Component
 * Provides draggable resize handles for warehouse rack components
 * Allows resizing by dragging edges to increase/decrease grid cells
 */
const ResizeHandle = ({ 
  item, 
  onResize, 
  gridSize = 60, 
  snapToGrid = true,
  color = 'transparent',
  isReadOnly = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  // Only show for horizontal and vertical racks
  const isResizable = item.type === 'sku_holder' || item.type === 'vertical_sku_holder';

  const handleMouseDown = useCallback((e, direction) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDragDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width;
    const startHeight = item.height;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction === 'right') {
        newWidth = startWidth + deltaX;
      } else if (direction === 'bottom') {
        newHeight = startHeight + deltaY;
      } else if (direction === 'left') {
        newWidth = startWidth - deltaX;
      } else if (direction === 'top') {
        newHeight = startHeight - deltaY;
      }
      
      // Snap to grid
      if (snapToGrid) {
        newWidth = Math.round(newWidth / gridSize) * gridSize;
        newHeight = Math.round(newHeight / gridSize) * gridSize;
      }
      
      // Minimum size (at least 1 cell)
      newWidth = Math.max(gridSize, newWidth);
      newHeight = Math.max(gridSize, newHeight);
      
      // Calculate new rows/cols based on size
      const newCols = Math.round(newWidth / gridSize);
      const newRows = Math.round(newHeight / gridSize);
      
      // Update the item - both racks can now resize in both directions
      if (onResize && (newWidth !== item.width || newHeight !== item.height)) {
        onResize({
          width: newWidth,
          height: newHeight,
          cols: newCols,
          rows: newRows
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [item, onResize, gridSize, snapToGrid]);

  // Early return after all hooks
  if (!isResizable || isReadOnly) {
    return null;
  }

  const handleStyle = {
    position: 'absolute',
    backgroundColor: isDragging ? color : 'transparent',
    transition: 'all 0.15s ease',
    zIndex: 10
  };

  const indicatorStyle = {
    backgroundColor: color,
    opacity: 0.6, // Always visible
    transition: 'opacity 0.2s ease'
  };

  const indicatorStyleHover = {
    backgroundColor: color,
    opacity: isHovering || isDragging ? 1 : 0.6,
    transition: 'opacity 0.2s ease'
  };

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/* Right handle - for both racks (increase width/columns) */}
      <div
        onMouseDown={(e) => handleMouseDown(e, 'right')}
        style={{
          ...handleStyle,
          right: -4,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'ew-resize',
          pointerEvents: 'auto'
        }}
      >
        {/* Visual indicator lines */}
        <div style={{
          ...indicatorStyleHover,
          position: 'absolute',
          right: 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 2,
          height: 20,
          borderRadius: 1
        }} />
        <div style={{
          ...indicatorStyleHover,
          position: 'absolute',
          right: 5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 2,
          height: 14,
          borderRadius: 1
        }} />
      </div>

      {/* Bottom handle - for both racks (increase height/rows) */}
      <div
        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        style={{
          ...handleStyle,
          bottom: -4,
          left: 0,
          right: 0,
          height: 8,
          cursor: 'ns-resize',
          pointerEvents: 'auto'
        }}
      >
        {/* Visual indicator lines */}
        <div style={{
          ...indicatorStyleHover,
          position: 'absolute',
          bottom: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          height: 2,
          width: 20,
          borderRadius: 1
        }} />
        <div style={{
          ...indicatorStyleHover,
          position: 'absolute',
          bottom: 5,
          left: '50%',
          transform: 'translateX(-50%)',
          height: 2,
          width: 14,
          borderRadius: 1
        }} />
      </div>
    </div>
  );
};

export default ResizeHandle;

