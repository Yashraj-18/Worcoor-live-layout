'use client';

import React, { useMemo } from 'react';
import { TrendingUp, Package, Building } from 'lucide-react';

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

    // Count component types
    const storageUnits = items.filter((item: any) => item.type === 'storage_unit').length;
    const horizontalRacks = items.filter((item: any) => item.type === 'sku_holder').length;
    const verticalRacks = items.filter((item: any) => item.type === 'vertical_sku_holder').length;
    const zones = items.filter((item: any) => item.type === 'storage_zone' || item.type === 'warehouse_block').length;

    // Calculate capacity (simplified - would need real data in production)
    const totalCapacity = items.length * 100; // Assume 100 units per component
    const usedCapacity = Math.floor(totalCapacity * 0.65); // Assume 65% utilization
    const utilizationPercentage = Math.round((usedCapacity / totalCapacity) * 100);

    // Status counts (simplified - would use real status data)
    // Removed - Status Summary section not needed

    return {
      totalLocations: allLocationIds.size,
      totalSkus: allSkus.size,
      totalAssets: items.length,
      totalComponents: items.length,
      totalCapacity,
      usedCapacity,
      utilizationPercentage,
      storageUnits,
      horizontalRacks,
      verticalRacks,
      zones
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
            Capacity & Utilization
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={labelStyle}>Total Capacity</div>
              <div style={valueStyle}>{overviewData.totalCapacity}</div>
            </div>
            <div>
              <div style={labelStyle}>Used Capacity</div>
              <div style={valueStyle}>{overviewData.usedCapacity}</div>
            </div>
            <div style={{ ...labelStyle, gridColumn: '1 / -1' }}>Utilization</div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: overviewData.utilizationPercentage > 80 ? '#22c55e' : 
                       overviewData.utilizationPercentage > 50 ? '#f59e0b' : '#ef4444'
              }}>
                {overviewData.utilizationPercentage}%
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'hsl(215.3 25.1% 32.6%)', 
                borderRadius: '4px',
                marginTop: '0.5rem'
              }}>
                <div style={{
                  width: `${overviewData.utilizationPercentage}%`,
                  height: '100%',
                  backgroundColor: overviewData.utilizationPercentage > 80 ? '#22c55e' : 
                                 overviewData.utilizationPercentage > 50 ? '#f59e0b' : '#ef4444',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Breakdown Section */}
        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={16} />
            Component Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={labelStyle}>Storage Units</div>
              <div style={valueStyle}>{overviewData.storageUnits}</div>
            </div>
            <div>
              <div style={labelStyle}>Horizontal Racks</div>
              <div style={valueStyle}>{overviewData.horizontalRacks}</div>
            </div>
            <div>
              <div style={labelStyle}>Vertical Racks</div>
              <div style={valueStyle}>{overviewData.verticalRacks}</div>
            </div>
            <div>
              <div style={labelStyle}>Zones</div>
              <div style={valueStyle}>{overviewData.zones}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseOverviewPanel;
