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
}

export interface CompartmentTooltipData {
  item: any;
  compartmentData: any;
  rowIndex: number;
  colIndex: number;
}

export const buildItemTooltipContent = (data: ItemTooltipData): React.ReactNode => {
  const { item, inventoryData, capacity } = data;
  
  // Debug: Log the item data to see what we're working with
  console.log('Tooltip Debug - Item Data:', item);
  console.log('Tooltip Debug - Location Tag:', item.locationTag);
  console.log('Tooltip Debug - Location Tags:', item.locationTags);
  console.log('Tooltip Debug - All Item Properties:', Object.keys(item));
  
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
    // Extract location ID from various sources
    locationId = item.locationId || 
                 item.locationData?.location_id ||
                 item.properties?.locationId ||
                 item.data?.locationId;
    
    // For storage racks with compartments, try to get locationId from first compartment
    if (!locationId && item.compartmentContents) {
      const compartments = Object.values(item.compartmentContents);
      if (compartments.length > 0) {
        const firstCompartment = compartments[0];
        locationId = firstCompartment.locationId || firstCompartment.uniqueId;
      }
    }
    
    // Fetch real data from the service if locationId exists
    if (locationId) {
      realLocationData = locationDataService.getLocationById(locationId);
    }
  }

  // Add location information if available
  // Note: Location ID is now shown in the dedicated Location Tags section
  
  // Enhanced location tag handling for multiple tags (only for storage components)
  if (isStorageComponent && item.locationTag) {
    if (Array.isArray(item.locationTag)) {
      // Multiple location tags
      rows.push(['Location Tags', item.locationTag.join(', ')]);
    } else if (typeof item.locationTag === 'string') {
      // Check if it's a comma-separated string of multiple tags
      const tags = item.locationTag.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tags.length > 1) {
        rows.push(['Location Tags', tags.join(', ')]);
      } else {
        rows.push(['Location Tag', item.locationTag]);
      }
    }
  } else if (isStorageComponent) {
    // Check for other possible location tag properties
    const possibleTagProps = ['locationTags', 'tags', 'assignedLocations', 'locationIds'];
    for (const prop of possibleTagProps) {
      if (item[prop]) {
        const tags = Array.isArray(item[prop]) ? item[prop] : 
                    typeof item[prop] === 'string' ? item[prop].split(',').map(t => t.trim()).filter(Boolean) : 
                    [];
        if (tags.length > 0) {
          rows.push([prop === 'locationTags' ? 'Location Tags' : 'Location Tags', tags.join(', ')]);
          break;
        }
      }
    }
    
    // Check the most important one: locationData.locationIds
    if (item.locationData?.locationIds && Array.isArray(item.locationData.locationIds)) {
      const tags = item.locationData.locationIds;
      if (tags.length > 0) {
        rows.push(['Location Tags', tags.join(', ')]);
      }
    }
  }

  // Enhanced inventory data with real data integration (only for storage components)
  let inventoryEntries: any[] = [];
  let maxCapacity = null;
  let totalInventoryQuantity = 0;

  if (!isStorageComponent) {
    // Non-storage components: skip all inventory/capacity logic
  } else if (realLocationData) {
    // Use real location data
    maxCapacity = realLocationData.max_capacity || item.capacity || capacity;
    totalInventoryQuantity = realLocationData.available_quantity || 0;
    
    // Create inventory entry from real data
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
    // Fallback to item inventory data (storage components only)
    inventoryEntries = inventoryData?.inventory || [];
    maxCapacity = inventoryData?.capacity ?? capacity ?? item.capacity ?? null;
    totalInventoryQuantity = inventoryEntries.reduce((sum: number, entry: any) => {
      const value = entry?.availableQuantity ?? entry?.quantity ?? 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  const availableCapacity = maxCapacity !== null ? Math.max(maxCapacity - totalInventoryQuantity, 0) : null;
  const storedItems = inventoryEntries
    .map((entry: any) => entry?.skuName || entry?.sku || entry?.skuCode)
    .filter(Boolean);
  const uniqueStoredItems = Array.from(new Set(storedItems));

  // Enhanced storage component information
  if (isStorageComponent) {
    // Capacity information
    if (maxCapacity !== null) {
      const utilizationPercent = maxCapacity > 0 ? Math.round((totalInventoryQuantity / maxCapacity) * 100) : 0;
      
      rows.push([
        'Available / Max Capacity',
        `${availableCapacity} / ${maxCapacity} (${utilizationPercent}%)`
      ]);
      
      rows.push([
        'Current Inventory',
        `${totalInventoryQuantity} units`
      ]);
      
      // Capacity status indicator
      const capacityStatus = utilizationPercent >= 90 ? 'Critical' : 
                           utilizationPercent >= 75 ? 'High' : 
                           utilizationPercent >= 50 ? 'Moderate' : 
                           utilizationPercent > 0 ? 'Low' : 'Empty';
      rows.push(['Capacity Status', capacityStatus]);
    }
    
    // Items stored information
    if (uniqueStoredItems.length > 0) {
      rows.push([
        'Items Stored',
        uniqueStoredItems.length > 0
          ? uniqueStoredItems.slice(0, 3).join(', ') + (uniqueStoredItems.length > 3 ? ` (+${uniqueStoredItems.length - 3} more)` : '')
          : 'None'
      ]);
    }
    
    // Physical location information
    if (realLocationData) {
      if (realLocationData.location) {
        rows.push(['Physical Location', realLocationData.location]);
      }
      
      if (realLocationData.parent_resource) {
        rows.push(['Storage Type', realLocationData.parent_resource]);
      }
      
      if (realLocationData.sku_procured_date) {
        const procuredDate = new Date(realLocationData.sku_procured_date).toLocaleDateString();
        rows.push(['Procurement Date', procuredDate]);
      }
    }
  }

  // Extract all location tags for display in a dedicated section (storage components only)
  const allLocationTags = (() => {
    if (!isStorageComponent) return [];
    const tags: string[] = [];
    
    // Debug: Log all possible tag sources
    console.log('Tooltip Debug - Tag Sources:', {
      locationTag: item.locationTag,
      locationTags: item.locationTags,
      tags: item.tags,
      assignedLocations: item.assignedLocations,
      locationIds: item.locationIds,
      locationData: item.locationData,
      locationDataLocationIds: item.locationData?.locationIds
    });
    
    // Check various possible location tag properties
    const tagSources = [
      item.locationTag,
      item.locationTags,
      item.tags,
      item.assignedLocations,
      item.locationIds,
      item.locationData?.locationIds // This is where the actual data is!
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
    
    // Remove duplicates and return unique tags
    const uniqueTags = Array.from(new Set(tags));
    console.log('Tooltip Debug - Final Tags:', uniqueTags);
    return uniqueTags;
  })();

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

        {/* Dedicated location tags section for storage units with multiple tags */}
        {allLocationTags.length > 0 && (
          <div className="warehouse-tooltip__section">
            <div className="warehouse-tooltip__section-label">Location Tags</div>
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

  // Fetch real location data for this compartment
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
    if (!hasAssignment) {
      return [];
    }

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

  // Enhanced location label display with multiple tags support
  const locationLabel = (() => {
    if (!hasAssignment) {
      return primaryLocation;
    }

    if (item.type === 'vertical_sku_holder' && resolvedPairs.length > 0) {
      return resolvedPairs.join(' • ');
    }

    // For storage units with multiple location tags, show all tags
    if (item.locationTag) {
      if (Array.isArray(item.locationTag)) {
        return item.locationTag.join(', ');
      } else if (typeof item.locationTag === 'string') {
        const tags = item.locationTag.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 1) {
          return tags.join(', ');
        }
      }
    }

    // Check other possible location tag properties
    const possibleTagProps = ['locationTags', 'tags', 'assignedLocations', 'locationIds'];
    for (const prop of possibleTagProps) {
      if (item[prop]) {
        const tags = Array.isArray(item[prop]) ? item[prop] : 
                    typeof item[prop] === 'string' ? item[prop].split(',').map(t => t.trim()).filter(Boolean) : 
                    [];
        if (tags.length > 0) {
          return tags.join(', ');
        }
      }
    }

    return primaryLocation;
  })();

  // Enhanced capacity calculation with real data
  let capacity = 1;
  let occupiedCount = 0;
  let availableCount = 0;
  let utilizationPercent = 0;

  if (realLocationData) {
    // Use real location data
    capacity = realLocationData.max_capacity || compartmentDefinedCapacity || 1;
    occupiedCount = realLocationData.available_quantity || 0;
    availableCount = Math.max(capacity - occupiedCount, 0);
    utilizationPercent = capacity > 0 ? Math.round((occupiedCount / capacity) * 100) : 0;
  } else {
    // Fallback to compartment data
    if (typeof compartmentDefinedCapacity === 'number' && compartmentDefinedCapacity > 0) {
      capacity = compartmentDefinedCapacity;
    } else if (hasAssignment && isMultiLocation && resolvedLocationIds.length > 0) {
      capacity = resolvedLocationIds.length;
    }
    
    occupiedCount = hasAssignment
      ? (isMultiLocation && resolvedLocationIds.length > 0 ? resolvedLocationIds.length : 1)
      : 0;
    availableCount = Math.max(capacity - occupiedCount, 0);
    utilizationPercent = capacity > 0 ? Math.round((occupiedCount / capacity) * 100) : 0;
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
          
          {/* Show real SKU information if available */}
          {realLocationData && realLocationData.sku_name && (
            <div className="warehouse-tooltip__metric">
              <span className="warehouse-tooltip__metric-label">SKU Name</span>
              <span className="warehouse-tooltip__metric-value">{realLocationData.sku_name}</span>
            </div>
          )}
          
          {realLocationData && realLocationData.sku_code && (
            <div className="warehouse-tooltip__metric">
              <span className="warehouse-tooltip__metric-label">SKU Code</span>
              <span className="warehouse-tooltip__metric-value">{realLocationData.sku_code}</span>
            </div>
          )}
          
          {realLocationData && realLocationData.sku_brand_vendor && (
            <div className="warehouse-tooltip__metric">
              <span className="warehouse-tooltip__metric-label">Brand</span>
              <span className="warehouse-tooltip__metric-value">{realLocationData.sku_brand_vendor}</span>
            </div>
          )}
        </div>

        <div className="warehouse-tooltip__section">
          <div className="warehouse-tooltip__section-label">Capacity</div>
          <div className="warehouse-tooltip__progress-group">
            <div className="warehouse-tooltip__progress-labels">
              <span>Available / Max</span>
              <span>{availableCount} / {capacity}</span>
            </div>
            <div className="warehouse-tooltip__progress">
              <div
                className="warehouse-tooltip__progress-value"
                style={{
                  width: `${Math.min(100, Math.max(0, utilizationPercent))}%`,
                  backgroundColor: utilizationPercent >= 90 ? '#dc3545' : 
                                 utilizationPercent >= 75 ? '#ffc107' : 
                                 utilizationPercent >= 50 ? '#28a745' : '#17a2b8'
                }}
              />
            </div>
            <div className="warehouse-tooltip__progress-labels">
              <span>Utilization</span>
              <span>{utilizationPercent}%</span>
            </div>
          </div>
        </div>

        {/* Real location specific information */}
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
              
              {realLocationData.parent_resource && (
                <div className="warehouse-tooltip__metric">
                  <span className="warehouse-tooltip__metric-label">Storage Type</span>
                  <span className="warehouse-tooltip__metric-value">{realLocationData.parent_resource}</span>
                </div>
              )}
              
              {realLocationData.sku_procured_date && (
                <div className="warehouse-tooltip__metric">
                  <span className="warehouse-tooltip__metric-label">Procured Date</span>
                  <span className="warehouse-tooltip__metric-value">
                    {new Date(realLocationData.sku_procured_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {hasAssignment && isMultiLocation && resolvedLocationIds.length > 0 && item.type !== 'vertical_sku_holder' && (
          <div className="warehouse-tooltip__section">
            <div className="warehouse-tooltip__section-label">Assigned Locations</div>
            <div className="warehouse-tooltip__chip-row">
              {resolvedLocationIds.map((id: any, idx: number) => (
                <span className="warehouse-tooltip__chip" key={`${id}-${idx}`}>
                  {id}
                  {tags && tags[idx] && <span className="warehouse-tooltip__chip-tag">{tags[idx]}</span>}
                </span>
              ))}
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
