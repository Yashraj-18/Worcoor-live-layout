// @ts-nocheck
'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WarehouseItem from './WarehouseItem';
import TooltipProvider from './TooltipProvider';

const noop = () => {};
const DEFAULT_PADDING = 0;

export const getLayoutItemKey = (item) => {
  if (!item) {
    return '';
  }

  if (item.id) {
    return String(item.id);
  }

  const parts = [
    item.type || 'item',
    Math.round(item.x || 0),
    Math.round(item.y || 0),
    item.width || 0,
    item.height || 0
  ];

  return parts.join('-');
};

const SavedLayoutRenderer = ({
  items,
  metadata,
  width = '100%',
  height = '100%',
  background = '#f8f9fa',
  showLabels = true,
  highlightedKeys = [],
  filteredKeys = [],
  highlightedCompartmentsMap = {},
  padding = DEFAULT_PADDING,
  allowUpscale = false,
  fitMode = 'contain',
  stageBackground = '#ffffff',
  stageBorder = '1px solid #e0e0e0',
  stageShadow = '0 1px 3px rgba(15, 23, 42, 0.08)',
  stageBorderRadius = '12px',
  showMetadata = true,
  zoomLevel = 1,
  onItemClick = null,
  locationTagsMap = {}
}: {
  items: any[];
  metadata?: any;
  width?: string | number;
  height?: string | number;
  background?: string;
  showLabels?: boolean;
  highlightedKeys?: (string | number)[];
  filteredKeys?: (string | number)[];
  highlightedCompartmentsMap?: Record<string, any>;
  padding?: number;
  allowUpscale?: boolean;
  fitMode?: 'contain' | 'cover';
  stageBackground?: string;
  stageBorder?: string;
  stageShadow?: string;
  stageBorderRadius?: string;
  showMetadata?: boolean;
  zoomLevel?: number;
  onItemClick?: ((item: any, index: number) => void) | null;
  locationTagsMap?: Record<string, any>;
}) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        setContainerSize({ width: entryWidth, height: entryHeight });
      });
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const { bounds, adjustedItems, contentWidth, contentHeight } = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        bounds: { minX: 0, minY: 0, width: 1, height: 1 },
        adjustedItems: [],
        contentWidth: 1,
        contentHeight: 1
      };
    }

    const applyRotationBounds = (item) => {
      const width = item.width || 0;
      const height = item.height || 0;
      const angle = item.rotation || 0;

      if (!angle) {
        return {
          minX: item.x,
          minY: item.y,
          maxX: item.x + width,
          maxY: item.y + height
        };
      }

      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
        { x: width, y: height }
      ].map(({ x, y }) => ({
        x: item.x + x * cos - y * sin,
        y: item.y + x * sin + y * cos
      }));

      return {
        minX: Math.min(...corners.map((c) => c.x)),
        minY: Math.min(...corners.map((c) => c.y)),
        maxX: Math.max(...corners.map((c) => c.x)),
        maxY: Math.max(...corners.map((c) => c.y))
      };
    };

    const boundsList = items.map(applyRotationBounds);

    const minX = Math.min(...boundsList.map((b) => b.minX));
    const minY = Math.min(...boundsList.map((b) => b.minY));
    const maxX = Math.max(...boundsList.map((b) => b.maxX));
    const maxY = Math.max(...boundsList.map((b) => b.maxY));

    const widthSpan = Math.max(maxX - minX, 1);
    const heightSpan = Math.max(maxY - minY, 1);

    const effectivePadding = typeof padding === 'number' ? padding : DEFAULT_PADDING;
    const paddedWidth = widthSpan + effectivePadding * 2;
    const paddedHeight = heightSpan + effectivePadding * 2;

    const normalizedItems = items.map((item) => ({
      ...item,
      x: item.x - minX + effectivePadding,
      y: item.y - minY + effectivePadding,
      __layoutKey: getLayoutItemKey(item)
    }));

    return {
      bounds: { minX, minY, width: widthSpan, height: heightSpan },
      adjustedItems: normalizedItems,
      contentWidth: paddedWidth,
      contentHeight: paddedHeight
    };
  }, [items, padding]);

  const scale = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return 1;
    }
    if (contentWidth === 0 || contentHeight === 0) {
      return 1;
    }

    const widthScale = containerSize.width / contentWidth;
    const heightScale = containerSize.height / contentHeight;

    const normalizedFitMode = fitMode === 'cover' ? 'cover' : 'contain';

    let scaleValue = normalizedFitMode === 'cover'
      ? Math.max(widthScale, heightScale)
      : Math.min(widthScale, heightScale);

    // Limit upscaling
    if (!allowUpscale && scaleValue > 1) {
      scaleValue = 1;
    }

    // Apply gentle adjustment for padding
    scaleValue *= 0.90;

    // Ensure reasonable bounds
    scaleValue = Math.max(0.1, Math.min(scaleValue, 2));

    if (!Number.isFinite(scaleValue) || scaleValue <= 0) {
      return 1;
    }

    return scaleValue;
  }, [containerSize, contentWidth, contentHeight, allowUpscale, fitMode]);

  const highlightedKeySet = useMemo(() => new Set(highlightedKeys.map(String)), [highlightedKeys]);
  const filteredKeySet = useMemo(() => new Set(filteredKeys.map(String)), [filteredKeys]);
  const hasActiveFilters = filteredKeys.length > 0;

  return (
    <div
      ref={containerRef}
      className="saved-layout-renderer"
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        background,
        alignSelf: 'stretch',
        flex: '1 1 auto',
        minWidth: 0,
        minHeight: 0
      }}
    >
      {showMetadata && metadata && (metadata.name || metadata.timestamp) && (
        <div
          className="saved-layout-renderer__meta"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 2,
            padding: '6px 10px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#495057'
          }}
        >
          {metadata.name && <div style={{ fontWeight: 600 }}>{metadata.name}</div>}
          {metadata.timestamp && (
            <div style={{ fontSize: '0.7rem' }}>
              {new Date(metadata.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}

      <DndProvider backend={HTML5Backend}>
        <div
          className="saved-layout-renderer__stage"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: contentWidth,
            height: contentHeight,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
            backgroundColor: stageBackground,
            border: stageBorder,
            borderRadius: stageBorderRadius,
            boxShadow: stageShadow,
            overflow: 'visible'
          }}
        >
          <div
            className="saved-layout-renderer__grid"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
              pointerEvents: 'none'
            }}
          />

          <div
            className="saved-layout-renderer__items"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <TooltipProvider>
              {adjustedItems.map((item, index) => {
              const itemKey = item.__layoutKey || getLayoutItemKey(item);
              const isFaded = hasActiveFilters && !filteredKeySet.has(itemKey);
              
              // Create a select handler that passes the full item to onItemClick
              // Also handles compartment-specific clicks
              const handleItemSelect = onItemClick ? (itemId, compartmentInfo) => {
                if (compartmentInfo) {
                  // Compartment was clicked (could be empty or with data)
                  if (compartmentInfo.compartmentData) {
                    // Compartment HAS data (location tag assigned)
                    const compartmentLocationId = compartmentInfo.compartmentData.locationId || compartmentInfo.compartmentData.primaryLocationId;
                    const compartmentLocationTag = compartmentLocationId ? locationTagsMap[compartmentLocationId] : null;
                    
                    const modifiedItem = {
                      ...item,
                      selectedCompartment: compartmentInfo.compartmentData,
                      selectedCompartmentId: compartmentInfo.compartmentId,
                      selectedCompartmentRow: compartmentInfo.row,
                      selectedCompartmentCol: compartmentInfo.col,
                      // Add locationTagId for LocationDetailsPanel to fetch the correct data
                      locationTagId: compartmentLocationTag?.id,
                      locationId: compartmentLocationId,
                      name: compartmentLocationId
                    };
                    onItemClick(modifiedItem, index);
                  } else {
                    // Compartment is EMPTY (no location tag assigned)
                    const modifiedItem = {
                      ...item,
                      selectedCompartment: null,
                      selectedCompartmentId: compartmentInfo.compartmentId,
                      selectedCompartmentRow: compartmentInfo.row,
                      selectedCompartmentCol: compartmentInfo.col,
                      // Don't pass locationTagId so LocationDetailsPanel shows "No Data Available"
                      locationTagId: undefined,
                      locationId: undefined,
                      name: `Empty Compartment`
                    };
                    onItemClick(modifiedItem, index);
                  }
                } else {
                  // Regular item click (not a compartment)
                  onItemClick(item, index);
                }
              } : noop;
              
              return (
                <div
                  key={itemKey}
                  style={{
                    opacity: isFaded ? 0.08 : 1,
                    filter: isFaded ? 'blur(0.6px) saturate(0) brightness(1.5)' : 'none',
                    transition: 'opacity 0.25s ease, filter 0.25s ease',
                    pointerEvents: isFaded ? 'none' : 'auto',
                    cursor: onItemClick ? 'pointer' : 'default'
                  }}
                >
                  {item.type === 'inner_boundary' ? (
                    <div
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
                      <span
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
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <WarehouseItem
                      item={item}
                      isSelected={false}
                      onSelect={handleItemSelect}
                      onUpdate={noop}
                      onDelete={noop}
                      zoomLevel={zoomLevel}
                      snapToGrid={false}
                      gridSize={60}
                      onRequestSkuId={null}
                      onRightClick={null}
                      onInfoClick={null}
                      stackMode={false}
                      isReadOnly={true}
                      isHighlighted={highlightedKeySet.has(itemKey)}
                      highlightedCompartments={highlightedCompartmentsMap[itemKey] || null}
                      locationTagsMap={locationTagsMap}
                      hideNonMatchingCompartments={hasActiveFilters}
                    />
                  )}
                </div>
              );
            })}
            </TooltipProvider>
          </div>
        </div>
      </DndProvider>
    </div>
  );
};

export default SavedLayoutRenderer;

