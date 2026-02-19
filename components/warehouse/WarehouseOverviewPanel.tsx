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

const WarehouseOverviewPanel = ({ layoutData }: { layoutData: WarehouseLayoutData }) => {
  // Calculate overview data from layout items
  const overviewData = useMemo(() => {
    if (!layoutData?.items) {
      return {
        totalLocations: 0,
        totalSkus: 0,
        totalAssets: 0,
        totalComponents: 0,
        totalCapacity: 0,
        usedCapacity: 0,
        utilizationPercentage: 0,
        storageUnits: 0,
        horizontalRacks: 0,
        verticalRacks: 0,
        zones: 0
      };
    }

    const items = layoutData.items;
    const allLocationIds = new Set();
    const allSkus = new Set();

    // Extract location IDs and SKUs from all components
    items.forEach((item: any) => {
      // Single location ID
      if (item.locationId) {
        allLocationIds.add(item.locationId);
      }
      
      // Multiple location IDs (vertical racks)
      if (item.locationIds && Array.isArray(item.locationIds)) {
        item.locationIds.forEach((id: any) => allLocationIds.add(id));
      }
      
      // Compartment contents
      if (item.compartmentContents) {
        Object.values(item.compartmentContents).forEach((compartment: any) => {
          if (compartment.locationId) {
            allLocationIds.add(compartment.locationId);
          }
          if (compartment.locationIds && Array.isArray(compartment.locationIds)) {
            compartment.locationIds.forEach((id: any) => allLocationIds.add(id));
          }
          if (compartment.sku) {
            allSkus.add(compartment.sku);
          }
        });
      }
      
      // SKU information
      if (item.sku) {
        allSkus.add(item.sku);
      }
    });

    
    // Calculate capacity and utilization for each location tag
    const locationTagData: Array<{
      locationId: string;
      sku?: string;
      capacity: number;
      usedCapacity: number;
      utilizationPercentage: number;
    }> = [];
    
    // Extract location tags and their SKUs
    const locationMap = new Map<string, { sku?: string; items: any[] }>();
    
    items.forEach((item: any) => {
      // Single location ID
      if (item.locationId) {
        if (!locationMap.has(item.locationId)) {
          locationMap.set(item.locationId, { items: [] });
        }
        locationMap.get(item.locationId)!.items.push(item);
        if (item.sku) {
          locationMap.get(item.locationId)!.sku = item.sku;
        }
      }
      
      // Multiple location IDs (vertical racks)
      if (item.locationIds && Array.isArray(item.locationIds)) {
        item.locationIds.forEach((id: any) => {
          if (!locationMap.has(id)) {
            locationMap.set(id, { items: [] });
          }
          locationMap.get(id)!.items.push(item);
          if (item.compartmentContents && item.compartmentContents[id]) {
            const compartment = item.compartmentContents[id];
            if (compartment.sku) {
              locationMap.get(id)!.sku = compartment.sku;
            }
          }
        });
      }
      
      // Compartment contents
      if (item.compartmentContents) {
        Object.entries(item.compartmentContents).forEach(([key, compartment]: [string, any]) => {
          if (compartment.locationId) {
            if (!locationMap.has(compartment.locationId)) {
              locationMap.set(compartment.locationId, { items: [] });
            }
            locationMap.get(compartment.locationId)!.items.push(compartment);
            if (compartment.sku) {
              locationMap.get(compartment.locationId)!.sku = compartment.sku;
            }
          }
        });
      }
    });
    
    // Calculate utilization for each location
    locationMap.forEach((data, locationId) => {
      const capacity = data.items.length * 100; // 100 units per item
      const usedCapacity = Math.floor(capacity * (0.3 + Math.random() * 0.7)); // Random utilization between 30-100%
      const utilizationPercentage = Math.round((usedCapacity / capacity) * 100);
      
      locationTagData.push({
        locationId,
        sku: data.sku,
        capacity,
        usedCapacity,
        utilizationPercentage
      });
    });
    
    // Sort by utilization percentage (highest first)
    locationTagData.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    // Calculate shelf statistics
    const totalShelves = items.length || 0;
    const fullShelves = Math.floor(totalShelves * 0.35) || 0; // 35% full shelves
    const emptyShelves = Math.floor(totalShelves * 0.57) || 0; // 57% empty shelves
    const newlyAdded = Math.floor(totalShelves * 0.08) || 0; // 8% newly added
    const locationTagUsage = 56; // Fixed percentage as specified

    // Status counts (simplified - would use real status data)
    // Removed - Status Summary section not needed

    return {
      totalLocations: allLocationIds.size,
      totalSkus: allSkus.size,
      totalAssets: items.length,
      totalComponents: items.length,
      locationTagData,
      totalShelves: totalShelves || 0,
      fullShelves: fullShelves || 0,
      emptyShelves: emptyShelves || 0,
      newlyAdded: newlyAdded || 0,
      locationTagUsage: locationTagUsage || 0
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

        {/* Per Shelf Utilization Section */}
        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} />
            Per Shelf Utilization
          </h4>
          
          {/* Location Tag Usage with Ring Widget */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Location Tag Usage
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
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (overviewData.locationTagUsage || 0) / 100)}`}
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
                {overviewData.locationTagUsage}%
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              of location/storage space is currently being used
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
