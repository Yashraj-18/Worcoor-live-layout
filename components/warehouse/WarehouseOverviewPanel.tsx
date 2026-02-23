// @ts-nocheck
'use client';

import React, { useMemo } from 'react';
import { TrendingUp, Package, BarChart3 } from 'lucide-react';

/**
 * WarehouseOverviewPanel - Displays overall warehouse metrics when no component is selected
 * Matches the exact same look and feel as LocationDetailsPanel
 */
interface WarehouseLayoutData {
  items: any[];
  name?: string;
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
        let qty = 1;
        if (typeof content.quantity === 'number' && content.quantity > 0) {
          qty = content.quantity;
        } else if (Array.isArray(content.locationIds)) {
          qty = Math.max(1, content.locationIds.length);
        } else if (Array.isArray(content.levelLocationMappings)) {
          qty = Math.max(1, content.levelLocationMappings.length);
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
    const hasId = (item.locationId || item.primaryLocationId || item.sku || '').toString().trim();
    if (hasId) usedCapacity = 1;
  }

  return { maxCapacity, usedCapacity };
};

const WarehouseOverviewPanel = ({ layoutData }: { layoutData: WarehouseLayoutData }) => {
  // Calculate overview data from layout items
  const overviewData = useMemo(() => {
    const empty = {
      totalLocations: 0,
      totalSkus: 0,
      totalAssets: 0,
      totalComponents: 0,
      locationTagData: [] as any[],
      totalShelves: 0,
      fullShelves: 0,
      emptyShelves: 0,
      newlyAdded: 0,
      locationTagUsage: 0,
    };

    if (!layoutData?.items?.length) return empty;

    const items = layoutData.items;
    const allLocationIds = new Set<string>();
    const allSkus = new Set<string>();

    // ── Collect all location IDs and SKUs ──────────────────────────────────
    items.forEach((item: any) => {
      if (item.locationId) allLocationIds.add(item.locationId);
      if (item.primaryLocationId) allLocationIds.add(item.primaryLocationId);
      if (Array.isArray(item.locationIds)) item.locationIds.forEach((id: any) => id && allLocationIds.add(id));
      if (Array.isArray(item.levelLocationMappings)) {
        item.levelLocationMappings.forEach((m: any) => m?.locationId && allLocationIds.add(m.locationId));
      }
      if (item.sku) allSkus.add(item.sku);
      if (item.primarySku) allSkus.add(item.primarySku);

      if (item.compartmentContents && typeof item.compartmentContents === 'object') {
        Object.values(item.compartmentContents).forEach((c: any) => {
          if (!c) return;
          if (c.locationId) allLocationIds.add(c.locationId);
          if (Array.isArray(c.locationIds)) c.locationIds.forEach((id: any) => id && allLocationIds.add(id));
          if (Array.isArray(c.levelLocationMappings)) {
            c.levelLocationMappings.forEach((m: any) => m?.locationId && allLocationIds.add(m.locationId));
          }
          if (c.sku) allSkus.add(c.sku);
          if (c.primarySku) allSkus.add(c.primarySku);
        });
      }
    });

    // ── Per-location-tag capacity (group items by their primary location tag) ──
    // Each item with a locationTag (or locationId used as tag) gets its own row.
    // For items without a tag we aggregate them under a synthetic key.
    const tagMap = new Map<string, { sku?: string; maxCapacity: number; usedCapacity: number }>();

    const addToTag = (tag: string, sku: string | undefined, max: number, used: number) => {
      if (!tag) return;
      const existing = tagMap.get(tag);
      if (existing) {
        existing.maxCapacity += max;
        existing.usedCapacity += used;
        if (sku && !existing.sku) existing.sku = sku;
      } else {
        tagMap.set(tag, { sku, maxCapacity: max, usedCapacity: used });
      }
    };

    items.forEach((item: any) => {
      const { maxCapacity, usedCapacity } = deriveItemCapacity(item);
      // Prefer explicit locationTag, fall back to locationId, then a generic label
      const tag: string =
        (item.locationTag || item.locationCode || item.locationId || item.primaryLocationId || '').toString().trim();
      const sku: string | undefined = (item.sku || item.primarySku || undefined);

      if (tag) {
        addToTag(tag, sku, maxCapacity, usedCapacity);
      } else if (Array.isArray(item.locationIds) && item.locationIds.length > 0) {
        // Distribute capacity evenly across each locationId
        const perTag = Math.max(1, item.locationIds.length);
        const maxPer = Math.ceil(maxCapacity / perTag);
        const usedPer = Math.ceil(usedCapacity / perTag);
        item.locationIds.forEach((id: any) => {
          if (id) addToTag(String(id), sku, maxPer, usedPer);
        });
      } else {
        // No tag at all — skip from per-location view but still count in totals
      }
    });

    const locationTagData = Array.from(tagMap.entries()).map(([locationId, data]) => {
      const cap = Math.max(1, data.maxCapacity);
      const used = Math.min(cap, data.usedCapacity);
      return {
        locationId,
        sku: data.sku,
        capacity: cap,
        usedCapacity: used,
        utilizationPercentage: Math.round((used / cap) * 100),
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

    // ── Location tag utilization: components with a locationTagId / total components ────
    const taggedComponents = items.filter((item: any) =>
      item.locationTagId != null && String(item.locationTagId).trim() !== ''
    ).length;
    const locationTagUtilization = items.length > 0
      ? Math.round((taggedComponents / items.length) * 100)
      : 0;

    return {
      totalLocations: allLocationIds.size,
      totalSkus: allSkus.size,
      totalAssets: items.length,
      totalComponents: items.length,
      locationTagData,
      totalShelves,
      fullShelves,
      emptyShelves,
      newlyAdded,
      slotFillRate,
      locationTagUtilization,
      taggedComponents,
      totalMax,
      totalUsed,
    };
  }, [layoutData]);

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
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            {layoutData?.name || 'Warehouse Layout'} - Overall Metrics
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
              <div style={labelStyle}>Total Locations</div>
              <div style={valueStyle}>{overviewData.totalLocations}</div>
            </div>
            <div>
              <div style={labelStyle}>Total SKUs</div>
              <div style={valueStyle}>{overviewData.totalSkus}</div>
            </div>
            <div>
              <div style={labelStyle}>Total Assets</div>
              <div style={valueStyle}>{overviewData.totalAssets}</div>
            </div>
            <div>
              <div style={labelStyle}>Components</div>
              <div style={valueStyle}>{overviewData.totalComponents}</div>
            </div>
          </div>
        </div>

        {/* Capacity & Utilization Section */}
        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} />
            Capacity & Utilization by Location
          </h4>
          
          {overviewData.locationTagData && overviewData.locationTagData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {overviewData.locationTagData.map((location, index) => (
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
                      {location.sku && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          SKU: {location.sku}
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
                      <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{location.capacity}</span>
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
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (overviewData.locationTagUtilization || 0) / 100)}`}
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
                {overviewData.locationTagUtilization}%
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              {overviewData.taggedComponents ?? 0} of {overviewData.totalComponents ?? 0} components tagged
            </div>
          </div>

          {/* Slot Fill Rate bar */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#94a3b8' }}>Slot Fill Rate</span>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{overviewData.slotFillRate ?? 0}% ({overviewData.totalUsed ?? 0}/{overviewData.totalMax ?? 0} slots)</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(215.3 25.1% 32.6%)', borderRadius: '3px' }}>
              <div style={{
                width: `${overviewData.slotFillRate ?? 0}%`,
                height: '100%',
                backgroundColor: (overviewData.slotFillRate ?? 0) > 80 ? '#22c55e' : (overviewData.slotFillRate ?? 0) > 50 ? '#f59e0b' : '#ef4444',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Shelf Statistics */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '500' }}>
              Shelf Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Total Shelves</span>
                <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{overviewData.totalShelves}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Empty Shelves</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>{overviewData.emptyShelves}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Full Shelves</span>
                <span style={{ color: '#22c55e', fontWeight: '600' }}>{overviewData.fullShelves}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Newly Added</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{overviewData.newlyAdded}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseOverviewPanel;
