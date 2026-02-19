'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import WarehouseItem from './WarehouseItem';
import { DRAG_TYPES, STACKABLE_COMPONENTS } from '@/lib/warehouse/constants/warehouseComponents';
import { findAllConnections, snapToConnection, LINKABLE_ELEMENTS } from '@/lib/warehouse/utils/linkingUtils';
import { isPointInsideContainer, getContainerBounds } from '@/lib/warehouse/utils/shapeRenderer';
import { hierarchicalManager } from '@/lib/warehouse/utils/hierarchicalContainer';
import { getComponentColor } from '@/lib/warehouse/utils/componentColors';

const WarehouseCanvas = ({ 
  items, 
  onAddItem, 
  onMoveItem, 
  onSelectItem, 
  selectedItemId,
  selectedItemIds = [],
  onUpdateItem,
  onCanvasClick,
  stackMode,
  onRightClick,
  onCreateStack,
  onInfoClick,
  zoomLevel,
  panOffset,
  onPanChange,
  onRequestSkuId,
  centerCanvasTrigger
}) => {
  const canvasRef = useRef(null);
  const isDragging = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const [connectionPreview, setConnectionPreview] = useState(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState(null);
  const [drawingPreview, setDrawingPreview] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // ADD right after those two lines:
  const [keyboardFocusedId, setKeyboardFocusedId] = useState(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  
  const handleCanvasKeyDown = useCallback((e) => {
    const navigableItems = items.filter(
      i => i.type !== 'square_boundary' && i.type !== 'inner_boundary'
    );
    if (navigableItems.length === 0) return;
    
    const currentIndex = navigableItems.findIndex(i => i.id === keyboardFocusedId);
    
    switch (e.key) {
      case 'Tab':
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        const nextIdx = currentIndex === -1 ? 0 : (currentIndex + 1) % navigableItems.length;
        setKeyboardFocusedId(navigableItems[nextIdx].id);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        const prevIdx = currentIndex <= 0
          ? navigableItems.length - 1
          : currentIndex - 1;
        setKeyboardFocusedId(navigableItems[prevIdx].id);
        break;
      }
      case ' ':
      case 'Enter': {
        e.preventDefault();
        if (keyboardFocusedId) {
          onSelectItem(keyboardFocusedId, true); // additive select
        }
        break;
      }
      case 'Escape': {
        setKeyboardFocusedId(null);
        onCanvasClick();
        break;
      }
    }
  }, [items, keyboardFocusedId, onSelectItem, onCanvasClick]);

  // Prevent browser zoom when canvas is focused and handle drawing mode keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (canvasRef.current && canvasRef.current.contains(e.target)) {
        // Prevent browser zoom shortcuts
        if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0')) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        // Exit drawing mode with ESC key
        if (e.key === 'Escape' && drawingMode) {
          setDrawingMode(null);
          setIsDrawing(false);
          setDrawingStart(null);
          setDrawingPreview(null);
          if (canvasRef.current) {
            canvasRef.current.style.cursor = '';
          }
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const preventBrowserZoomWheel = (e) => {
      if (canvasRef.current && canvasRef.current.contains(e.target)) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('wheel', preventBrowserZoomWheel, { passive: false, capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('wheel', preventBrowserZoomWheel, { capture: true });
    };
  }, [drawingMode]);

  // Center the scroll position on component mount
  useEffect(() => {
    if (canvasRef.current) {
      // Center the scrollable area (5000x5000 canvas)
      const canvas = canvasRef.current;
      const centerX = (5000 - canvas.clientWidth) / 2;
      const centerY = (5000 - canvas.clientHeight) / 2;
      
      canvas.scrollLeft = centerX;
      canvas.scrollTop = centerY;
    }
  }, []); // Run only on mount

  // Function to center the canvas
  const centerCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const centerX = (5000 - canvas.clientWidth) / 2;
      const centerY = (5000 - canvas.clientHeight) / 2;
      
      canvas.scrollTo({
        left: centerX,
        top: centerY,
        behavior: 'smooth'
      });
    }
  };

  // Re-center when trigger changes
  useEffect(() => {
    if (centerCanvasTrigger > 0) {
      centerCanvas();
    }
  }, [centerCanvasTrigger]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [DRAG_TYPES.COMPONENT, DRAG_TYPES.WAREHOUSE_ITEM],
    drop: (draggedItem: any, monitor: any) => {
      console.log('Drop detected:', draggedItem);
      // Check if this is a drawing tool
      if ((draggedItem as any).drawingTool) {
        console.log('Activating drawing mode for:', (draggedItem as any).name);
        setDrawingMode(draggedItem);
        // Show visual feedback that drawing mode is active
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'crosshair';
        }
        return;
      }
      const offset = monitor.getClientOffset();
      if (!offset) {
        console.warn('No offset available for drop');
        return;
      }
      
      const canvasElement = canvasRef.current || document.querySelector('.warehouse-canvas');
      if (!canvasElement) {
        console.warn('Canvas element not found');
        return;
      }
      
      const canvasRect = canvasElement.getBoundingClientRect();
      
      // Get scroll position of the canvas
      const scrollLeft = canvasElement.scrollLeft;
      const scrollTop = canvasElement.scrollTop;
      
      // Calculate position relative to the scrollable content
      const rawX = offset.x - canvasRect.left + scrollLeft;
      const rawY = offset.y - canvasRect.top + scrollTop;
      
      // Apply zoom and pan transformations
      const x = (rawX - panOffset.x) / zoomLevel;
      const y = (rawY - panOffset.y) / zoomLevel;
      
      // Debug: Enhanced coordinate logging for better positioning
      console.log('Enhanced Drop Coordinates:', { 
        rawX, rawY, x, y, 
        panOffset, zoomLevel,
        draggedItem: (draggedItem as any).type,
        draggedItemSize: { 
          width: (draggedItem as any).defaultSize?.width, 
          height: (draggedItem as any).defaultSize?.height 
        }
      });

      // Check if dropping onto an existing item for stacking or container placement
      const targetItem = items.find((item: any) => {
        return x >= item.x && x <= item.x + item.width &&
               y >= item.y && y <= item.y + item.height;
      });

      // Check if dropping into a container using hierarchical system
      const containerItem = hierarchicalManager.getValidContainer(x, y, draggedItem, items);

      if ((draggedItem as any).id) {
        // Check if item position is locked
        if ((draggedItem as any).isPositionLocked) {
          console.log('Cannot move position-locked item:', (draggedItem as any).id);
          return;
        }
        // Moving existing item
        if (targetItem && targetItem.id !== (draggedItem as any).id && stackMode === 'enabled') {
          // Check if both items can be stacked
          const draggedItemData = items.find((item: any) => item.id === (draggedItem as any).id);
          if (draggedItemData && 
              STACKABLE_COMPONENTS.includes(targetItem.type) && 
              STACKABLE_COMPONENTS.includes(draggedItemData.type)) {
            onCreateStack(targetItem.id, (draggedItem as any).id);
            return;
          }
        }
        
        // Check for linking opportunities for structural elements
        const draggedItemData = items.find((item: any) => item.id === (draggedItem as any).id);
        if (draggedItemData && LINKABLE_ELEMENTS.includes(draggedItemData.type)) {
          const tempItem = { ...draggedItemData, x: Math.max(0, x), y: Math.max(0, y) };
          const connections = findAllConnections(tempItem, items);
          
          if (connections.length > 0) {
            // Auto-snap to the first available connection
            const snappedItem = snapToConnection(tempItem, connections[0].targetElement, connections[0]);
            onMoveItem((draggedItem as any).id, snappedItem.x, snappedItem.y);
          } else {
            // Apply grid snapping for moved items
            let snapX = x, snapY = y;
            if ((draggedItem as any).type === 'square_boundary' || (draggedItem as any).gridAligned) {
              const majorGridSize = 60;
              snapX = Math.round(x / majorGridSize) * majorGridSize;
              snapY = Math.round(y / majorGridSize) * majorGridSize;
            } else {
              const subGridSize = 15;
              snapX = Math.round(x / subGridSize) * subGridSize;
              snapY = Math.round(y / subGridSize) * subGridSize;
            }
            onMoveItem((draggedItem as any).id, Math.max(0, snapX), Math.max(0, snapY));
          }
        } else {
          // Enhanced grid snapping for moved items with cursor offset compensation
          let gridSize = 15; // Default sub-grid for most components
          
          // Determine appropriate grid size based on component properties
          if ((draggedItem as any).type === 'solid_boundary' || (draggedItem as any).type === 'dotted_boundary') {
            // Boundary components use 15px grid for precise positioning
            gridSize = 15;
          } else if ((draggedItem as any).gridStep) {
            // Use component's specific grid step if defined
            gridSize = (draggedItem as any).gridStep;
          } else if ((draggedItem as any).type === 'square_boundary' || (draggedItem as any).gridAligned) {
            // Floor plan components and grid-aligned items use major 60px grid
            gridSize = 60;
          }
          
          // Calculate cursor offset from component center for precise positioning
          const itemWidth = (draggedItem as any).width || 50;
          const itemHeight = (draggedItem as any).height || 50;
          const offsetX = itemWidth / 2; // Half width for center positioning
          const offsetY = itemHeight / 2; // Half height for center positioning
          
          // Apply grid snapping with cursor offset compensation
          const snapX = Math.round((x - offsetX) / gridSize) * gridSize;
          const snapY = Math.round((y - offsetY) / gridSize) * gridSize;
          
          onMoveItem((draggedItem as any).id, Math.max(0, snapX), Math.max(0, snapY));
        }
      } else {
        // Adding new item from component panel
        if (targetItem && stackMode === 'enabled' && 
            STACKABLE_COMPONENTS.includes(targetItem.type) && 
            STACKABLE_COMPONENTS.includes((draggedItem as any).type)) {
          // Create stack with new item
          const newItem = {
            id: uuidv4(),
            type: (draggedItem as any).type,
            name: (draggedItem as any).name,
            x: targetItem.x,
            y: targetItem.y,
            width: (draggedItem as any).defaultSize.width,
            height: (draggedItem as any).defaultSize.height,
            color: (draggedItem as any).color,
            label: ''
          };
          onCreateStack(targetItem.id, null, newItem);
        } else {
          // Regular item placement with hierarchical system and cursor offset compensation
          let finalX = Math.max(0, x);
          let finalY = Math.max(0, y);
          let containerId = null;
          let itemName = (draggedItem as any).name;

          // Enhanced grid snapping for ALL components with cursor offset compensation
          let gridSize = 15; // Default sub-grid for most components
          
          // Determine appropriate grid size based on component properties
          if ((draggedItem as any).type === 'solid_boundary' || (draggedItem as any).type === 'dotted_boundary') {
            // Boundary components use 15px grid for precise positioning
            gridSize = 15;
          } else if ((draggedItem as any).gridStep) {
            // Use component's specific grid step if defined
            gridSize = (draggedItem as any).gridStep;
          } else if ((draggedItem as any).type === 'square_boundary' || (draggedItem as any).gridAligned) {
            // Floor plan components and grid-aligned items use major 60px grid
            gridSize = 60;
          }
          
          // Calculate cursor offset from component center for precise positioning
          const itemWidth = (draggedItem as any).defaultSize?.width || 50;
          const itemHeight = (draggedItem as any).defaultSize?.height || 50;
          const offsetX = itemWidth / 2; // Half width for center positioning
          const offsetY = itemHeight / 2; // Half height for center positioning
          
          // Apply grid snapping with cursor offset compensation
          finalX = Math.round((finalX - offsetX) / gridSize) * gridSize;
          finalY = Math.round((finalY - offsetY) / gridSize) * gridSize;
          
          // Ensure minimum position
          finalX = Math.max(0, finalX);
          finalY = Math.max(0, finalY);

          // If dropping into a container, adjust position and set container relationship
          if (containerItem) {
            containerId = containerItem.id;
            // Position relative to container's inner bounds
            const containerBounds = hierarchicalManager.getContainerBounds(containerItem);
            finalX = Math.max(containerBounds.x, Math.min(finalX, containerBounds.x + containerBounds.width - ((draggedItem as any).defaultSize?.width || 50)));
            finalY = Math.max(containerBounds.y, Math.min(finalY, containerBounds.y + containerBounds.height - ((draggedItem as any).defaultSize?.height || 50)));
          }

          // Auto-label zones
          if ((draggedItem as any).autoLabel && (draggedItem as any).zoneType) {
            const zoneLabel = hierarchicalManager.generateZoneLabel((draggedItem as any).zoneType);
            itemName = `${(draggedItem as any).name} ${zoneLabel}`;
          }

          // 🐛 DEBUG: Storage Unit Creation
          if ((draggedItem as any).type === 'storage_unit') {
            console.group('🎨 STORAGE UNIT COLOR DEBUG - WarehouseCanvas.tsx (Creation)');
            console.log('DraggedItem Type:', (draggedItem as any).type);
            console.log('DraggedItem Color:', (draggedItem as any).color);
            console.log('DraggedItem Category:', (draggedItem as any).category);
            console.log('getComponentColor Result:', getComponentColor((draggedItem as any).type, (draggedItem as any).category));
            console.log('Final Color Will Be:', (draggedItem as any).color || getComponentColor((draggedItem as any).type, (draggedItem as any).category) || '#e3f2fd');
            console.groupEnd();
          }

          const newItem = {
            id: uuidv4(),
            type: (draggedItem as any).type,
            name: itemName,
            x: finalX,
            y: finalY,
            width: (draggedItem as any).defaultSize?.width || 50,
            height: (draggedItem as any).defaultSize?.height || 50,
            color: (draggedItem as any).color || 
       ((draggedItem as any).type === 'sku_holder' || (draggedItem as any).type === 'vertical_sku_holder') ? 'transparent' :
       getComponentColor((draggedItem as any).type, (draggedItem as any).category) || '#e3f2fd',
            label: (draggedItem as any).autoLabel && (draggedItem as any).zoneType ? hierarchicalManager.generateZoneLabel((draggedItem as any).zoneType) : '',
            icon: (draggedItem as any).icon,
            isShape: (draggedItem as any).isShape || false,
            isContainer: (draggedItem as any).isContainer || false,
            containerLevel: (draggedItem as any).containerLevel,
            containerPadding: (draggedItem as any).containerPadding,
            zoneType: (draggedItem as any).zoneType,
            unitType: (draggedItem as any).unitType,
            containerId: containerId,
            // Floor Plan Component properties
            isBoundary: (draggedItem as any).isBoundary || false,
            isHollow: (draggedItem as any).isHollow || false,
            borderWidth: (draggedItem as any).borderWidth,
            snapToGrid: (draggedItem as any).snapToGrid || false,
            resizable: (draggedItem as any).resizable || false,
            minSize: (draggedItem as any).minSize,
            maxSize: (draggedItem as any).maxSize,
            gridStep: (draggedItem as any).gridStep || 60,
            // SKU-related properties
            hasSku: (draggedItem as any).hasSku || false,
            singleSku: (draggedItem as any).singleSku || false,
            skuGrid: (draggedItem as any).skuGrid || false,
            skuCompartments: (draggedItem as any).skuCompartments,
            compartmentSize: (draggedItem as any).compartmentSize,
            showCompartments: (draggedItem as any).showCompartments || false,
            allowEmpty: (draggedItem as any).allowEmpty || false,
            maxSKUsPerCompartment: (draggedItem as any).maxSKUsPerCompartment || 1,
            supportsMultipleLocationIds: (draggedItem as any).supportsMultipleLocationIds || false,
            supportsMultipleTags: (draggedItem as any).supportsMultipleTags || false,
            compartmentContents: ((draggedItem as any).type === 'sku_holder' || (draggedItem as any).type === 'vertical_sku_holder') ? {} : undefined // Initialize empty for user to populate
          };
          
          console.log('Creating new item:', newItem);
          
          // Check for linking opportunities for new structural elements
          if (LINKABLE_ELEMENTS.includes((draggedItem as any).type)) {
            const connections = findAllConnections(newItem, items);
            
            if (connections.length > 0) {
              // Auto-snap to the first available connection
              const snappedItem = snapToConnection(newItem, connections[0].targetElement, connections[0]);
              onAddItem(snappedItem);
            } else {
              onAddItem(newItem);
            }
          } else {
            onAddItem(newItem);
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      // Don't clear selection if in drawing mode
      if (!drawingMode) {
        onCanvasClick();
      }
    }
  };

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const rawX = clientX - canvasRect.left - 32; // Account for padding
    const rawY = clientY - canvasRect.top - 32;
    return {
      x: (rawX - panOffset.x) / zoomLevel,
      y: (rawY - panOffset.y) / zoomLevel
    };
  }, [panOffset.x, panOffset.y, zoomLevel]);


  const handleWheel = useCallback((e) => {
    // Always prevent default to stop browser zoom and scrolling
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle wheel events if they're specifically for canvas interaction
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl+scroll - only affect canvas
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25; // More responsive zoom
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor)); // Increased max zoom
      
      if (onPanChange && newZoom !== zoomLevel) {
        // Zoom towards mouse position
        const zoomRatio = newZoom / zoomLevel;
        const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;
        
        onPanChange({ x: newPanX, y: newPanY }, newZoom);
      }
    }
    // Remove regular scroll panning to prevent unwanted movement
    return false;
  }, [zoomLevel, panOffset, onPanChange]);

  const handleMouseDown = useCallback((e) => {
    // Drawing mode takes priority - check if we're clicking on canvas or drop zone
    if (drawingMode && (e.target === e.currentTarget || e.target.classList.contains('drop-zone')) && e.button === 0 && !e.altKey) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setIsDrawing(true);
      setDrawingStart(coords);
      setDrawingPreview({
        ...drawingMode,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0
      });
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Panning mode
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+left mouse
      e.preventDefault();
      isDragging.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      canvasRef.current.style.cursor = 'grabbing';
      return;
    }
    
    // Selection box mode - only on empty canvas with left click
    if (e.button === 0 && !e.altKey && (e.target === e.currentTarget || e.target.classList.contains('drop-zone'))) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setSelectionBox({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y
      });
      e.preventDefault();
    }
  }, [drawingMode, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e) => {
    // Drawing preview
    if (isDrawing && drawingStart && drawingMode) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      const width = Math.abs(coords.x - drawingStart.x);
      const height = Math.abs(coords.y - drawingStart.y);
      const x = Math.min(coords.x, drawingStart.x);
      const y = Math.min(coords.y, drawingStart.y);

      // For line tools, maintain minimum thickness based on tool type
      let finalWidth = width;
      let finalHeight = height;
      
      if (drawingMode.type === 'draw_line') {
        // Improved line detection with better thresholds
        const aspectRatio = width / height;
        const lineThickness = 2; // Simplified thin line thickness
        
        if (aspectRatio > 2) {
          // Horizontal line (width is significantly larger than height)
          finalHeight = lineThickness;
          finalWidth = Math.max(30, width);
        } else if (aspectRatio < 0.5) {
          // Vertical line (height is significantly larger than width)
          finalWidth = lineThickness;
          finalHeight = Math.max(30, height);
        } else {
          // Diagonal or square - treat as short line based on dominant dimension
          if (width >= height) {
            finalHeight = lineThickness;
            finalWidth = Math.max(30, width);
          } else {
            finalWidth = lineThickness;
            finalHeight = Math.max(30, height);
          }
        }
      } else if (drawingMode.type === 'draw_wall') {
        if (width > height) {
          finalHeight = Math.max(12, drawingMode.defaultSize.height);
        } else {
          finalWidth = Math.max(12, drawingMode.defaultSize.width);
        }
      } else if (drawingMode.type === 'draw_border') {
        if (width > height) {
          finalHeight = Math.max(8, drawingMode.defaultSize.height);
        } else {
          finalWidth = Math.max(8, drawingMode.defaultSize.width);
        }
      }

      // Set minimum dimensions based on tool type
      let minWidth, minHeight;
      if (drawingMode.type === 'draw_line') {
        minWidth = finalWidth;
        minHeight = finalHeight;
      } else {
        minWidth = 10;
        minHeight = 10;
      }

      setDrawingPreview({
        ...drawingMode,
        x: x,
        y: y,
        width: Math.max(minWidth, finalWidth),
        height: Math.max(minHeight, finalHeight)
      });
      return;
    }
    
    // Panning
    if (isDragging.current && onPanChange) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      
      onPanChange({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      }, zoomLevel);
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
    // Update selection box
    if (selectionBox) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      setSelectionBox(prev => ({
        ...prev,
        currentX: coords.x,
        currentY: coords.y
      }));
      
      // Calculate which items are within selection box
      const minX = Math.min(selectionBox.startX, coords.x);
      const maxX = Math.max(selectionBox.startX, coords.x);
      const minY = Math.min(selectionBox.startY, coords.y);
      const maxY = Math.max(selectionBox.startY, coords.y);
      
      const itemsInBox = items.filter(item => {
        const itemCenterX = item.x + item.width / 2;
        const itemCenterY = item.y + item.height / 2;
        return itemCenterX >= minX && itemCenterX <= maxX &&
               itemCenterY >= minY && itemCenterY <= maxY;
      });
      
      setSelectedItems(itemsInBox.map(item => item.id));
    }
  }, [isDrawing, drawingStart, drawingMode, getCanvasCoordinates, panOffset, zoomLevel, onPanChange, selectionBox, items]);

  const handleMouseUp = useCallback(() => {
    // Complete drawing
    if (isDrawing && drawingPreview && drawingMode) {
      // Create the actual item with proper dimensions
      let finalWidth = drawingPreview.width;
      let finalHeight = drawingPreview.height;
      
      // Ensure minimum dimensions for lines with improved logic
      if (drawingMode.type === 'draw_line') {
        const aspectRatio = finalWidth / finalHeight;
        const lineThickness = 2;
        
        if (aspectRatio > 2) {
          // Horizontal line
          finalHeight = lineThickness;
          finalWidth = Math.max(30, finalWidth);
        } else if (aspectRatio < 0.5) {
          // Vertical line
          finalWidth = lineThickness;
          finalHeight = Math.max(30, finalHeight);
        } else {
          // Default to horizontal for ambiguous cases
          finalHeight = lineThickness;
          finalWidth = Math.max(30, finalWidth);
        }
      }
      
      const newItem = {
        id: uuidv4(),
        type: drawingMode.type,
        name: drawingMode.name.replace(' Tool', ''),
        x: Math.max(0, drawingPreview.x),
        y: Math.max(0, drawingPreview.y),
        width: finalWidth,
        height: finalHeight,
        color: drawingMode.color,
        label: ''
      };
      
      onAddItem(newItem);
      
      // Reset drawing state but keep drawing mode active
      setIsDrawing(false);
      setDrawingStart(null);
      setDrawingPreview(null);
      return;
    }
    
    // Complete selection
    if (selectionBox) {
      setSelectionBox(null);
      // Selection is already stored in selectedItems
    }
    
    // End panning
    isDragging.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = drawingMode ? 'crosshair' : '';
    }
  }, [isDrawing, drawingPreview, drawingMode, onAddItem, selectionBox]);

  return (
    <div 
      ref={(node) => {
        canvasRef.current = node;
        drop(node);
      }}
      className={`warehouse-canvas ${isOver ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''} ${drawingMode ? 'drawing-mode' : ''}`}
      onClick={handleCanvasClick}
      tabIndex={0}
      onKeyDown={handleCanvasKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={(e) => {
        // Only handle zoom if Ctrl is pressed, otherwise allow scrolling
        if (e.ctrlKey || e.metaKey) {
          handleWheel(e);
        }
      }}
      style={{
        outline: 'none',
        cursor: drawingMode ? 'crosshair' : (isDragging.current ? 'grabbing' : 'default'),
        position: 'fixed',
        top: '60px',
        left: '320px',
        right: '320px',
        bottom: '40px',
        overflow: 'auto',
        backgroundColor: '#fafafa'
      }}
    >
      {/* Drop Zone Indicator */}
      {isOver && canDrop && (
        <div className="drop-zone-indicator">
          <div className="drop-zone-content">
            <div className="drop-zone-icon">🎯</div>
            <div className="drop-zone-text">Drop here to add component</div>
          </div>
        </div>
      )}
      {/* Scrollable content area */}
      <div className="scrollable-canvas-content drop-zone" style={{
        width: '5000px',
        height: '5000px',
        position: 'relative',
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.3) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.3) 1px, transparent 1px),
          linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px, 60px 60px, 15px 15px, 15px 15px',
        backgroundColor: '#fafafa'
      }}>
        
        {/* Render warehouse items */}
        <div style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }} className="drop-zone">
          {items.map((item, index) => {
            console.log(`Rendering item ${index}:`, {
              id: item.id,
              type: item.type,
              name: item.name,
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height,
              color: item.color
            });
            const isMultiSelected = selectedItemIds.includes(item.id);
            const isKeyboardFocused = keyboardFocusedId === item.id;
            
            // ✅ FIX 1: inner_boundary now has position/left/top — was rendering at (0,0) and blocking other items
            if (item.type === 'inner_boundary') {
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                    border: `2px solid #000000`,
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    pointerEvents: 'none',
                    zIndex: 2,
                    boxSizing: 'border-box',
                  }}
                >
                  {editingLabelId === item.id ? (
                    <input
                      autoFocus
                      value={editingLabelValue}
                      onChange={(e) => setEditingLabelValue(e.target.value)}
                      onBlur={() => {
                        onUpdateItem(item.id, { name: editingLabelValue });
                        setEditingLabelId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateItem(item.id, { name: editingLabelValue });
                          setEditingLabelId(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingLabelId(null);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 5,
                        left: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#000000',
                        background: 'white',
                        border: '1px solid #000',
                        borderRadius: 3,
                        padding: '1px 5px',
                        outline: 'none',
                        width: 100,
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setEditingLabelId(item.id);
                        setEditingLabelValue(item.name);
                      }}
                      style={{
                        position: 'absolute',
                        top: 5,
                        left: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#000000',
                        background: 'rgba(250,250,250,0.85)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        cursor: 'text',
                      }}
                    >
                      {item.name}
                    </span>
                  )}
                </div>
              );
            }
            // All other items render normally with selection highlight wrapper
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  outline: isMultiSelected
                    ? '2px solid #4A90E2'        // blue = selected
                    : isKeyboardFocused
                      ? '2px dashed #F39C12'     // orange = keyboard focused
                      : 'none',
                  outlineOffset: 3,
                  opacity: selectedItemIds.length > 0 && !isMultiSelected ? 0.75 : 1,
                  borderRadius: 3,
                  zIndex: isMultiSelected ? 10 : 'auto',
                  pointerEvents: 'auto',
                }}
              >
                <WarehouseItem
                  key={item.id}
                  item={{ ...item, x: 0, y: 0 }}
                  onSelect={onSelectItem}
                  isSelected={selectedItemId === item.id || selectedItems.includes(item.id)}
                  onUpdate={onUpdateItem}
                  onRightClick={onRightClick}
                  onInfoClick={onInfoClick}
                  stackMode={stackMode}
                  onRequestSkuId={onRequestSkuId}
                />
              </div>
            );
          })}
        </div>
        
        {/* Selection box */}
        {selectionBox && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
              border: '2px dashed #2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000
            }}
          />
        )}
        
        {/* Drawing preview */}
        {drawingPreview && (
          <div
            style={{
              position: 'absolute',
              left: drawingPreview.x,
              top: drawingPreview.y,
              width: drawingPreview.width,
              height: drawingPreview.height,
              backgroundColor: drawingMode?.type === 'draw_line' ? '#333333' : drawingPreview.color,
              border: drawingMode?.type === 'draw_line' ? 'none' : '2px dashed #2196F3',
              borderRadius: drawingMode?.type === 'draw_line' ? '0' : '4px',
              opacity: drawingMode?.type === 'draw_line' ? 0.8 : 0.7,
              pointerEvents: 'none',
              zIndex: 1000
            }}
          />
        )}
      </div>
      

      {/* Drawing mode indicator */}
      {drawingMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '6px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{drawingMode.icon}</span>
          <span>{drawingMode.name} Active</span>
          <button
            onClick={() => {
              setDrawingMode(null);
              setIsDrawing(false);
              setDrawingStart(null);
              setDrawingPreview(null);
              if (canvasRef.current) {
                canvasRef.current.style.cursor = '';
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            Exit (ESC)
          </button>
        </div>
      )}

      {/* Debug info */}
      {items.length > 0 && !drawingMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          Items: {items.length} | Zoom: {Math.round(zoomLevel * 100)}% | Pan: {Math.round(panOffset.x)}, {Math.round(panOffset.y)}
        </div>
      )}

      {/* Connection preview indicators */}
      {connectionPreview && connectionPreview.map((connection, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: connection.point1.x - 3,
            top: connection.point1.y - 3,
            width: '6px',
            height: '6px',
            backgroundColor: '#2196F3',
            borderRadius: '50%',
            border: '2px solid white',
            zIndex: 1000,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0'
          }}
        />
      ))}

    </div>
  );
};

export default WarehouseCanvas;