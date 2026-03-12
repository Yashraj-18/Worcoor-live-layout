// @ts-nocheck
'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, Package, BarChart3, Wifi, WifiOff } from 'lucide-react';
import { useWarehouseSocket } from '../../hooks/useWarehouseSocket';
import { locationTagService, type LocationTag } from '@/src/services/locationTags';

/**
 * WarehouseOverviewPanel - Displays overall warehouse metrics when no component is selected
 * Matches the exact same look and feel as LocationDetailsPanel
 */
interface WarehouseLayoutData {
  items: any[];
  name?: string;
}

interface WarehouseOverviewPanelProps {
  layoutData: WarehouseLayoutData;
  unitId?: string;
  layoutId?: string;
  locationTags?: LocationTag[];
}

// Mirror of GRID_SIZE used in layoutComponentSummary
const GRID_SIZE = 60;

const RACK_TYPES = new Set(['sku_holder', 'vertical_sku_holder']);

/**
 * Derive per-item capacity metrics using the same logic as layoutComponentSummary.ts.
 * Returns { maxCapacity, usedCapacity } for a single layout item.
 */
const deriveItemCapacity = (item: any): { maxCapacity: number; usedCapacity: number } => {
  if (RACK_TYPES.has(item.type)) {
    const width = Number(item.width) || GRID_SIZE;
    const height = Number(item.height) || GRID_SIZE;
    const cols = Math.max(1, Math.round(width / GRID_SIZE));
    const rows = Math.max(1, Math.round(height / GRID_SIZE));
    const compartments = cols * rows;
    const maxPerCompartment = item.maxSKUsPerCompartment || 1;
    const maxCapacity = compartments * maxPerCompartment;

    let usedCapacity = 0;
    if (item.compartmentContents && typeof item.compartmentContents === 'object') {
      Object.values(item.compartmentContents).forEach((content: any) => {
        if (!content) return;

        // Check if compartment is occupied by any of these indicators
        const hasContent =
          content.sku ||
          content.primarySku ||
          content.locationId ||
          content.primaryLocationId ||
          content.uniqueId ||
          (Array.isArray(content.locationIds) && content.locationIds.length > 0) ||
          (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0) ||
          (Array.isArray(content.levelIds) && content.levelIds.length > 0);

        if (!hasContent) return;

        // Calculate quantity based on available data
        let qty = 1;
        if (typeof content.quantity === 'number' && content.quantity > 0) {
          qty = content.quantity;
        } else if (Array.isArray(content.locationIds) && content.locationIds.length > 0) {
          qty = content.locationIds.length;
        } else if (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0) {
          qty = content.levelLocationMappings.length;
        } else if (Array.isArray(content.levelIds) && content.levelIds.length > 0) {
          qty = content.levelIds.length;
        }

        usedCapacity += qty;
      });
    }

    return { maxCapacity, usedCapacity: Math.min(maxCapacity, usedCapacity) };
  }

  // Non-rack components: multi-location items count each location tag as a slot
  const multiLocIds: string[] = Array.isArray(item.locationData?.locationIds) ? item.locationData.locationIds : [];
  const maxCapacity = multiLocIds.length > 1 ? multiLocIds.length : 1;
  let usedCapacity = 0;

  if (multiLocIds.length > 1) {
    // For multi-location items, each location tag counts as used
    usedCapacity = multiLocIds.length;
  } else if (item.inventoryData && typeof item.inventoryData === 'object') {
    const { inventory, utilization } = item.inventoryData;
    if (Array.isArray(inventory) && inventory.length > 0) usedCapacity = 1;
    else if (typeof utilization === 'number' && utilization > 0) usedCapacity = 1;
  }

  if (!usedCapacity) {
    const hasId = (item.locationId || item.primaryLocationId || item.sku || item.locationTagId || '').toString().trim();
    if (hasId) usedCapacity = 1;
  }

  return { maxCapacity, usedCapacity };
};

const WarehouseOverviewPanel = ({ layoutData, unitId, layoutId, locationTags: locationTagsProp }: WarehouseOverviewPanelProps) => {
  // Real-time stats from API
  const [apiStats, setApiStats] = useState<{
    totalLocations: number;
    totalSkus: number;
    totalComponents: number;
    totalAssets: number;
    utilizationPercentage?: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Location tags with volumetric data.
  // When locationTagsProp is provided by the parent, use it directly (no extra fetch).
  // When not provided, fall back to fetching independently.
  const [fetchedLocationTags, setFetchedLocationTags] = useState<LocationTag[]>([]);
  const locationTags: LocationTag[] = locationTagsProp ?? fetchedLocationTags;

  // Ref to track locationTagsProp without causing fetchStats recreation
  const locationTagsPropRef = useRef(locationTagsProp);

  // Keep the ref in sync with locationTagsProp
  useEffect(() => {
    locationTagsPropRef.current = locationTagsProp;
  }, [locationTagsProp]);

  // Ref to track the last unitId for which stats was fetched to prevent duplicate requests
  const lastStatsFetchedUnitRef = useRef<string | null>(null);

  // Fetch stats (and location tags when not provided by parent) from API
  const fetchStats = useCallback(async () => {
    if (!unitId) return;
    if (lastStatsFetchedUnitRef.current === unitId) return;
    lastStatsFetchedUnitRef.current = unitId;

    setIsLoadingStats(true);
    try {
      // Only fetch location tags here when the parent hasn't supplied them
      const requests: [Promise<Response>, Promise<LocationTag[]>?] = [
        fetch(`/api/units/${unitId}/live-map/stats`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
      ];

      const statsResponse = await Promise.all(requests);

      if (statsResponse[0].ok) {
        const stats = await statsResponse[0].json();
        setApiStats({
          totalLocations: stats.totalLocationTags,
          totalSkus: stats.totalSkus,
          totalComponents: stats.totalComponents,
          totalAssets: stats.totalAssets,
          utilizationPercentage: stats.utilizationPercentage,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [unitId]);

  // Fetch stats on mount and when unitId changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // WebSocket connection for real-time updates.
  // onLocationTagStatsUpdate handles all stat changes (component create/delete/update
  // and location tag changes) — the backend broadcasts locationTag:statsUpdated for
  // all of these mutations, so no HTTP fallback is needed here.
  const { isConnected } = useWarehouseSocket({
    unitId: unitId || '',
    layoutId,
    onLocationTagStatsUpdate: (stats) => {
      setApiStats({
        totalLocations: stats.totalLocationTags,
        totalSkus: stats.totalSkus,
        totalComponents: stats.totalComponents,
        totalAssets: stats.totalAssets,
        utilizationPercentage: stats.utilizationPercentage,
      });
    },
  });
  // Calculate overview data from layout items
  const overviewData = useMemo(() => {
    const empty = {
      totalLocations: 0,
      totalSkus: 0,
      totalComponents: 0,
      locationTagData: [] as any[],
      totalShelves: 0,
      fullShelves: 0,
      emptyShelves: 0,
      newlyAdded: 0,
      slotFillRate: 0,
      locationTagUtilization: 0,
      taggedComponents: 0,
      totalMax: 0,
      totalUsed: 0,
    };

    if (!layoutData?.items?.length) return empty;

    const items = layoutData.items;
    const uniqueLocationTags = new Set<string>();
    const allSkus = new Set<string>();

    // Build lookup maps for backend location tags (by id and by name) so we only
    // count tags that actually exist in the database.
    const locationTagLookup = new Map<string, LocationTag>();
    locationTags.forEach((tag) => {
      if (tag.id) {
        locationTagLookup.set(tag.id, tag);
      }
      if (tag.locationTagName) {
        locationTagLookup.set(tag.locationTagName.trim(), tag);
      }
    });

    // ── Collect unique location tags and SKUs ──────────────────────────────────
    const addLocationTag = (id: any) => {
      if (!id) return;
      // Handle array values (e.g. compartment primaryLocationId can be an array)
      if (Array.isArray(id)) {
        id.forEach(addLocationTag);
        return;
      }
      if (typeof id === 'string') uniqueLocationTags.add(id.trim());
    };

    items.forEach((item: any) => {
      // Collect SKUs from item properties
      if (item.sku) allSkus.add(item.sku);
      if (item.primarySku) allSkus.add(item.primarySku);

      // Collect SKUs from locationTag.skus[]
      if (item.locationTag && Array.isArray(item.locationTag.skus)) {
        item.locationTag.skus.forEach((sku: any) => {
          if (sku.skuName) allSkus.add(sku.skuName);
        });
      }

      // Item-level location tags
      addLocationTag(item.locationId);
      addLocationTag(item.primaryLocationId);
      if (Array.isArray(item.locationIds)) {
        item.locationIds.forEach(addLocationTag);
      }

      // Multi-location storage units / vertical racks store extra tags in locationData.locationIds
      if (item.locationData?.locationIds && Array.isArray(item.locationData.locationIds)) {
        item.locationData.locationIds.forEach(addLocationTag);
      }

      // Item-level levelLocationMappings (vertical racks)
      if (Array.isArray(item.levelLocationMappings)) {
        item.levelLocationMappings.forEach((m: any) => {
          addLocationTag(m?.locationId || m?.locId);
        });
      }

      // Collect location tags and SKUs from compartment contents
      if (item.compartmentContents && typeof item.compartmentContents === 'object') {
        Object.values(item.compartmentContents).forEach((c: any) => {
          if (!c) return;

          // Compartment-level location tags
          addLocationTag(c.locationId);
          addLocationTag(c.primaryLocationId);

          // Multi-location compartments (locationIds array)
          if (Array.isArray(c.locationIds)) {
            c.locationIds.forEach(addLocationTag);
          }

          // Vertical rack level mappings (L1, L2, L3 each with own tag)
          if (Array.isArray(c.levelLocationMappings)) {
            c.levelLocationMappings.forEach((m: any) => {
              addLocationTag(m?.locationId || m?.locId);
            });
          }

          // Collect SKUs from compartments
          if (c.sku) allSkus.add(c.sku);
          if (c.primarySku) allSkus.add(c.primarySku);
        });
      }
    });

    // ── Per-location-tag volumetric capacity (L × B × H from database) ──
    // Each item with a locationTag gets mapped to its volumetric dimensions from the location tags table.
    const tagMap = new Map<string, {
      tag: LocationTag;
      usedCapacity: number;
    }>();

    const addToTag = (tagData: LocationTag | undefined, used: number) => {
      if (!tagData) return;
      const existing = tagMap.get(tagData.id);
      if (existing) {
        existing.usedCapacity += used;
      } else {
        tagMap.set(tagData.id, {
          tag: tagData,
          usedCapacity: used,
        });
      }
    };

    items.forEach((item: any) => {
      // Find parent tag name for the entire item
      const itemTagName: string = (
        item.locationTag?.locationTagName ||
        item.locationTag?.name ||
        item.locationTagId ||
        item.locationId ||
        item.primaryLocationId ||
        ''
      ).toString().trim();

      // For items with compartmentContents, process each compartment separately
      if (item.compartmentContents && typeof item.compartmentContents === 'object') {
        Object.values(item.compartmentContents).forEach((content: any) => {
          if (!content) return;

          // Check if compartment has content
          const hasContent =
            content.sku ||
            content.primarySku ||
            content.locationId ||
            content.primaryLocationId ||
            content.uniqueId ||
            (Array.isArray(content.locationIds) && content.locationIds.length > 0) ||
            (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0) ||
            (Array.isArray(content.levelIds) && content.levelIds.length > 0);

          if (!hasContent) return;

          // Process each level mapping individually (vertical racks with L1, L2, L3)
          if (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0) {
            content.levelLocationMappings.forEach((mapping: any) => {
              const locId = (mapping?.locationId || mapping?.locId || '').toString().trim();
              if (locId) {
                let tagData = locationTagLookup.get(locId);
                if (!tagData) {
                  tagData = { id: locId, locationTagName: locId, unitId: unitId || 'fallback' } as LocationTag;
                  locationTagLookup.set(locId, tagData);
                }
                addToTag(tagData, 1);
              }
            });
          } else if (Array.isArray(content.locationIds) && content.locationIds.length > 0) {
            // Multi-location compartments (locationIds array)
            content.locationIds.forEach((locId: string) => {
              const trimmed = (locId || '').toString().trim();
              if (trimmed) {
                let tagData = locationTagLookup.get(trimmed);
                if (!tagData) {
                  tagData = { id: trimmed, locationTagName: trimmed, unitId: unitId || 'fallback' } as LocationTag;
                  locationTagLookup.set(trimmed, tagData);
                }
                addToTag(tagData, 1);
              }
            });
          } else {
            // Single location tag per compartment
            const compartmentTagName: string = (content.locationId || content.primaryLocationId || '').toString().trim();
            const activeTagName = compartmentTagName || itemTagName;

            if (activeTagName) {
              let tagData = locationTagLookup.get(activeTagName);
              if (!tagData) {
                tagData = { id: activeTagName, locationTagName: activeTagName, unitId: unitId || 'fallback' } as LocationTag;
                locationTagLookup.set(activeTagName, tagData);
              }
              addToTag(tagData, 1);
            }
          }
        });

        // Also ensure the item-level tag makes it into tagMap if not already covered
        // by compartments (e.g. a rack that has an item-level locationId alongside compartments)
        if (itemTagName && !tagMap.has(itemTagName)) {
          const existingByName = locationTagLookup.get(itemTagName);
          if (existingByName && !tagMap.has(existingByName.id)) {
            addToTag(existingByName, 0);
          } else if (!existingByName) {
            const tagData = { id: itemTagName, locationTagName: itemTagName, unitId: unitId || 'fallback' } as LocationTag;
            locationTagLookup.set(itemTagName, tagData);
            addToTag(tagData, 0);
          }
        }
      } else {
        // For non-compartmentalized items, process as before
        const { usedCapacity } = deriveItemCapacity(item);

        // Multi-location items (storage units / vertical racks) store extra tags in locationData.locationIds
        const multiLocIds: string[] = Array.isArray(item.locationData?.locationIds) ? item.locationData.locationIds : [];
        if (multiLocIds.length > 0) {
          multiLocIds.forEach((locId: string) => {
            const trimmed = (locId || '').toString().trim();
            if (trimmed) {
              let tagData = locationTagLookup.get(trimmed);
              if (!tagData) {
                tagData = { id: trimmed, locationTagName: trimmed, unitId: unitId || 'fallback' } as LocationTag;
                locationTagLookup.set(trimmed, tagData);
              }
              addToTag(tagData, 0);
            }
          });
        } else if (itemTagName) {
          let tagData = locationTagLookup.get(itemTagName);
          if (!tagData) {
            tagData = { id: itemTagName, locationTagName: itemTagName, unitId: unitId || 'fallback' } as LocationTag;
            locationTagLookup.set(itemTagName, tagData);
          }
          addToTag(tagData, usedCapacity);
        }
      }
    });

    const locationTagData = Array.from(tagMap.values()).map(({ tag, usedCapacity }) => {
      const capacity = tag.capacity ?? 0;
      const currentItems = tag.currentItems ?? 0;

      // Calculate effective items by taking the max of backend items and frontend map usage
      const effectiveItems = Math.max(currentItems, usedCapacity);

      let utilizationPercentage = 0;
      if (typeof tag.utilizationPercentage === 'number' && tag.utilizationPercentage > 0) {
        utilizationPercentage = Math.round(tag.utilizationPercentage);
      } else if (capacity > 0) {
        utilizationPercentage = Math.round(Math.min(effectiveItems / capacity, 1) * 100);
      } else if (effectiveItems > 0) {
        // If used but capacity is 0/unknown, default to 100% since it's occupied
        utilizationPercentage = 100;
      }

      return {
        locationId: tag.locationTagName ?? tag.id,
        length: tag.length,
        breadth: tag.breadth,
        height: tag.height,
        unitOfMeasurement: tag.unitOfMeasurement,
        capacity,
        usedCapacity,
        utilizationPercentage,
        currentItems,
      };
    });

    locationTagData.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    // ── Overall capacity totals ────────────────────────────────────────────
    let totalMax = 0;
    let totalUsed = 0;
    items.forEach((item: any) => {
      const { maxCapacity, usedCapacity } = deriveItemCapacity(item);
      totalMax += maxCapacity;
      totalUsed += usedCapacity;
    });

    // ── Shelf / slot statistics ────────────────────────────────────────────
    // Count rack-type items as "shelves"; each compartment is one shelf slot.
    let totalShelves = 0;
    let fullShelves = 0;
    let emptyShelves = 0;
    let newlyAdded = 0;

    items.forEach((item: any) => {
      if (RACK_TYPES.has(item.type)) {
        const width = Number(item.width) || GRID_SIZE;
        const height = Number(item.height) || GRID_SIZE;
        const cols = Math.max(1, Math.round(width / GRID_SIZE));
        const rows = Math.max(1, Math.round(height / GRID_SIZE));
        const compartments = cols * rows;
        totalShelves += compartments;

        const contents = item.compartmentContents || {};
        const occupiedKeys = Object.keys(contents).filter(k => {
          const c = contents[k];
          return c && (
            c.sku ||
            c.primarySku ||
            c.locationId ||
            c.primaryLocationId ||
            c.uniqueId ||
            (Array.isArray(c.locationIds) && c.locationIds.length > 0) ||
            (Array.isArray(c.levelLocationMappings) && c.levelLocationMappings.length > 0) ||
            (Array.isArray(c.levelIds) && c.levelIds.length > 0)
          );
        });
        fullShelves += occupiedKeys.length;
        emptyShelves += Math.max(0, compartments - occupiedKeys.length);

        // "Newly added" = compartments that have a sku but no locationId yet (just placed)
        const newKeys = Object.keys(contents).filter(k => {
          const c = contents[k];
          return c && c.sku && !c.locationId;
        });
        newlyAdded += newKeys.length;
      } else {
        // Non-rack items: multi-location items count each location tag as a shelf slot
        const multiLocIds: string[] = Array.isArray(item.locationData?.locationIds) ? item.locationData.locationIds : [];
        if (multiLocIds.length > 1) {
          totalShelves += multiLocIds.length;
          // Each location tag that has backend data (currentItems > 0) counts as full
          multiLocIds.forEach((locId: string) => {
            const trimmed = (locId || '').toString().trim();
            const tagData = locationTagLookup.get(trimmed);
            if (tagData && (tagData.currentItems ?? 0) > 0) {
              fullShelves += 1;
            } else {
              emptyShelves += 1;
            }
          });
        } else {
          totalShelves += 1;
          const { usedCapacity } = deriveItemCapacity(item);
          if (usedCapacity > 0) fullShelves += 1;
          else emptyShelves += 1;
        }
      }
    });

    // ── Slot fill rate: filled compartment slots / total compartment slots ────
    const slotFillRate = totalMax > 0
      ? Math.round(Math.min(totalUsed, totalMax) / totalMax * 100)
      : 0;

    return {
      totalLocations: uniqueLocationTags.size,
      totalSkus: allSkus.size,
      totalComponents: items.length,
      locationTagData,
      totalShelves,
      fullShelves,
      emptyShelves,
      newlyAdded,
      slotFillRate,
      totalMax,
      totalUsed,
    };
  }, [layoutData, locationTags]);

  // Merge API stats with canvas-derived data.
  // Location Tags Used comes from the canvas (which sees level mappings) — the backend
  // stats endpoint only counts component-level locationTagId so it under-reports.
  // Total SKUs and Total Components prefer backend numbers when available.
  const displayStats = useMemo(() => ({
    ...overviewData,
    totalLocations: overviewData.totalLocations,
    totalSkus: (apiStats?.totalSkus || overviewData.totalSkus),
    totalComponents: (apiStats?.totalComponents || overviewData.totalComponents),
  }), [overviewData, apiStats]);

  // Same styling as LocationDetailsPanel
  const panelStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'hsl(218.4 36.23% 13.53%)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, hsl(218.4 36.23% 13.53%), hsl(217.5 54.33% 5.85%))'
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, hsl(222.2 47% 11%) 0%, hsl(222.2 32.6% 18.55%) 100%)',
    color: 'white',
    padding: 'var(--spacing-5)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
    flexShrink: 0
  };

  const contentStyle = {
    padding: '1rem',
    overflow: 'auto',
    flex: 1,
    minHeight: 0
  };

  const sectionStyle = {
    marginBottom: '1.25rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, hsl(215.3 25.1% 26.1%), hsl(215.3 25.1% 18.55%))',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid hsl(215.3 25.1% 32.6%)'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const valueStyle = {
    fontSize: '0.95rem',
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: '0.5rem'
  };

  // Use totalLocations (from uniqueLocationTags) as the total placed tag count so
  // the donut matches Summary Metrics. locationTagData may have fewer entries when a
  // tag is detected in the count but has no capacity data to map.
  const placedTagCount = displayStats.totalLocations;
  const placedTagInUseCount = displayStats.locationTagData.filter((t: any) => (t.currentItems ?? 0) > 0).length;
  const placedTagUtilPercent = apiStats?.utilizationPercentage !== undefined
    ? Math.round(apiStats.utilizationPercentage)
    : (placedTagCount > 0 ? Math.round((placedTagInUseCount / placedTagCount) * 100) : 0);

  return (
    <div style={panelStyle} className="animate-slide-up">
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            Warehouse Overview
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            {layoutData?.name || 'Warehouse Layout'} - Overall Metrics
            {unitId && isConnected && (
              <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>● Live</span>
            )}
          </div>
        </div>
      </div>

      <div style={contentStyle}>
        {/* Summary Metrics Section */}
        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} />
            Summary Metrics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={labelStyle}>Location Tags Used</div>
              <div style={valueStyle}>{displayStats.totalLocations}</div>
            </div>
            <div>
              <div style={labelStyle}>Total SKUs</div>
              <div style={valueStyle}>{displayStats.totalSkus}</div>
            </div>
            <div>
              <div style={labelStyle}>Total Components</div>
              <div style={valueStyle}>{displayStats.totalComponents}</div>
            </div>
            {apiStats && unitId && (
              <div>
                <div style={labelStyle}>Live Data</div>
                <div style={valueStyle}>
                  <span style={{ fontSize: '0.85rem', color: '#22c55e' }}>● Connected</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Volumetric Space Utilization Section */}
        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} />
            Volumetric Space Utilization
          </h4>

          {displayStats.locationTagData && displayStats.locationTagData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {displayStats.locationTagData.map((location, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, hsl(215.3 25.1% 18.55%), hsl(215.3 25.1% 15.1%))',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(215.3 25.1% 25.1%)'
                }}>
                  {/* Location Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0' }}>
                        {location.locationId}
                      </div>
                      {(location.length !== null && location.breadth !== null && location.height !== null) && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {location.length} × {location.breadth} × {location.height} {location.unitOfMeasurement || ''}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      color: '#fff',
                      backgroundColor: location.currentItems > 0 ? '#ef4444' : '#22c55e'
                    }}>
                      {location.currentItems > 0 ? 'Utilised' : 'Not Utilised'}
                    </div>
                  </div>

                  {/* Capacity Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Capacity:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: '600' }}>
                        {location.capacity} cubic {location.unitOfMeasurement || 'meters'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              No location data available
            </div>
          )}
        </div>

        {/* Slot & Tag Utilization Section */}
        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} />
            Slot &amp; Tag Utilization
          </h4>

          {/* Location Tag Utilization Donut */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Location Tag Utilization
            </div>
            <div style={{ position: 'relative', display: 'inline-block', width: '140px', height: '140px' }}>
              {(() => {
                const r = 55;
                const circumference = 2 * Math.PI * r;
                const ratio = placedTagCount > 0 ? placedTagInUseCount / placedTagCount : 0;
                const utilisedLen = circumference * ratio;
                const notUtilisedLen = circumference - utilisedLen;
                return (
                  <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Not-utilised segment (green) — drawn first as full ring */}
                    <circle
                      cx="70"
                      cy="70"
                      r={r}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="16"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset="0"
                    />
                    {/* Utilised segment (red) — overlays from the start */}
                    <circle
                      cx="70"
                      cy="70"
                      r={r}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="16"
                      strokeDasharray={`${utilisedLen} ${notUtilisedLen}`}
                      strokeDashoffset="0"
                      strokeLinecap="butt"
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  </svg>
                );
              })()}
              {/* Center text */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#e2e8f0'
              }}>
                {placedTagUtilPercent}%
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                Utilised ({placedTagInUseCount})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Not Utilised ({placedTagCount - placedTagInUseCount})
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              {placedTagInUseCount} of {placedTagCount} placed tags in use
            </div>
          </div>

          {/* Shelf Statistics */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '500' }}>
              Shelf Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Total Shelves</span>
                <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{displayStats.totalShelves}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Empty Shelves</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>{displayStats.emptyShelves}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Utilised Shelves</span>
                <span style={{ color: '#22c55e', fontWeight: '600' }}>{displayStats.fullShelves}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Newly Added</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{displayStats.newlyAdded}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WarehouseOverviewPanel;
