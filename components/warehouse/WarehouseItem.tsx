// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import { DRAG_TYPES, STACKABLE_COMPONENTS } from '@/lib/warehouse/constants/warehouseComponents';
import { getComponentColor } from '@/lib/warehouse/utils/componentColors';
import { renderShapeComponent } from '@/lib/warehouse/utils/shapeRenderer';
import { getContextualLabel } from '@/lib/warehouse/utils/componentLabeling';
import { inferVerticalRackLevelCount } from '@/lib/warehouse/utils/verticalRackUtils';
import { getStorageComponentBorder, STORAGE_COMPONENT_BORDER_CONFIG, determineCapacityStatus, determineCapacityStatusForMultiLocation, extractAllLocationIds } from '@/lib/warehouse/config/componentStatusColor';
import { useWarehouseTooltip } from './WarehouseTooltip';
import { useTooltip } from './TooltipProvider';
import { buildItemTooltipContent, buildCompartmentTooltipContent } from './TooltipContentBuilders';
import ResizeHandle from './ResizeHandle';

// Conditional tooltip hook that only works in read-only mode
const useConditionalTooltip = (isReadOnly: boolean) => {
  try {
    // Only try to use tooltip context if we're in read-only mode
    return isReadOnly ? useTooltip() : {
      showTooltip: () => { },
      hideTooltip: () => { },
      updateTooltipPosition: () => { },
      isVisible: false
    };
  } catch (error) {
    // Fallback for when TooltipProvider is not available (edit mode)
    return {
      showTooltip: () => { },
      hideTooltip: () => { },
      updateTooltipPosition: () => { },
      isVisible: false
    };
  }
};

const getContrastColorForHex = (hexColor: any) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#FFFFFF';
  }

  let hex = hexColor.replace('#', '').trim();

  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) {
    return '#FFFFFF';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '#000000' : '#FFFFFF';
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

const adjustHexColor = (hexColor: string, amount: number = 0) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#475569';
  }

  let hex = hexColor.replace('#', '').trim();

  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) {
    return '#475569';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const adjustChannelValue = (channel: number) => {
    if (amount >= 0) {
      return clampChannel(Math.round(channel + (255 - channel) * amount));
    }
    return clampChannel(Math.round(channel * (1 + amount)));
  };

  const nextR = adjustChannelValue(r);
  const nextG = adjustChannelValue(g);
  const nextB = adjustChannelValue(b);

  return `#${nextR.toString(16).padStart(2, '0')}${nextG.toString(16).padStart(2, '0')}${nextB.toString(16).padStart(2, '0')}`;
};

const toTitleCase = (value: any) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value
    .split(/\s|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};


const WarehouseItem = ({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  zoomLevel,
  snapToGrid,
  gridSize,
  onRequestSkuId,
  onRightClick,
  onInfoClick,
  stackMode,
  isReadOnly,
  isHighlighted = false,
  highlightedCompartments,
  locationTagsMap = {},
  hideNonMatchingCompartments = false
}: any) => {
  const hasCompartments = Boolean(item.skuGrid && item.showCompartments);
  const [hoveredCompartment, setHoveredCompartment] = useState<string | null>(null);

  // Tooltip functionality for live view and fullscreen preview
  const { showTooltip, hideTooltip, updateTooltipPosition } = useConditionalTooltip(isReadOnly);

  // Item tooltip handlers
  const handleItemMouseEnter = useCallback((event: React.MouseEvent) => {
    // Only show tooltips in read-only mode (live view, fullscreen preview)
    if (!isReadOnly || item.type === 'square_boundary') {
      return;
    }

    const unitLocationId = item?.locationId || item?.locationData?.primaryLocationId || item?.inventoryData?.locationId || item?.inventoryData?.uniqueId;
    const unitLocationTag = unitLocationId ? locationTagsMap[unitLocationId] : null;

    const content = buildItemTooltipContent({
      item,
      inventoryData: item.inventoryData,
      capacity: item.capacity,
      dbUnitOfMeasurement: unitLocationTag?.unitOfMeasurement
    });

    showTooltip(
      `item-${item.id}`,
      content,
      event,
      'item',
      1 // priority
    );
  }, [isReadOnly, item, showTooltip]);

  const handleItemMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isReadOnly) return;
    updateTooltipPosition(event);
  }, [isReadOnly, updateTooltipPosition]);

  const handleItemMouseLeave = useCallback(() => {
    if (!isReadOnly) return;
    hideTooltip(`item-${item.id}`);
  }, [isReadOnly, item.id, hideTooltip]);

  // Compartment tooltip handlers
  const handleCompartmentMouseEnter = useCallback((event: React.MouseEvent, compartmentData: any, rowIndex: number, colIndex: number) => {
    // Set hovered compartment for visual feedback
    setHoveredCompartment(`${rowIndex}-${colIndex}`);

    // Only show tooltips in read-only mode
    if (!isReadOnly) return;

    const content = buildCompartmentTooltipContent({
      item,
      compartmentData,
      rowIndex,
      colIndex
    });

    showTooltip(
      `compartment-${item.id}-${rowIndex}-${colIndex}`,
      content,
      event,
      'compartment',
      2 // higher priority for compartments
    );
  }, [isReadOnly, item, showTooltip, setHoveredCompartment]);

  const handleCompartmentMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isReadOnly) return;
    updateTooltipPosition(event);
  }, [isReadOnly, updateTooltipPosition]);

  const handleCompartmentMouseLeave = useCallback((rowIndex: number, colIndex: number) => {
    // Clear hovered compartment
    setHoveredCompartment(null);

    if (!isReadOnly) return;
    hideTooltip(`compartment-${item.id}-${rowIndex}-${colIndex}`);
  }, [isReadOnly, item.id, hideTooltip, setHoveredCompartment]);

  const renderCompartmentGrid = useCallback(() => {
    if (!hasCompartments) {
      return null;
    }

    const gridSize = 60;
    const cols = Math.max(1, Math.floor(item.width / gridSize));
    const rows = Math.max(1, Math.floor(item.height / gridSize));
    const totalCompartments = rows * cols;
    const gap = 3;
    const cellWidth = cols > 0 ? (item.width - gap * (cols - 1)) / cols : item.width;
    const cellHeight = rows > 0 ? (item.height - gap * (rows - 1)) / rows : item.height;
    const normalizedType = (item.type || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/_+/g, '_');
    const isVertical = normalizedType === 'vertical_sku_holder';
    const isOfficeSpace = normalizedType === 'office_space_area';
    const isStorageRack = Boolean(item?.skuGrid) || normalizedType === 'sku_holder' || normalizedType === 'vertical_sku_holder';
    const filledFill = isStorageRack ? 'transparent' : (isVertical ? '#FFC107' : (isOfficeSpace ? 'transparent' : '#E0F7FA'));
    const emptyFill = isStorageRack ? 'transparent' : (isVertical ? '#FFF3E0' : (isOfficeSpace ? 'transparent' : '#E3F2FD'));
    const highlightFill = '#FFF9C4';
    const hoverFillOccupied = isStorageRack ? 'transparent' : (isVertical ? '#FFCC80' : (isOfficeSpace ? 'rgba(96, 125, 139, 0.1)' : '#B2EBF2'));
    const hoverFillEmpty = isStorageRack ? 'transparent' : (isVertical ? '#FFE0CC' : (isOfficeSpace ? 'rgba(96, 125, 139, 0.05)' : '#BBDEFB'));
    const textColor = isStorageRack ? '#111827' : (isVertical ? '#E65100' : (isOfficeSpace ? '#607D8B' : '#006064'));

    const resolveLabel = (compartmentData: any) => {
      if (!compartmentData) {
        return '+';
      }

      const { locationIds, isMultiLocation, locationId, uniqueId, sku } = compartmentData;
      if (isMultiLocation && Array.isArray(locationIds) && locationIds.length > 0) {
        const primaryId = locationIds[0];
        const count = locationIds.length;
        return count > 1 ? `${primaryId}+${count - 1}` : primaryId;
      }

      const fallback = locationId || uniqueId || sku;
      if (!fallback) {
        return 'N/A';
      }

      return fallback.length > 8 ? `${fallback.substring(0, 8)}...` : fallback;
    };

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${item.width} ${item.height}`}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
      >
        {Array.from({ length: totalCompartments }).map((_: any, index: number) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const compartmentId = `${row}-${col}`;
          if (hideNonMatchingCompartments && Array.isArray(highlightedCompartments) && highlightedCompartments.length > 0) {
            if (!highlightedCompartments.includes(compartmentId)) {
              const x = col * (cellWidth + gap);
              const y = row * (cellHeight + gap);
              // Render invisible placeholder to preserve rack shape/spacing
              return (
                <rect
                  key={compartmentId}
                  x={x}
                  y={y}
                  width={cellWidth}
                  height={cellHeight}
                  fill="transparent"
                  stroke="transparent"
                />
              );
            }
          }
          const compartmentData = item.compartmentContents && item.compartmentContents[compartmentId];
          const isCompartmentHighlighted = Array.isArray(highlightedCompartments)
            ? highlightedCompartments.includes(compartmentId)
            : false;
          const isHovered = hoveredCompartment === compartmentId;

          const baseFill = compartmentData ? filledFill : emptyFill;
          const fill = isCompartmentHighlighted
            ? highlightFill
            : isHovered
              ? (compartmentData ? hoverFillOccupied : hoverFillEmpty)
              : baseFill;

          const x = col * (cellWidth + gap);
          const y = row * (cellHeight + gap);

          // Use status-based border colors for storage racks
          // Enhanced: Determine capacity status based on ALL location tags using new multi-location logic
          const allLocationIds = extractAllLocationIds(item, compartmentData);
          const capacityStatus = allLocationIds.length > 1 
            ? determineCapacityStatusForMultiLocation(allLocationIds, locationTagsMap)
            : (() => {
                // Fallback to single location logic for backward compatibility
                const hasLocationTags = Boolean(compartmentData?.locationId || compartmentData?.uniqueId || compartmentData?.primaryLocationId || (compartmentData?.locationIds && compartmentData.locationIds.length > 0));
                const compartmentLocationId = compartmentData?.locationId || compartmentData?.primaryLocationId;
                const compartmentLocationTag = compartmentLocationId ? locationTagsMap[compartmentLocationId] : null;
                const hasSkusAssigned = Boolean(compartmentLocationTag && compartmentLocationTag.currentItems > 0);
                return determineCapacityStatus(hasLocationTags, hasSkusAssigned);
              })();

          const borderStyle = isReadOnly
            ? getStorageComponentBorder(allLocationIds.length > 0, capacityStatus)
            : '1px solid #000000';

          // Extract color and width from border string (e.g., "4px solid #000000")
          const borderMatch = borderStyle.match(/(\d+)px\s+solid\s+(#[0-9A-Fa-f]{6})/);
          const borderWidth = borderMatch ? parseInt(borderMatch[1]) : 4;  // Use 4px default to match our function
          const borderColor = borderMatch ? borderMatch[2] : '#000000';

          const label = resolveLabel(compartmentData);
          const fontSize = Math.min(Math.max(cellWidth / 5.5, 7), 12);

          return (
            <g
              key={compartmentId}
              onMouseEnter={(event: React.MouseEvent) => {
                handleCompartmentMouseEnter(event, compartmentData, row, col);
              }}
              onMouseMove={handleCompartmentMouseMove}
              onMouseLeave={() => {
                handleCompartmentMouseLeave(row, col);
              }}
              onClick={(event: any) => {
                event.stopPropagation();

                // Always select the parent rack when clicking on compartments
                if (onSelect) {
                  onSelect(item.id);
                }

                // In readonly mode, trigger item selection for location details (even for empty compartments)
                if (isReadOnly && onSelect) {
                                    // Pass the compartment-specific data by calling onSelect with a special format
                  // We'll pass the compartmentId so the parent can identify which compartment was clicked
                  // For empty compartments, compartmentData will be null/undefined
                  onSelect(item.id, { compartmentId, compartmentData, row, col });
                  return;
                }

                if (onUpdate && !compartmentData && onRequestSkuId) {
                  onRequestSkuId(item.id, compartmentId, row, col);
                }
              }}
              onContextMenu={(event: any) => {
                event.preventDefault();
                event.stopPropagation();
                if (compartmentData && onUpdate) {
                  if (window.confirm(`Delete item at location "${compartmentData.locationId || compartmentData.uniqueId}" from compartment ${row + 1}-${col + 1}?`)) {
                    const newContents = { ...item.compartmentContents };
                    delete newContents[compartmentId];
                    onUpdate(item.id, { compartmentContents: newContents });
                  }
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={cellWidth}
                height={cellHeight}
                fill={fill}
                stroke={borderColor}
                strokeWidth={borderWidth}
                rx={1.5}
              />
              {/* Show office-space image for Office Space Area components */}
              {isOfficeSpace && (
                <image
                  x={x + cellWidth * 0.1}
                  y={y + cellHeight * 0.1}
                  width={cellWidth * 0.8}
                  height={cellHeight * 0.8}
                  href="/assets/images/icons/office-space.png"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Show text label for non-office-space components or when compartment has data */}
              {(!isOfficeSpace || compartmentData) && (
                <text
                  x={x + cellWidth / 2}
                  y={y + cellHeight / 2 + fontSize * 0.35}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight={compartmentData ? 600 : 500}
                  fill={isStorageRack ? textColor : (isCompartmentHighlighted ? '#1B5E20' : textColor)}
                  style={{ pointerEvents: 'none' }}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }, [hasCompartments, item, highlightedCompartments, hoveredCompartment, handleCompartmentMouseEnter, handleCompartmentMouseMove, handleCompartmentMouseLeave, onUpdate, onRequestSkuId]);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPES.WAREHOUSE_ITEM,
    item: {
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      isPositionLocked: item.isPositionLocked,
      isSizeLocked: item.isSizeLocked
    },
    canDrag: () => !isReadOnly && !item.isPositionLocked, // Prevent dragging when position is locked or in read-only mode
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const setRefs = useCallback((node: any) => {
    if (!node) {
      return;
    }
    drag(node);
  }, [drag]);

  const componentClasses = [
    'warehouse-item',
    item.type,
    item.containerLevel ? 'unit' : null,
    isSelected ? 'selected' : null,
    item.isHollow ? 'hollow' : null,
    isReadOnly ? 'read-only' : null
  ].filter(Boolean).join(' ');

  const handleClick = (e: any) => {
    e.stopPropagation();

    if (isReadOnly) {
      if (onSelect) {
        onSelect(item.id);
      }
      return;
    }

    // Handle Storage Unit / Spare Unit / Open Storage Space Location assignment
    const isSingleSkuUnit = (item.type === 'storage_unit' || item.type === 'spare_unit') && item.hasSku && item.singleSku;
    const isOpenStorageUnit = item.type === 'open_storage_space';

    if ((isSingleSkuUnit || isOpenStorageUnit) && onRequestSkuId && !item.locationId) {
      let selectorId;
      if (item.type === 'spare_unit') {
        selectorId = 'spare-unit';
      } else if (item.type === 'open_storage_space') {
        selectorId = 'open-storage';
      } else {
        selectorId = 'single-sku';
      }
      onRequestSkuId(item.id, selectorId, 0, 0);
      return;
    }

    onSelect(item.id);
  };

  const handleDoubleClick = (e: any) => {
    // Disable double-click functionality completely
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRightClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRightClick) {
      onRightClick(e, item);
    }
  };

  const handleInfoClick = (e: any) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick(e, item);
    }
  };

  const isStackable = STACKABLE_COMPONENTS.includes(item.type);
  const hasStack = item.stack && item.stack.layers && item.stack.layers.length > 1;
  const isContainer = item.isContainer;

  // Resize handling functions
  const handleResizeStart = (e: any, direction: any) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width;
    const startHeight = item.height;
    // Use major grid (60px) for square boundary, sub-grid (15px) for others
    const gridSize = (item.type === 'square_boundary' || item.gridAligned) ? 60 : 15;

    const handleMouseMove = (moveEvent: any) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction === 'corner' || direction === 'right') {
        newWidth = Math.max(gridSize, Math.round((startWidth + deltaX) / gridSize) * gridSize);
      }

      if (direction === 'corner' || direction === 'bottom') {
        newHeight = Math.max(gridSize, Math.round((startHeight + deltaY) / gridSize) * gridSize);
      }

      // Apply min/max constraints if specified
      if (item.minSize) {
        newWidth = Math.max(item.minSize.width || gridSize, newWidth);
        newHeight = Math.max(item.minSize.height || gridSize, newHeight);
      }

      if (item.maxSize) {
        newWidth = Math.min(item.maxSize.width || 1200, newWidth);
        newHeight = Math.min(item.maxSize.height || 1200, newHeight);
      }

      // Update the item dimensions
      if (onUpdate && (newWidth !== item.width || newHeight !== item.height)) {
        onUpdate(item.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const normalizedType = (item?.type || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_');
  const isHorizontalRack = normalizedType === 'sku_holder';
  const isVerticalRack = normalizedType === 'vertical_sku_holder';
  const isStorageRack = isHorizontalRack || isVerticalRack;
  const isStorageUnitType = normalizedType === 'storage_unit';
  const isOpenStorageSpaceType = isStorageUnitType && item?.name === 'Open Storage Space';
  const isStorageZoneType = normalizedType === 'storage_zone';
  const isContainerUnitType = normalizedType === 'container_unit';
  const isSingleSkuStorageComponent = Boolean(isStorageUnitType && item?.hasSku && item?.singleSku);
  const isStorageComponentType = isStorageUnitType || isSingleSkuStorageComponent || isOpenStorageSpaceType || isStorageZoneType || isContainerUnitType;

// Enhanced storage component detection for all storage-related types that should have status borders
const shouldHaveStorageStatusBorder = isStorageUnitType || isSingleSkuStorageComponent || isOpenStorageSpaceType || isStorageZoneType || isContainerUnitType;

  const isContained = item.containerId;
  const containerLevel = item.containerLevel || 0;
  const isMainBoundary = containerLevel === 1;
  const isZone = containerLevel === 2;
  const isUnit = containerLevel === 3;
  const isSpareUnit = normalizedType === 'spare_unit';
  const spareUnitColor = isSpareUnit
    ? (item.customColor || item.color || getComponentColor(normalizedType, item.category) || '#8D6E63')
    : null;
  const spareUnitTextColor = isSpareUnit ? getContrastColorForHex(spareUnitColor) : null;
  const storageUnitColor = isStorageUnitType
    ? 'transparent'  // Transparent - Fresh start with no color
    : null;
  const storageUnitTextColor = storageUnitColor ? '#000000' : '#FFFFFF'; // Black text for transparent background
  const hasHighlightedCompartments = Array.isArray(highlightedCompartments) && highlightedCompartments.length > 0;

  const canvasIconSize = 48;

  const isIconOnly = [
    'fire_exit_marking',
    'security_area',
    'restrooms_area',
    'seating_area',
    'dispatch_gates',
    'inbound_gates',
    'pathways_arrows',
    'conference_room',
    'meeting_rooms',
    'pantry_area',
    'open_stage',
    'booths',
    'general_area'
  ].includes(normalizedType);

  const resolvedLocationId = (item?.locationId
    || item?.locationData?.primaryLocationId
    || item?.inventoryData?.locationId
    || item?.inventoryData?.uniqueId
    || item?.locationCode
    || item?.sku
    || '')
    .toString()
    .trim();

  const hasResolvedLocation = Boolean(resolvedLocationId);

  // Check if multiple location IDs are attached
  const multipleLocationIds = item?.locationData?.isMultiLocation && item?.locationData?.locationIds;
  const locationIdCount = multipleLocationIds ? item.locationData.locationIds.length : 0;
  const displayLocationId = locationIdCount > 1
    ? `${resolvedLocationId} +${locationIdCount - 1}`
    : resolvedLocationId;

  
  // Calculate capacity status for storage units using enhanced multi-location logic
  const allUnitLocationIds = extractAllLocationIds(item);
    
  const storageUnitCapacityStatus = allUnitLocationIds.length > 1
    ? (() => {
                return determineCapacityStatusForMultiLocation(allUnitLocationIds, locationTagsMap);
      })()
    : (() => {
                // Fallback to single location logic for backward compatibility
        const hasLocationTagsForUnit = Boolean(
          item?.locationId ||
          item?.locationData?.primaryLocationId ||
          item?.inventoryData?.locationId ||
          item?.inventoryData?.uniqueId ||
          (item?.locationData?.locationIds && item.locationData.locationIds.length > 0)
        );
        const unitLocationId = item?.locationId || item?.locationData?.primaryLocationId || item?.inventoryData?.locationId || item?.inventoryData?.uniqueId;
        const unitLocationTag = unitLocationId ? locationTagsMap[unitLocationId] : null;
        const hasSkusAssignedForUnit = Boolean(unitLocationTag && unitLocationTag.currentItems > 0);
                return determineCapacityStatus(hasLocationTagsForUnit, hasSkusAssignedForUnit);
      })();
      
  
  // Simple fallback color
  const statusColor = '#ddd';

  return (
    <div
      ref={setRefs}
      className={componentClasses}
      data-type={normalizedType}
      data-position-locked={item.isPositionLocked || false}
      data-size-locked={item.isSizeLocked || false}
      data-color={isSpareUnit ? spareUnitColor : (isStorageUnitType ? storageUnitColor : item.color || '')}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        backgroundColor: isIconOnly ? 'transparent' : (item.isHollow ? 'transparent' :
          (isStorageComponentType ? 'transparent' :
            isStorageRack ? 'transparent' :
              isSpareUnit ? spareUnitColor :
                isContainer ? 'transparent' :
                  getComponentColor(normalizedType, item.category))),
        backgroundImage: isIconOnly ? 'none' : (item.isHollow ? 'none' :
          (isStorageComponentType ? 'none' :
            isStorageRack ? 'none' :
              isSpareUnit ? 'none' :
                isContainer ? 'none' :
                  'none')),
        border: isIconOnly ? 'none' : ((shouldHaveStorageStatusBorder && !isStorageRack) ? 
          (isReadOnly ? getStorageComponentBorder(allUnitLocationIds.length > 0, storageUnitCapacityStatus) : '1px solid #000000') :
          isSpareUnit ? 'none' :
          isStorageRack ? 'none' :
            (normalizedType === 'square_boundary' ? '4px solid #000000' :
              (isMainBoundary ? '4px solid #263238' :
                (isZone ? `3px solid ${getComponentColor(normalizedType)}` :
                  (isContainer ? `3px solid ${getComponentColor(normalizedType)}` :
                    (isContained ? `2px dashed ${getComponentColor(normalizedType) || statusColor}` : `3px solid ${getComponentColor(normalizedType) || statusColor}`)))))),
        borderRadius: '0px',
        boxShadow: isHighlighted && !hasHighlightedCompartments ? '0 0 12px 3px rgba(79, 70, 229, 0.6)' : 'none',
        opacity: isDragging ? 0.7 : 1,
        position: 'absolute',
        zIndex: isHighlighted && !hasHighlightedCompartments ? 20 : (isMainBoundary ? 0 : (isZone ? 1 : (isContainer ? 1 : (isContained ? 10 : 5))))
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={handleItemMouseEnter}
      onMouseMove={handleItemMouseMove}
      onMouseLeave={handleItemMouseLeave}
    >
      {/* Shape rendering for shape components */}
      {item.isShape && renderShapeComponent(item)}

      {isSingleSkuStorageComponent && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: item.width || 60,
            height: item.height || 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isReadOnly
              ? getStorageComponentBorder(allUnitLocationIds.length > 0, storageUnitCapacityStatus)
              : '1px solid #000000',
            borderRadius: STORAGE_COMPONENT_BORDER_CONFIG.borderRadius,
            backgroundColor: 'transparent',
            color: '#111827',
            fontWeight: hasResolvedLocation ? 600 : 500,
            fontSize: 11,
            letterSpacing: '0.2px',
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            zIndex: 5
          }}
        >
          {hasResolvedLocation ? displayLocationId : '+'}
        </div>
      )}

      {/* Storage Racks and Spare Units - Show Location ID in black text */}
      {((item.type === 'sku_holder' || item.type === 'vertical_sku_holder' || item.type === 'spare_unit') && !item.showCompartments) && (() => {
        if (item.type === 'spare_unit') {
          // For Spare Units, show the locationId if it exists
          return null;
        }

        // For storage racks
        const totalLevels = inferVerticalRackLevelCount(item);
        let displayText = null;

        if (totalLevels > 0) {
          displayText = `${totalLevels} Level${totalLevels > 1 ? 's' : ''}`;
        } else if (item.type === 'sku_holder') {
          displayText = item.locationId || null;
        }

        return displayText ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '95%'
          }}>
            {/* Location ID - Only show when user selects from dropdown - Black text */}
            <div style={{
              color: '#000000',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {displayText}
            </div>
          </div>
        ) : null;
      })()}

      {/* Storage Unit - Display name inside */}
      {item.type === 'storage_unit' && (() => {
        const trimmedName = item.name ? item.name.trim() : '';
        const primaryText = trimmedName || (item.name === 'Open Storage Space' ? 'Open Storage Space' :
          item.name === 'Dispatch Staging Area' ? 'Dispatch Staging Area' :
            item.name === 'Grading Area' ? 'Grading Area' :
              item.name === 'Processing Area' ? 'Processing Area' :
                item.name === 'Production Area' ? 'Production Area' :
                  item.name === 'Packaging Area' ? 'Packaging Area' :
                    item.name === 'Cold Storage' ? 'Cold Storage' : 'Storage Unit');
        const minDimension = Math.min(item.width || 60, item.height || 60);
        const primaryFontSize = Math.max(9, Math.min(14, Math.floor(minDimension / 6)));

        // Storage components show the centered square (LOC or '+'), so avoid overlapping text.
        if (isSingleSkuStorageComponent) {
          return null;
        }

        return (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'Arial, sans-serif',
              maxWidth: '88%'
            }}
          >
            <div
              style={{
                color: storageUnitTextColor,
                fontSize: `${primaryFontSize}px`,
                fontWeight: 600,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {primaryText}
            </div>
          </div>
        );
      })()}

      {/* Spare Unit - Display custom name inside the square (if different from default) */}
      {item.type === 'spare_unit' && (() => {
        // Only show name inside if it's a custom name (not the default "Spare Unit")
        const hasCustomName = item.name && item.name.trim() && item.name.trim() !== 'Spare Unit';
        if (!hasCustomName) {
          return null; // Don't show anything inside if no custom name
        }

        return (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            fontFamily: 'Arial, sans-serif',
            color: spareUnitTextColor || '#FFFFFF',
            fontWeight: '600',
            fontSize: '12px',
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
            maxWidth: '90%'
          }}>
            {item.name.trim()}
          </div>
        );
      })()}

      {(['pathways_arrows', 'conference_room', 'meeting_rooms', 'pantry_area', 'open_stage', 'booths', 'general_area'].includes(item.type) && item.icon) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
          }}
          title={item.name}
        >
          <img
            src={encodeURI(item.icon)}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Fire Exit Marking - Custom Image Display */}
      {item.type === 'fire_exit_marking' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
          }}
          title="Fire Exit - Emergency Evacuation Route"
        >
          {/* Fire Exit Image */}
          <img
            src={encodeURI(item.icon || "/assets/images/icons/Fire Exit marking.png")}
            alt="Fire Exit"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Security Area - Custom Image Display */}
      {item.type === 'security_area' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
            // No backgroundColor - let image show through
          }}
          title="Security Area - Access Control and Monitoring"
        >
          {/* Security Area Image */}
          <img
            src={encodeURI(item.icon || "/assets/images/icons/security.png")}
            alt="Security Area"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Restrooms Area - Custom Image Display */}
      {item.type === 'restrooms_area' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
            // No backgroundColor - let image show through
          }}
          title="Restrooms Area - Warehouse Personnel Facilities"
        >
          {/* Restrooms Area Image */}
          <img
            src={encodeURI(item.icon || "/assets/images/icons/rest room area.png")}
            alt="Restrooms"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Seating Area - Custom Image Display */}
      {item.type === 'seating_area' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
            // No backgroundColor - let image show through
          }}
          title="Seating Area - Informal Gatherings Space"
        >
          {/* Seating Area Image */}
          <img
            src={encodeURI(item.icon || "/assets/images/icons/Seating Area.png")}
            alt="Seating"
            style={{
              width: `${canvasIconSize}px`,
              height: `${canvasIconSize}px`,
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            onError={(e: any) => {
              if (e?.target?.dataset?.fallbackApplied === 'true') return;
              if (e?.target?.dataset) {
                e.target.dataset.fallbackApplied = 'true';
              }
                            // Show fallback text
              e.target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.innerHTML = `
                  <div style="
                    background-color: rgba(156, 39, 176, 0.9);
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    padding: 10px;
                    font-size: 12px;
                    border-radius: 4px;
                    width: 90%;
                  ">
                    SEATING
                  </div>
                `;
              e.target.parentNode.appendChild(fallback);
            }}
          />
        </div>
      )}

      {/* Dispatch Gates - Custom Image Display */}
      {item.type === 'dispatch_gates' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
            // No backgroundColor - completely transparent
          }}
          title="Dispatch Gates - Loading and Shipping Operations"
        >
          {/* Dispatch Gates Image */}
          <img
            src={encodeURI(item.icon || "/assets/images/icons/dispatch-gate.png")}
            alt="Dispatch Gates"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
              // No backgroundColor - transparent background
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Inbound Gates - Custom Image Display */}
      {item.type === 'inbound_gates' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '4px'
            // No backgroundColor - completely transparent
          }}
          title="Inbound Gates - Receiving and Unloading Operations"
        >
          {/* Inbound Gates Image */}
          <img
            src={encodeURI(item.icon || "/assets/images/icons/inbound-gate.png")}
            alt="Inbound Gates"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              boxSizing: 'border-box'
              // No backgroundColor - transparent background
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* SKU compartment grid rendering for SKU Holder components */}
      {renderCompartmentGrid()}

      {/* Resize handles for horizontal and vertical racks */}
      <ResizeHandle
        item={item}
        onResize={(updates: any) => {
          if (onUpdate) {
            onUpdate(item.id, updates);
          }
        }}
        gridSize={gridSize}
        snapToGrid={snapToGrid}
        color={'transparent'}
        isReadOnly={isReadOnly}
      />

      {/* Component Type Label - Shown below the component */}
      {(item.type === 'sku_holder' || item.type === 'vertical_sku_holder' || item.type === 'storage_unit' || item.type === 'spare_unit' || item.type === 'open_storage_space' ||
        item.type === 'fire_exit_marking' || item.type === 'security_area' || item.type === 'restrooms_area' || item.type === 'pathways_arrows' ||
        item.type === 'conference_room' || item.type === 'meeting_rooms' || item.type === 'pantry_area' || item.type === 'open_stage' ||
        item.type === 'seating_area' || item.type === 'booths' || item.type === 'general_area' ||
        item.type === 'dispatch_gates' || item.type === 'inbound_gates') && (() => {
          // Determine the label text - use item.label if available, otherwise use default component type
          let labelText = '';

          if (item.label && item.label.trim()) {
            labelText = item.label.trim();
          } else {
            // Auto-generate label based on component type
            if (item.type === 'sku_holder') {
              labelText = 'Horizontal Storage Rack';
            } else if (item.type === 'vertical_sku_holder') {
              labelText = 'Vertical Storage Rack';
            } else if (item.type === 'storage_unit') {
              labelText = item.name === 'Open Storage Space' ? 'Open Storage Space' :
                item.name === 'Dispatch Staging Area' ? 'Dispatch Staging Area' :
                  item.name === 'Grading Area' ? 'Grading Area' :
                    item.name === 'Processing Area' ? 'Processing Area' :
                      item.name === 'Production Area' ? 'Production Area' :
                        item.name === 'Packaging Area' ? 'Packaging Area' :
                          item.name === 'Cold Storage' ? 'Cold Storage' : 'Storage Unit';
            } else if (item.type === 'spare_unit') {
              labelText = 'Spare Unit';
            } else if (item.type === 'open_storage_space') {
              labelText = 'Open Storage';
            } else if (item.type === 'fire_exit_marking') {
              labelText = 'Fire Exit Marking';
            } else if (item.type === 'security_area') {
              labelText = 'Security Area';
            } else if (item.type === 'restrooms_area') {
              labelText = 'Restrooms Area';
            } else if (item.type === 'pathways_arrows') {
              labelText = 'Pathways Arrows';
            } else if (item.type === 'conference_room') {
              labelText = 'Conference Room';
            } else if (item.type === 'meeting_rooms') {
              labelText = 'Meeting Rooms';
            } else if (item.type === 'pantry_area') {
              labelText = 'Pantry Area';
            } else if (item.type === 'open_stage') {
              labelText = 'Open Stage';
            } else if (item.type === 'seating_area') {
              labelText = 'Seating Area';
            } else if (item.type === 'booths') {
              labelText = 'Booths';
            } else if (item.type === 'inner_boundary') {
              labelText = item.label;
            } else if (item.type === 'dispatch_gates') {
              labelText = 'Dispatch Gates';
            } else if (item.type === 'inbound_gates') {
              labelText = 'Inbound Gates';
            } else {
              labelText = 'Storage Component';
            }
          }

          return (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '6px',
                backgroundColor: 'transparent',
                color: '#000000',
                padding: '0px',
                borderRadius: '0px',
                fontSize: '12px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 10000,
                textShadow: 'none'
              }}
            >
              {labelText}
            </div>
          );
        })()}
    </div>
  );
};

WarehouseItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  zoomLevel: PropTypes.number,
  snapToGrid: PropTypes.bool,
  gridSize: PropTypes.number,
  onRequestSkuId: PropTypes.func,
  onRightClick: PropTypes.func,
  onInfoClick: PropTypes.func,
  stackMode: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  isHighlighted: PropTypes.bool,
  highlightedCompartments: PropTypes.arrayOf(PropTypes.string),
  hideNonMatchingCompartments: PropTypes.bool
};

// Default props
WarehouseItem.defaultProps = {
  isSelected: false,
  onUpdate: null,
  onDelete: null,
  snapToGrid: false,
  gridSize: 15,
  onRequestSkuId: null,
  onRightClick: null,
  onInfoClick: null,
  stackMode: false,
  isReadOnly: false,
  isHighlighted: false,
  highlightedCompartments: null,
  hideNonMatchingCompartments: false
};

export default WarehouseItem;

