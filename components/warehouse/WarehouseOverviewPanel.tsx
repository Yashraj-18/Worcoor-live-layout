// @ts-nocheck
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
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

  // Non-rack single-slot components
  const maxCapacity = 1;
  let usedCapacity = 0;

  if (item.inventoryData && typeof item.inventoryData === 'object') {
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
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Location tags with volumetric data.
  // When locationTagsProp is provided by the parent, use it directly (no extra fetch).
  // When not provided, fall back to fetching independently.
  const [fetchedLocationTags, setFetchedLocationTags] = useState<LocationTag[]>([]);
  const locationTags: LocationTag[] = locationTagsProp ?? fetchedLocationTags;

  // Fetch stats (and location tags when not provided by parent) from API
  const fetchStats = useCallback(async () => {
    if (!unitId) return;

    setIsLoadingStats(true);
    try {
      // Only fetch location tags here when the parent hasn't supplied them
      const requests: [Promise<Response>, Promise<LocationTag[]>?] = [
        fetch(`/api/units/${unitId}/live-map/stats`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
      ];

      if (!locationTagsProp) {
        requests.push(locationTagService.listByUnit(unitId).catch(() => [] as LocationTag[]));
      }

      const [statsResponse, tags] = await Promise.all(requests);

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setApiStats({
          totalLocations: stats.totalLocationTags,
          totalSkus: stats.totalSkus,
          totalComponents: stats.totalComponents,
          totalAssets: stats.totalAssets,
        });
      }

      if (tags) {
        setFetchedLocationTags(tags);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [unitId, locationTagsProp]);

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

    // ── Collect unique location tags and SKUs ──────────────────────────────────
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

      // Collect location tags and SKUs from compartment contents
      if (item.compartmentContents && typeof item.compartmentContents === 'object') {
        Object.values(item.compartmentContents).forEach((c: any) => {
          if (!c) return;

          // Collect location tags from compartments
          const compartmentLocationTag = c.locationId || c.primaryLocationId;
          if (compartmentLocationTag) {
            uniqueLocationTags.add(String(compartmentLocationTag).trim());
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
      locationTagName: string;
      length: number | null;
      breadth: number | null;
      height: number | null;
      unitOfMeasurement: string | null;
      capacity: number;
      usedCapacity: number;
      hasSku: boolean;
    }>();

    const addToTag = (tag: string, tagData: LocationTag | undefined, used: number, hasSku: boolean) => {
      if (!tag) return;
      const existing = tagMap.get(tag);
      if (existing) {
        existing.usedCapacity += used;
        if (hasSku) existing.hasSku = true; // Set to true if any compartment has SKU
      } else {
        const length = tagData?.length ?? null;
        const breadth = tagData?.breadth ?? null;
        const height = tagData?.height ?? null;
        const capacity = tagData?.capacity ?? 0;
        const locationTagName = tagData?.locationTagName ?? tag;

        tagMap.set(tag, {
          locationTagName,
          length,
          breadth,
          height,
          unitOfMeasurement: tagData?.unitOfMeasurement ?? null,
          capacity,
          usedCapacity: used,
          hasSku
        });
      }
    };

    items.forEach((item: any) => {
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
            (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0);

          if (!hasContent) return;

          // Extract location tag from compartment content
          const compartmentTagName: string = (content.locationId || content.primaryLocationId || '').toString().trim();

          if (compartmentTagName) {
            // Find the corresponding location tag data from the database
            const tagData = locationTags.find(t =>
              t.locationTagName === compartmentTagName ||
              t.id === compartmentTagName
            );

            // Check if the location tag from database has SKUs (currentItems > 0 means SKUs are assigned)
            const hasSku = tagData ? (tagData.currentItems > 0) : false;

            // Calculate quantity for this compartment
            let qty = 1;
            if (typeof content.quantity === 'number' && content.quantity > 0) {
              qty = content.quantity;
            } else if (Array.isArray(content.locationIds) && content.locationIds.length > 0) {
              qty = content.locationIds.length;
            } else if (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0) {
              qty = content.levelLocationMappings.length;
            }

            addToTag(compartmentTagName, tagData, qty, hasSku);
          }
        });
      } else {
        // For non-compartmentalized items, process as before
        const { usedCapacity } = deriveItemCapacity(item);
        const tagName: string =
          (item.locationTag?.locationTagName || item.locationTag?.name || item.locationTagId || item.locationId || item.primaryLocationId || '').toString().trim();

        if (tagName) {
          const tagData = locationTags.find(t =>
            t.locationTagName === tagName ||
            t.id === item.locationTagId
          );

          // Check if the location tag from database has SKUs (currentItems > 0 means SKUs are assigned)
          const hasSku = tagData ? (tagData.currentItems > 0) : false;

          addToTag(tagName, tagData, usedCapacity, hasSku);
        }
      }
    });

    const locationTagData = Array.from(tagMap.entries()).map(([locationId, data]) => {
      return {
        locationId: data.locationTagName,
        length: data.length,
        breadth: data.breadth,
        height: data.height,
        unitOfMeasurement: data.unitOfMeasurement,
        capacity: data.capacity,
        usedCapacity: data.usedCapacity,
        utilizationPercentage: data.hasSku ? 100 : 0,
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
          return c && (c.sku || c.locationId || (Array.isArray(c.locationIds) && c.locationIds.length > 0));
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
        // Non-rack items count as 1 shelf slot each
        totalShelves += 1;
        const { usedCapacity } = deriveItemCapacity(item);
        if (usedCapacity > 0) fullShelves += 1;
        else emptyShelves += 1;
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
  }, [layoutData]);

  // Use calculated stats (API stats are shown separately with live indicator)
  const displayStats = overviewData;

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

  return (
    <div style={panelStyle} className="animate-slide-up">
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            Warehouse Overview
            {unitId && (
              <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                {isConnected ? (
                  <Wifi size={14} color="#22c55e" title="Live updates active" />
                ) : (
                  <WifiOff size={14} color="#ef4444" title="Disconnected" />
                )}
              </span>
            )}
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
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: location.utilizationPercentage > 80 ? '#22c55e' :
                        location.utilizationPercentage > 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {location.utilizationPercentage}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'hsl(215.3 25.1% 32.6%)',
                      borderRadius: '3px'
                    }}>
                      <div style={{
                        width: `${location.utilizationPercentage}%`,
                        height: '100%',
                        backgroundColor: location.utilizationPercentage > 80 ? '#22c55e' :
                          location.utilizationPercentage > 50 ? '#f59e0b' : '#ef4444',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Capacity Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Capacity:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: '600' }}>
                        {location.capacity}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Used:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{location.usedCapacity}</span>
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

          {/* Location Tag Utilization Ring */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Location Tag Utilization
            </div>
            <div style={{ position: 'relative', display: 'inline-block', width: '120px', height: '120px' }}>
              {/* Ring Widget SVG */}
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="hsl(215.3 25.1% 32.6%)"
                  strokeWidth="12"
                />
                {/* Progress ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (locationTags.length > 0 ? displayStats.locationTagData.filter((t: any) => t.utilizationPercentage > 0).length / locationTags.length : 0))}`}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              {/* Center text */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#f59e0b'
              }}>
                {locationTags.length > 0 ? Math.round((displayStats.locationTagData.filter((t: any) => t.utilizationPercentage > 0).length / locationTags.length) * 100) : 0}%
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              {displayStats.locationTagData.filter((t: any) => t.utilizationPercentage > 0).length} of {locationTags.length} tags in use
            </div>
          </div>

          {/* Slot Fill Rate bar */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#94a3b8' }}>Slot Fill Rate</span>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{displayStats.slotFillRate ?? 0}% ({displayStats.totalUsed ?? 0}/{displayStats.totalMax ?? 0} slots)</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(215.3 25.1% 32.6%)', borderRadius: '3px' }}>
              <div style={{
                width: `${displayStats.slotFillRate ?? 0}%`,
                height: '100%',
                backgroundColor: (displayStats.slotFillRate ?? 0) > 80 ? '#22c55e' : (displayStats.slotFillRate ?? 0) > 50 ? '#f59e0b' : '#ef4444',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
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
                <span style={{ color: '#94a3b8' }}>Full Shelves</span>
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
