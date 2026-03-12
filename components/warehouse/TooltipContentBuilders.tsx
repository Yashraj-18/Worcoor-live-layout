// @ts-nocheck
'use client';

import React from 'react';
import { getContextualLabel } from '@/lib/warehouse/utils/componentLabeling';
import { getComponentColor } from '@/lib/warehouse/utils/componentColors';
import { adjustHexColor, getContrastColorForHex, toTitleCase } from './WarehouseTooltip';
import locationDataService from '@/lib/warehouse/services/locationDataService';

export interface ItemTooltipData {
  item: any;
  inventoryData?: any;
  capacity?: number;
  dbUnitOfMeasurement?: string;
}

export interface CompartmentTooltipData {
  item: any;
  compartmentData: any;
  rowIndex: number;
  colIndex: number;
  locationTagsMap?: Record<string, any>;
}

export const buildItemTooltipContent = (data: ItemTooltipData): React.ReactNode => {
  const { item, inventoryData, capacity, dbUnitOfMeasurement } = data;

  
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

  // Enhanced storage unit details fetching
  const isStorageComponent = ['storage_unit', 'sku_holder', 'vertical_sku_holder', 'storage_zone', 'container_unit', 'open_storage_space'].includes(item.type);

  // Try to fetch real location data for storage components
  let realLocationData = null;
  let locationId = null;

  if (isStorageComponent) {
    locationId = item.locationId ||
      item.locationData?.location_id ||
      item.properties?.locationId ||
      item.data?.locationId;

    if (!locationId && item.compartmentContents) {
      const compartments = Object.values(item.compartmentContents);
      if (compartments.length > 0) {
        const firstCompartment = compartments[0];
        locationId = firstCompartment.locationId || firstCompartment.uniqueId;
      }
    }

    if (locationId) {
      realLocationData = locationDataService.getLocationById(locationId);
    }
  }

  // Extract all location tags for display (storage components only)
  const allLocationTags = (() => {
    if (!isStorageComponent) return [];
    const tags: string[] = [];

    const tagSources = [
      item.locationTag,
      item.locationTags,
      item.tags,
      item.assignedLocations,
      item.locationIds,
      item.locationData?.locationIds
    ];

    tagSources.forEach(source => {
      if (source) {
        if (Array.isArray(source)) {
          tags.push(...source.filter(Boolean));
        } else if (typeof source === 'string') {
          const splitTags = source.split(',').map(tag => tag.trim()).filter(Boolean);
          tags.push(...splitTags);
        }
      }
    });

    return Array.from(new Set(tags));
  })();

  // Display location tags in details section if they exist
  if (allLocationTags.length > 0) {
    rows.push(['Location Tag(s)', allLocationTags.join(', ')]);
  }

  // Enhanced inventory data
  let inventoryEntries: any[] = [];
  let maxCapacity = null;
  let totalInventoryQuantity = 0;

  if (!isStorageComponent) {
    // Non-storage components: skip
  } else if (realLocationData) {
    maxCapacity = realLocationData.max_capacity || item.capacity || capacity;
    totalInventoryQuantity = realLocationData.available_quantity || 0;

    if (realLocationData.sku_name) {
      inventoryEntries = [{
        skuName: realLocationData.sku_name,
        sku: realLocationData.sku_code || realLocationData.sku_instance_id,
        skuCode: realLocationData.sku_code,
        availableQuantity: realLocationData.available_quantity,
        quantity: realLocationData.available_quantity,
        brand: realLocationData.sku_brand_vendor
      }];
    }
  } else {
    inventoryEntries = inventoryData?.inventory || [];
    maxCapacity = inventoryData?.capacity ?? capacity ?? item.capacity ?? null;
    totalInventoryQuantity = inventoryEntries.reduce((sum: number, entry: any) => {
      const value = entry?.availableQuantity ?? entry?.quantity ?? 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  const storedItems = inventoryEntries
    .map((entry: any) => entry?.skuName || entry?.sku || entry?.skuCode)
    .filter(Boolean);
  const uniqueStoredItems = Array.from(new Set(storedItems));

  // Storage Component Metrics
  if (isStorageComponent) {
    if (maxCapacity !== null) {
      // Issue 5: Show capacity in cubic metres
      rows.push([
        'Capacity',
        `${maxCapacity} cubic ${dbUnitOfMeasurement || item.unitOfMeasurement || 'metre'}`
      ]);

      rows.push([
        'Current Inventory',
        `${totalInventoryQuantity} units`
      ]);

      const hasLocationTags = allLocationTags.length > 0;
      const hasSkusAssigned = totalInventoryQuantity > 0;
      let statusText = 'Unknown';
      if (hasLocationTags) {
        statusText = hasSkusAssigned ? 'Utilised' : 'Unutilised';
      }
      rows.push(['Status', statusText]);
    }

    if (uniqueStoredItems.length > 0) {
      rows.push([
        'Items Stored',
        uniqueStoredItems.slice(0, 3).join(', ') + (uniqueStoredItems.length > 3 ? ` (+${uniqueStoredItems.length - 3} more)` : '')
      ]);
    }

    if (realLocationData) {
      if (realLocationData.location) rows.push(['Physical Location', realLocationData.location]);
      if (realLocationData.parent_resource) rows.push(['Storage Type', realLocationData.parent_resource]);
    }
  }

  return (
    <div className="warehouse-tooltip-content">
      <div
        className="warehouse-tooltip__header"
        style={{
          background: `linear-gradient(135deg, ${headerGradientStart}, ${headerGradientEnd})`,
          color: headerTextColor,
          padding: '12px 16px',
          margin: '-16px -16px 12px -16px',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <div className="warehouse-tooltip__title">{title}</div>
        {subtitleParts.length > 0 && (
          <div className="warehouse-tooltip__subtitle">{subtitleParts.join(' • ')}</div>
        )}
      </div>

      <div className="warehouse-tooltip__body">
        {rows.length > 0 && (
          <div className="warehouse-tooltip__section">
            <div className="warehouse-tooltip__section-label">Details</div>
            <div className="warehouse-tooltip__metric-grid">
              {rows.map(([label, value], index) => (
                <div key={`${label}-${index}`} className="warehouse-tooltip__metric">
                  <span className="warehouse-tooltip__metric-label">{label}</span>
                  <span className="warehouse-tooltip__metric-value">{value ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isStorageComponent && inventoryEntries.length > 0 && (
          <div className="warehouse-tooltip__section">
            <div className="warehouse-tooltip__section-label">Inventory</div>
            <ul className="warehouse-tooltip__inventory-list">
              {inventoryEntries.slice(0, 5).map((entry: any, idx: number) => (
                <li key={`${entry.sku}-${idx}`} className="warehouse-tooltip__inventory-item">
                  <span className="warehouse-tooltip__inventory-name">
                    {entry.skuName || entry.sku || entry.skuCode || 'Unknown SKU'}
                  </span>
                  <span className="warehouse-tooltip__inventory-quantity">
                    {entry.availableQuantity ?? entry.quantity ?? 0} units
                  </span>
                </li>
              ))}
              {inventoryEntries.length > 5 && (
                <li className="warehouse-tooltip__inventory-more">+{inventoryEntries.length - 5} more…</li>
              )}
            </ul>
          </div>
        )}

        {/* Multi-tag chips (dedicated section) */}
        {allLocationTags.length > 1 && (
          <div className="warehouse-tooltip__section">
            <div className="warehouse-tooltip__section-label">Assigned Tags</div>
            <div className="warehouse-tooltip__chip-row">
              {allLocationTags.map((tag: string, idx: number) => (
                <span className="warehouse-tooltip__chip" key={`${tag}-${idx}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const buildCompartmentTooltipContent = (data: CompartmentTooltipData): React.ReactNode => {
  const { item, compartmentData, rowIndex, colIndex } = data;

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

  let realLocationData = null;
  const compartmentLocationId = locationId || uniqueId;

  if (compartmentLocationId) {
    realLocationData = locationDataService.getLocationById(compartmentLocationId);
  }

  const resolvedLocationIds = Array.isArray(locationIds) ? locationIds.filter(Boolean) : [];
  const resolvedMappings = Array.isArray(levelLocationMappings)
    ? levelLocationMappings.filter((mapping: any) => mapping && mapping.locationId)
    : [];
  const primaryLocation = hasAssignment
    ? locationId || uniqueId || resolvedLocationIds[0] || 'N/A'
    : 'Unassigned';

  const resolvedPairs = (() => {
    if (!hasAssignment) return [];
    if (resolvedMappings.length > 0) {
      return resolvedMappings.map((mapping: any, idx: number) => {
        const levelLabel = mapping.levelId || tags?.[idx] || `L${idx + 1}`;
        return `${levelLabel}: ${mapping.locationId}`;
      });
    }
    if (isMultiLocation && resolvedLocationIds.length > 0) {
      return resolvedLocationIds.map((id: any, idx: number) => {
        const levelLabel = tags?.[idx];
        return levelLabel ? `${levelLabel}: ${id}` : id;
      });
    }
    return [];
  })();

  const locationLabel = (() => {
    if (!hasAssignment) return primaryLocation;
    if (item.type === 'vertical_sku_holder' && resolvedPairs.length > 0) {
      return resolvedPairs.join(' • ');
    }
    return primaryLocation;
  })();

  const formatCubicUnit = (unit: string | undefined) => {
    const trimmed = unit?.trim();
    if (!trimmed) return 'cubic units';
    return trimmed.toLowerCase().includes('cubic') ? trimmed : `cubic ${trimmed}`;
  };

  // Pull real data from locationTagsMap (backend tag) when available
  const backendTag = data.locationTagsMap && compartmentLocationId
    ? data.locationTagsMap[compartmentLocationId]
    : null;

  let capacityValue: string = '—';
  let hasSkus = false;

  if (backendTag) {
    // Use backend tag's capacity (with unit) and currentItems for status
    const cap = backendTag.capacity ?? backendTag.maxCapacity;
    const unit = formatCubicUnit(backendTag.unitOfMeasurement || item.unitOfMeasurement || 'feet');
    capacityValue = cap != null ? `${cap} ${unit}` : '—';
    hasSkus = (backendTag.currentItems ?? 0) > 0;
  } else if (realLocationData) {
    const cap = realLocationData.max_capacity || compartmentDefinedCapacity;
    capacityValue = cap != null ? `${cap} cubic ${item.unitOfMeasurement || 'metre'}` : '—';
    hasSkus = (realLocationData.available_quantity || 0) > 0;
  } else {
    if (typeof compartmentDefinedCapacity === 'number' && compartmentDefinedCapacity > 0) {
      capacityValue = `${compartmentDefinedCapacity} cubic ${item.unitOfMeasurement || 'metre'}`;
    }
    hasSkus = false;
  }

  return (
    <div className="warehouse-tooltip-content">
      <div className="warehouse-tooltip__header">
        <div className="warehouse-tooltip__title">{compartmentTitle}</div>
        <div className="warehouse-tooltip__meta">Row {baseMeta.row} · Column {baseMeta.column}</div>
      </div>

      <div className="warehouse-tooltip__body">
        <div className="warehouse-tooltip__metric-grid">
          <div className="warehouse-tooltip__metric">
            <span className="warehouse-tooltip__metric-label">Location</span>
            <span className="warehouse-tooltip__metric-value">{locationLabel}</span>
          </div>

          {realLocationData?.sku_name && (
            <div className="warehouse-tooltip__metric">
              <span className="warehouse-tooltip__metric-label">SKU Name</span>
              <span className="warehouse-tooltip__metric-value">{realLocationData.sku_name}</span>
            </div>
          )}
        </div>

        {/* Issue 5: Enhanced Capacity Section (No bars) */}
        <div className="warehouse-tooltip__section">
          <div className="warehouse-tooltip__metric-grid">
            <div className="warehouse-tooltip__metric">
              <span className="warehouse-tooltip__metric-label">Capacity</span>
              <span className="warehouse-tooltip__metric-value">
                {capacityValue}
              </span>
            </div>
            <div className="warehouse-tooltip__metric">
              <span className="warehouse-tooltip__metric-label">Status</span>
              <span className="warehouse-tooltip__metric-value">
                {!hasAssignment ? 'Unknown' : (hasSkus ? 'Utilised' : 'Unutilised')}
              </span>
            </div>
          </div>
        </div>

        {realLocationData && (
          <div className="warehouse-tooltip__section">
            <div className="warehouse-tooltip__section-label">Location Details</div>
            <div className="warehouse-tooltip__metric-grid">
              {realLocationData.location && (
                <div className="warehouse-tooltip__metric">
                  <span className="warehouse-tooltip__metric-label">Physical Location</span>
                  <span className="warehouse-tooltip__metric-value">{realLocationData.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasAssignment && (
          <div className="warehouse-tooltip__empty-state">Click to assign a SKU to this space.</div>
        )}
      </div>
    </div>
  );
};
