import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import { DRAG_TYPES, STACKABLE_COMPONENTS, STATUS_COLORS, OCCUPANCY_STATUS, ORIENTATION_COLORS } from '../../lib/warehouse/constants/warehouseComponents';
import { getComponentColor } from '../../lib/warehouse/utils/componentColors';
import { renderShapeComponent } from '../../lib/warehouse/utils/shapeRenderer';
import { getContextualLabel, generateStorageUnitLabelInfo } from '../../lib/warehouse/utils/componentLabeling';
import { inferVerticalRackLevelCount } from '../../lib/warehouse/utils/verticalRackUtils';
import HoverInfoTooltip from './HoverInfoTooltip';
import ResizeHandle from './ResizeHandle';

const getContrastColorForHex = (hexColor) => {
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

const clampChannel = (value) => Math.max(0, Math.min(255, value));

const adjustHexColor = (hexColor, amount = 0) => {
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

  const adjustChannelValue = (channel) => {
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

const toTitleCase = (value) => {
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
  highlightedCompartments
}) => {
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [hoveredCompartment, setHoveredCompartment] = useState(null);

  const hasCompartments = Boolean(item.skuGrid && item.showCompartments);

  const getTooltipPosition = useCallback((eventLike) => {
    if (!eventLike) {
      return { top: 0, left: 0 };
    }

    const nativeEvent = eventLike.nativeEvent || eventLike;
    const pageX = typeof nativeEvent.pageX === 'number'
      ? nativeEvent.pageX
      : (nativeEvent.clientX || 0) + (window.scrollX || 0);
    const pageY = typeof nativeEvent.pageY === 'number'
      ? nativeEvent.pageY
      : (nativeEvent.clientY || 0) + (window.scrollY || 0);

    const offsetX = 18;
    const offsetY = 28;
    const assumedWidth = 320;
    const assumedHeight = 220;

    let left = pageX + offsetX;
    let top = pageY + offsetY;

    const viewportRight = (window.scrollX || 0) + window.innerWidth;
    const viewportBottom = (window.scrollY || 0) + window.innerHeight;

    if (left + assumedWidth > viewportRight - 8) {
      left = pageX - assumedWidth - offsetX;
    }

    if (top + assumedHeight > viewportBottom - 8) {
      top = pageY - assumedHeight - offsetY;
    }

    left = Math.max((window.scrollX || 0) + 8, left);
    top = Math.max((window.scrollY || 0) + 8, top);

    return { top, left };
  }, []);

  const showTooltip = useCallback((eventLike, content, variant = 'occupied', context = 'item') => {
    if (!eventLike || !content) {
      return;
    }

    const position = getTooltipPosition(eventLike);
    setHoverTooltip({
      ...position,
      content,
      variant,
      context
    });
  }, [getTooltipPosition]);

  const hideTooltip = useCallback(() => {
    setHoverTooltip(null);
  }, []);

  const renderDetailRow = useCallback((label, value, key) => (
    <div className="hover-card__metric" key={key || label}>
      <span className="hover-card__metric-label">{label}</span>
      <span className="hover-card__metric-value">{value ?? '—'}</span>
    </div>
  ), []);

  const buildCompartmentTooltipContent = useCallback((rowIndex, colIndex, compartmentData) => {
    const baseMeta = {
      row: rowIndex + 1,
      column: colIndex + 1
    };

    const isHorizontalStorage = item.type === 'sku_holder';
    const compartmentTitle = isHorizontalStorage ? 'Horizontal Space' : 'Storage Space';
    const hasAssignment = Boolean(compartmentData);

    const {
      locationId,
      uniqueId,
      isMultiLocation,
      locationIds,
      tags,
      levelLocationMappings,
      maxCapacity: compartmentDefinedCapacity
    } = compartmentData || {};

    const resolvedLocationIds = Array.isArray(locationIds) ? locationIds.filter(Boolean) : [];
    const resolvedMappings = Array.isArray(levelLocationMappings)
      ? levelLocationMappings.filter((mapping) => mapping && mapping.locationId)
      : [];
    const primaryLocation = hasAssignment
      ? locationId || uniqueId || resolvedLocationIds[0] || 'N/A'
      : 'Unassigned';

    const resolvedPairs = (() => {
      if (!hasAssignment) {
        return [];
      }

      if (resolvedMappings.length > 0) {
        return resolvedMappings.map((mapping, idx) => {
          const levelLabel = mapping.levelId || tags?.[idx] || `L${idx + 1}`;
          return `${levelLabel}: ${mapping.locationId}`;
        });
      }

      if (isMultiLocation && resolvedLocationIds.length > 0) {
        return resolvedLocationIds.map((id, idx) => {
          const levelLabel = tags?.[idx];
          return levelLabel ? `${levelLabel}: ${id}` : id;
        });
      }

      return [];
    })();

    const locationLabel = (() => {
      if (!hasAssignment) {
        return primaryLocation;
      }

      if (item.type === 'vertical_sku_holder' && resolvedPairs.length > 0) {
        return resolvedPairs.join(' • ');
      }

      return primaryLocation;
    })();

    let capacity = 1;
    if (typeof compartmentDefinedCapacity === 'number' && compartmentDefinedCapacity > 0) {
      capacity = compartmentDefinedCapacity;
    } else if (hasAssignment && isMultiLocation && resolvedLocationIds.length > 0) {
      capacity = resolvedLocationIds.length;
    }

    const occupiedCount = hasAssignment
      ? (isMultiLocation && resolvedLocationIds.length > 0 ? resolvedLocationIds.length : 1)
      : 0;
    const availableCount = Math.max(capacity - occupiedCount, 0);
    const utilizationPercent = capacity > 0 ? Math.round((occupiedCount / capacity) * 100) : 0;

    const headerClassName = hasAssignment
      ? 'hover-card__header'
      : 'hover-card__header hover-card__header--subtle';
    const bodyClassName = hasAssignment
      ? 'hover-card__body'
      : 'hover-card__body hover-card__body--compact';

    return (
      <div className="hover-card hover-card--compartment">
        <div className={headerClassName}>
          <div className="hover-card__title">{compartmentTitle}</div>
          <div className="hover-card__meta">Row {baseMeta.row} · Column {baseMeta.column}</div>
        </div>
        <div className={bodyClassName}>
          <div className="hover-card__metric-grid">
            {renderDetailRow('Location', locationLabel, 'location')}
          </div>

          <div className="hover-card__section">
            <div className="hover-card__section-label">Capacity</div>
            <div className="hover-card__progress-group">
              <div className="hover-card__progress-labels">
                <span>Available / Max</span>
                <span>{availableCount} / {capacity}</span>
              </div>
              <div className="hover-card__progress">
                <div
                  className="hover-card__progress-value"
                  style={{
                    width: `${Math.min(100, Math.max(0, utilizationPercent))}%`,
                    backgroundColor: '#f97316'
                  }}
                />
              </div>
              <div className="hover-card__progress-labels">
                <span>Utilization</span>
                <span>{utilizationPercent}%</span>
              </div>
            </div>
          </div>

          {hasAssignment && isMultiLocation && resolvedLocationIds.length > 0 && item.type !== 'vertical_sku_holder' && (
            <div className="hover-card__section">
              <div className="hover-card__section-label">Assigned Locations</div>
              <div className="hover-card__chip-row">
                {resolvedLocationIds.map((id, idx) => (
                  <span className="hover-card__chip" key={`${id}-${idx}`}>
                    {id}
                    {tags && tags[idx] && <span className="hover-card__chip-tag">{tags[idx]}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!hasAssignment && (
            <div className="hover-card__empty-state">Click to assign a SKU to this space.</div>
          )}
        </div>
      </div>
    );
  }, [item.type, renderDetailRow]);

  const buildItemTooltipContent = useCallback(() => {
    const title = getContextualLabel(item) || item.name || 'Warehouse Component';
    const subtitleParts = [];
    if (item.autoLabel && item.autoLabel !== title) {
      subtitleParts.push(item.autoLabel);
    }
    if (item.locationCode) {
      subtitleParts.push(item.locationCode);
    }

    const baseColor = item.customColor || item.color || getComponentColor(item.type, item.category) || '#334155';
    const headerGradientStart = adjustHexColor(baseColor, 0.08);
    const headerGradientEnd = adjustHexColor(baseColor, -0.16);
    const headerTextColor = getContrastColorForHex(baseColor);

    const nicelyFormattedType = item.type ? item.type.replace(/_/g, ' ') : 'Component';
    const rows = [];

    rows.push(['Type', toTitleCase(nicelyFormattedType)]);

    if (item.locationTag) {
      rows.push(['Location Tag', item.locationTag]);
    }

    const inventoryEntries = item.inventoryData?.inventory || [];
    const isStorageComponent = ['storage_unit', 'sku_holder', 'vertical_sku_holder', 'storage_zone', 'container_unit'].includes(item.type);
    const maxCapacity = isStorageComponent ? (item.inventoryData?.capacity ?? item.capacity ?? null) : null;
    const totalInventoryQuantity = inventoryEntries.reduce((sum, entry) => {
      const value = entry?.availableQuantity ?? entry?.quantity ?? 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    const availableCapacity = maxCapacity !== null ? Math.max(maxCapacity - totalInventoryQuantity, 0) : null;
    const storedItems = inventoryEntries
      .map((entry) => entry?.skuName || entry?.sku || entry?.skuCode)
      .filter(Boolean);
    const uniqueStoredItems = Array.from(new Set(storedItems));

    if (isStorageComponent) {
      rows.push([
        'Available / Max Capacity',
        maxCapacity !== null ? `${availableCapacity} / ${maxCapacity}` : '—'
      ]);
      rows.push([
        'Current Inventory',
        maxCapacity !== null ? totalInventoryQuantity : (inventoryEntries.length > 0 ? totalInventoryQuantity : '—')
      ]);
      rows.push([
        'Items Stored',
        uniqueStoredItems.length > 0
          ? uniqueStoredItems.slice(0, 3).join(', ') + (uniqueStoredItems.length > 3 ? '…' : '')
          : 'None'
      ]);
    }

    return (
      <div className="hover-card hover-card--item">
        <div
          className="hover-card__header"
          style={{
            background: `linear-gradient(135deg, ${headerGradientStart}, ${headerGradientEnd})`,
            color: headerTextColor
          }}
        >
          <div className="hover-card__title">{title}</div>
          {subtitleParts.length > 0 && (
            <div className="hover-card__meta">{subtitleParts.join(' • ')}</div>
          )}
        </div>

        <div className="hover-card__body">
          {rows.length > 0 && (
            <div className="hover-card__section">
              <div className="hover-card__section-label">Details</div>
              <div className="hover-card__metric-grid">
                {rows.map(([label, value], index) => renderDetailRow(label, value, `${label}-${index}`))}
              </div>
            </div>
          )}

          {inventoryEntries.length > 0 && (
            <div className="hover-card__section">
              <div className="hover-card__section-label">Current Inventory ({inventoryEntries.length} SKU{inventoryEntries.length > 1 ? 's' : ''})</div>
              <ul className="hover-card__inventory-list">
                {inventoryEntries.slice(0, 5).map((entry, idx) => (
                  <li className="hover-card__inventory-item" key={`${entry.sku || entry.locationId}-${idx}`}>
                    <div className="hover-card__inventory-name">{entry.sku || entry.locationId || `SKU-${idx + 1}`}</div>
                    <div className="hover-card__inventory-qty">
                      Qty: {entry.quantity ?? entry.qty ?? '—'}
                      {entry.reserved ? ` (${entry.reserved} reserved)` : ''}
                    </div>
                  </li>
                ))}
                {inventoryEntries.length > 5 && (
                  <li className="hover-card__inventory-more">+{inventoryEntries.length - 5} more…</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }, [item, renderDetailRow]);

  const handleItemMouseEnter = useCallback((event) => {
    // Only show tooltips in read-only mode (viewer), not in edit mode (layout builder)
    if (!isReadOnly) {
      return;
    }

    if (item.type === 'square_boundary') {
      return;
    }

    if (item.showCompartments) {
      return;
    }

    const content = buildItemTooltipContent();
    if (!content) {
      return;
    }

    const variant = item.occupancyStatus && item.occupancyStatus !== OCCUPANCY_STATUS.EMPTY
      ? 'occupied'
      : 'empty';
    showTooltip(event, content, variant, 'item');
  }, [buildItemTooltipContent, item.occupancyStatus, item.type, showTooltip, isReadOnly]);

  const handleItemMouseMove = useCallback((event) => {
    // Only show tooltips in read-only mode (viewer), not in edit mode (layout builder)
    if (!isReadOnly) {
      return;
    }

    if (item.type === 'square_boundary' || item.showCompartments || !hoverTooltip || hoverTooltip.context !== 'item') {
      return;
    }
    const content = buildItemTooltipContent();
    if (!content) {
      return;
    }
    showTooltip(event, content, hoverTooltip.variant, 'item');
  }, [buildItemTooltipContent, hoverTooltip, item.type, showTooltip, isReadOnly]);

  const handleItemMouseLeave = useCallback(() => {
    // Only hide tooltips if we're in read-only mode
    if (isReadOnly) {
      hideTooltip();
    }
  }, [hideTooltip, isReadOnly]);

  const handleCompartmentHover = useCallback((event, compartmentData, rowIndex, colIndex) => {
    // Only show tooltips in read-only mode (viewer), not in edit mode (layout builder)
    if (!isReadOnly) {
      return;
    }
    const content = buildCompartmentTooltipContent(rowIndex, colIndex, compartmentData);
    const variant = compartmentData ? 'occupied' : 'empty';
    showTooltip(event, content, variant, 'compartment');
  }, [buildCompartmentTooltipContent, showTooltip, isReadOnly]);

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
    const isVertical = item.type === 'vertical_sku_holder';
    const filledFill = isVertical ? '#FFE0B2' : '#E0F7FA';
    const emptyFill = isVertical ? '#FFF3E0' : '#E3F2FD';
    const highlightFill = '#FFF9C4';
    const hoverFillOccupied = isVertical ? '#FFCC80' : '#B2EBF2';
    const hoverFillEmpty = isVertical ? '#FFE0CC' : '#BBDEFB';
    const textColor = isVertical ? '#E65100' : '#006064';

    const resolveLabel = (compartmentData) => {
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
        {Array.from({ length: totalCompartments }).map((_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const compartmentId = `${row}-${col}`;
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

          const borderColor = compartmentData ? '#000000' : '#000000';
          const borderWidth = compartmentData ? 2 : 1;

          const label = resolveLabel(compartmentData);
          const fontSize = Math.min(Math.max(cellWidth / 5.5, 7), 12);

          return (
            <g
              key={compartmentId}
              onMouseEnter={(event) => {
                setHoveredCompartment(compartmentId);
                handleCompartmentHover(event, compartmentData, row, col);
              }}
              onMouseMove={(event) => handleCompartmentHover(event, compartmentData, row, col)}
              onMouseLeave={() => {
                setHoveredCompartment(null);
                hideTooltip();
              }}
              onClick={(event) => {
                event.stopPropagation();
                
                // In readonly mode, trigger item selection for location details
                if (isReadOnly && onSelect) {
                  console.log('Compartment clicked in readonly mode:', { item, compartmentId, row, col, compartmentData });
                  // Pass the compartment-specific data by calling onSelect with a special format
                  // We'll pass the compartmentId so the parent can identify which compartment was clicked
                  onSelect(item.id, { compartmentId, compartmentData, row, col });
                  return;
                }
                
                if (onUpdate && !compartmentData && onRequestSkuId) {
                  onRequestSkuId(item.id, compartmentId, row, col);
                }
              }}
              onContextMenu={(event) => {
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
              <text
                x={x + cellWidth / 2}
                y={y + cellHeight / 2 + fontSize * 0.35}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight={compartmentData ? 600 : 500}
                fill={isCompartmentHighlighted ? '#1B5E20' : textColor}
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }, [hasCompartments, item, highlightedCompartments, hoveredCompartment, handleCompartmentHover, hideTooltip, onUpdate, onRequestSkuId]);

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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = (e) => {
    e.stopPropagation();

    if (isReadOnly) {
      if (onSelect) {
        onSelect(item.id);
      }
      return;
    }

    // Handle Storage Unit / Spare Unit Location assignment
    const isSingleSkuUnit = (item.type === 'storage_unit' || item.type === 'spare_unit') && item.hasSku && item.singleSku;
    if (isSingleSkuUnit && onRequestSkuId && !item.locationId) {
      const selectorId = item.type === 'spare_unit' ? 'spare-unit' : 'single-sku';
      onRequestSkuId(item.id, selectorId, 0, 0);
      return;
    }
    
    onSelect(item.id);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isReadOnly) {
      return;
    }
    const newName = prompt('Enter new name:', item.name);
    if (newName && newName !== item.name) {
      onUpdate(item.id, { name: newName });
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRightClick) {
      onRightClick(e, item);
    }
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick(e, item);
    }
  };

  const isStackable = STACKABLE_COMPONENTS.includes(item.type);
  const hasStack = item.stack && item.stack.layers && item.stack.layers.length > 1;
  const isContainer = item.isContainer;

  // Resize handling functions
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width;
    const startHeight = item.height;
    // Use major grid (60px) for square boundary, sub-grid (15px) for others
    const gridSize = (item.type === 'square_boundary' || item.gridAligned) ? 60 : 15;
    
    const handleMouseMove = (moveEvent) => {
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
  const isContained = item.containerId;
  const containerLevel = item.containerLevel || 0;
  const isMainBoundary = containerLevel === 1;
  const isZone = containerLevel === 2;
  const isUnit = containerLevel === 3;
  const isSpareUnit = item.type === 'spare_unit';
  const spareUnitColor = isSpareUnit
    ? (item.customColor || item.color || getComponentColor(item.type, item.category) || '#8D6E63')
    : null;
  const spareUnitTextColor = isSpareUnit ? getContrastColorForHex(spareUnitColor) : null;
  const storageUnitColor = item.type === 'storage_unit'
    ? (item.customColor || item.color || '#4CAF50')
    : null;
  const storageUnitTextColor = storageUnitColor ? getContrastColorForHex(storageUnitColor) : '#FFFFFF';
  const hasHighlightedCompartments = Array.isArray(highlightedCompartments) && highlightedCompartments.length > 0;
  
  // Get status-based styling
  const occupancyStatus = item.occupancyStatus || OCCUPANCY_STATUS.EMPTY;
  const statusColor = STATUS_COLORS[occupancyStatus] || '#ddd';
  // Remove orientation color override to maintain fixed component colors
  // const orientationColor = item.storageOrientation ? ORIENTATION_COLORS[item.storageOrientation] : null;

  return (
    <div
      ref={drag}
      className={`warehouse-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isContainer ? 'container' : ''} ${isContained ? 'contained' : ''} ${isMainBoundary ? 'main-boundary' : ''} ${isZone ? 'zone' : ''} ${isUnit ? 'unit' : ''}`}
      data-type={item.type}
      data-occupancy={item.occupancyStatus || OCCUPANCY_STATUS.EMPTY}
      data-container={isContainer}
      data-contained={isContained}
      data-container-level={containerLevel}
      data-position-locked={item.isPositionLocked || false}
      data-size-locked={item.isSizeLocked || false}
      data-color={isSpareUnit ? spareUnitColor : (item.type === 'storage_unit' ? storageUnitColor : item.color || '')}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        backgroundColor: item.isHollow ? 'transparent' : 
          (item.type === 'storage_unit' ? storageUnitColor : 
           item.type === 'sku_holder' ? (item.showCompartments ? 'transparent' : '#2196F3') :
           item.type === 'vertical_sku_holder' ? (item.showCompartments ? 'transparent' : '#FF9800') :
           isSpareUnit ? spareUnitColor :
           isContainer ? 'transparent' : 
           getComponentColor(item.type, item.category)),
        border: item.type === 'storage_unit' || isSpareUnit ? 'none' :
               item.type === 'sku_holder' || item.type === 'vertical_sku_holder' ? 'none' : 
               (item.type === 'square_boundary' ? '4px solid #000000' : 
               (isMainBoundary ? '4px solid #263238' : 
               (isZone ? `3px solid ${getComponentColor(item.type)}` : 
               (isContainer ? `3px solid ${getComponentColor(item.type)}` : 
               (isContained ? `2px dashed ${getComponentColor(item.type) || statusColor}` : `3px solid ${getComponentColor(item.type) || statusColor}`))))),
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
      
      {/* Storage Racks and Spare Units - Show Location ID in black text */}
      {((item.type === 'sku_holder' || item.type === 'vertical_sku_holder' || item.type === 'spare_unit') && !item.showCompartments) && (() => {
        if (item.type === 'spare_unit') {
          // For Spare Units, show the locationId if it exists
          return item.locationId ? (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              textAlign: 'center',
              transform: 'translateY(-50%)',
              color: spareUnitTextColor,
              fontWeight: 'bold',
              fontSize: Math.min(Math.max(item.width / 10, 10), 14),
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              padding: '0 5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {item.locationId}
            </div>
          ) : null;
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

      {/* Storage Unit - Display name and label */}
      {item.type === 'storage_unit' && (() => {
        const trimmedName = item.name ? item.name.trim() : '';
        const categoryDisplayNames = {
          dry_storage: 'Dry Storage',
          cold_storage: 'Cold Storage',
          hazardous: 'Hazardous Storage',
          fragile: 'Fragile Storage',
          bulk: 'Bulk Storage',
          storage: 'Storage'
        };
        const categoryText = item.labelInfo?.categoryText
          || categoryDisplayNames[item.category]
          || 'Storage Unit';
        const primaryText = trimmedName || categoryText;
        const labelText = (() => {
          if (item.locationId && item.locationId.trim()) {
            return item.locationId.trim();
          }
          const trimmedLabel = item.label ? item.label.trim() : '';
          if (trimmedLabel && trimmedLabel !== trimmedName) {
            return trimmedLabel;
          }
          return null;
        })();
        const minDimension = Math.min(item.width || 60, item.height || 60);
        const primaryFontSize = Math.max(9, Math.min(14, Math.floor(minDimension / 6)));
        const secondaryFontSize = Math.max(7, Math.min(12, Math.floor(minDimension / 8)));

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
              gap: '4px',
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
            {labelText && (
              <div
                style={{
                  color: storageUnitTextColor,
                  fontSize: `${secondaryFontSize}px`,
                  fontWeight: 500,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {labelText}
              </div>
            )}
          </div>
        );
      })()}

      {/* Fire Exit Marking - Custom Image Display with Debugging */}
      {item.type === 'fire_exit_marking' && (() => {
        console.log('Rendering Fire Exit Marking:', item);
        console.log('Item type:', item.type);
        console.log('Item properties:', {
          id: item.id,
          name: item.name,
          width: item.width,
          height: item.height,
          color: item.color
        });
        
        return (
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
              borderRadius: '4px',
              backgroundColor: item.color || '#F44336' // Fallback background
            }}
            title="Fire Exit - Emergency Evacuation Route"
          >
            {/* Debug Info */}
            <div
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#00FF00',
                fontSize: '8px',
                padding: '1px 3px',
                borderRadius: '2px',
                fontFamily: 'monospace',
                zIndex: 1000
              }}
            >
              DEBUG: {item.type}
            </div>
            
            {/* Try to load image */}
            <img
              src="/assets/images/icons/fire-exit.jpg"
              alt="Fire Exit"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '2px solid #D32F2F' // Darker red border for definition
              }}
              onError={(e) => {
                console.error('Failed to load fire exit image on canvas');
                console.error('Image path:', e.target.src);
                console.error('Error event:', e);
                console.error('Network error:', e.target.naturalWidth === 0);
                
                // Show fallback text
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.innerHTML = `
                  <div style="
                    color: white;
                    font-weight: bold;
                    text-align: center;
                    padding: 10px;
                    font-size: 12px;
                  ">
                    🚪<br/>FIRE EXIT
                  </div>
                `;
                e.target.parentNode.appendChild(fallback);
              }}
              onLoad={() => {
                console.log('Successfully loaded fire exit image on canvas');
              }}
            />
            
            {/* Overlay Text for better visibility */}
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(211, 47, 47, 0.9)',
                color: '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              EXIT
            </div>
          </div>
        );
      })()}

      {/* Spare Unit - Display name inside the square */}
      {item.type === 'spare_unit' && (() => {
        const displayText = (item.name && item.name.trim()) || 'Spare Unit';
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
            {displayText}
          </div>
        );
      })()}

      {/* SKU compartment grid rendering for SKU Holder components */}
      {renderCompartmentGrid()}
      {hoverTooltip && <HoverInfoTooltip tooltip={hoverTooltip} />}
      
      {/* Resize handles for horizontal and vertical racks */}
      <ResizeHandle
        item={item}
        onResize={(updates) => {
          if (onUpdate) {
            onUpdate(item.id, updates);
          }
        }}
        gridSize={gridSize}
        snapToGrid={snapToGrid}
        color={item.type === 'sku_holder' ? '#2196F3' : '#FF9800'}
        isReadOnly={isReadOnly}
      />
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
  highlightedCompartments: PropTypes.arrayOf(PropTypes.string)
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
  highlightedCompartments: null
};

export default WarehouseItem;
