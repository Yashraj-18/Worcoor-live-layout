// @ts-nocheck
import React, { useMemo } from 'react';
import { OCCUPANCY_STATUS, STATUS_COLORS, STORAGE_ORIENTATION, ORIENTATION_COLORS } from '../../lib/warehouse/constants/warehouseComponents';

const Dashboard = ({ items, isVisible, onToggle }) => {
  const metrics = useMemo(() => {
    const totalItems = items.length;
    const totalCapacity = items.reduce((sum, item) => sum + (item.inventoryData?.capacity || 0), 0);
    const totalUtilized = items.reduce((sum, item) => 
      sum + ((item.inventoryData?.capacity || 0) * (item.inventoryData?.utilization || 0)), 0
    );
    
    const statusCounts = items.reduce((counts, item) => {
      const status = item.occupancyStatus || OCCUPANCY_STATUS.EMPTY;
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});

    const orientationCounts = items.reduce((counts, item) => {
      const orientation = item.storageOrientation || STORAGE_ORIENTATION.HORIZONTAL;
      counts[orientation] = (counts[orientation] || 0) + 1;
      return counts;
    }, {});

    const totalSKUs = items.reduce((sum, item) => 
      sum + (item.inventoryData?.inventory?.length || 0), 0
    );

    const totalStacks = items.filter(item => 
      item.stack && item.stack.layers && item.stack.layers.length > 1
    ).length;

    const averageUtilization = totalItems > 0 ? 
      items.reduce((sum, item) => sum + (item.inventoryData?.utilization || 0), 0) / totalItems : 0;

    const recentActivity = items
      .filter(item => item.inventoryData?.lastActivity)
      .sort((a, b) => new Date(b.inventoryData.lastActivity) - new Date(a.inventoryData.lastActivity))
      .slice(0, 5);

    return {
      totalItems,
      totalCapacity,
      totalUtilized,
      utilizationRate: totalCapacity > 0 ? totalUtilized / totalCapacity : 0,
      statusCounts,
      orientationCounts,
      totalSKUs,
      totalStacks,
      averageUtilization,
      recentActivity
    };
  }, [items]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="animate-fade-in"
        style={{
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          fontSize: '1.3rem',
          transition: 'var(--transition-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1) translateY(-2px)';
          e.target.style.boxShadow = 'var(--shadow-2xl)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) translateY(0)';
          e.target.style.boxShadow = 'var(--shadow-xl)';
        }}
      >
        📊
      </button>
    );
  }

  const dashboardStyle = {
    position: 'fixed',
    top: '80px',
    right: '20px',
    width: '380px',
    maxHeight: '85vh',
    backgroundColor: 'white',
    border: '1px solid var(--gray-300)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-2xl)',
    zIndex: 1000,
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%)',
    color: 'white',
    padding: 'var(--spacing-5)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const contentStyle = {
    padding: '1rem',
    maxHeight: 'calc(80vh - 80px)',
    overflow: 'auto'
  };

  const metricCardStyle = {
    background: 'linear-gradient(135deg, var(--gray-50), var(--gray-100))',
    padding: 'var(--spacing-4)',
    borderRadius: 'var(--radius-xl)',
    marginBottom: 'var(--spacing-4)',
    border: '1px solid var(--gray-200)',
    transition: 'var(--transition-normal)',
    cursor: 'pointer'
  };

  const MetricCard = ({ title, value, subtitle, color, icon }) => (
    <div style={metricCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color || '#333' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.7rem', color: '#666' }}>
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div style={{ fontSize: '2rem', opacity: 0.7 }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const StatusBar = ({ label, counts, colors }) => (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
        {Object.entries(counts).map(([status, count]) => {
          const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return percentage > 0 ? (
            <div
              key={status}
              style={{
                width: `${percentage}%`,
                backgroundColor: colors[status] || '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}
              title={`${status}: ${count} (${percentage.toFixed(1)}%)`}
            >
              {count}
            </div>
          ) : null;
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
        {Object.entries(counts).map(([status, count]) => (
          <span key={status}>
            {status}: {count}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div style={dashboardStyle} className="animate-slide-up">
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>📊 Dashboard</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            Real-time warehouse metrics
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={contentStyle}>
        {/* Key Metrics */}
        <MetricCard
          title="Total Locations"
          value={metrics.totalItems}
          subtitle="Active warehouse locations"
          icon="🏭"
        />

        <MetricCard
          title="Space Utilization"
          value={`${Math.round(metrics.utilizationRate * 100)}%`}
          subtitle={`${Math.round(metrics.totalUtilized)} / ${Math.round(metrics.totalCapacity)} capacity`}
          color={metrics.utilizationRate > 0.8 ? '#F44336' : metrics.utilizationRate > 0.6 ? '#FF9800' : '#4CAF50'}
          icon="📦"
        />

        <MetricCard
          title="Active SKUs"
          value={metrics.totalSKUs}
          subtitle="Unique products in inventory"
          icon="🏷️"
        />

        <MetricCard
          title="Stacked Locations"
          value={metrics.totalStacks}
          subtitle="Multi-layer storage areas"
          icon="📚"
        />

        {/* Status Distribution */}
        <StatusBar
          label="Occupancy Status"
          counts={metrics.statusCounts}
          colors={STATUS_COLORS}
        />

        {/* Storage Orientation */}
        <StatusBar
          label="Storage Orientation"
          counts={metrics.orientationCounts}
          colors={ORIENTATION_COLORS}
        />

        {/* Recent Activity */}
        {metrics.recentActivity.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
              🕒 Recent Activity
            </div>
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
              {metrics.recentActivity.map((item, index) => (
                <div key={item.id} style={{
                  padding: '0.5rem',
                  background: index % 2 === 0 ? '#f8f9fa' : 'white',
                  borderRadius: '4px',
                  marginBottom: '0.25rem',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {item.locationCode} - {item.name}
                  </div>
                  <div style={{ color: '#666' }}>
                    {new Date(item.inventoryData.lastActivity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Indicators */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e8f5e8', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2e7d32' }}>
            ⚡ Performance
          </div>
          <div style={{ fontSize: '0.8rem', color: '#2e7d32' }}>
            <div>Average Utilization: {Math.round(metrics.averageUtilization * 100)}%</div>
            <div>Efficiency Rating: {metrics.utilizationRate > 0.7 ? 'High' : metrics.utilizationRate > 0.4 ? 'Medium' : 'Low'}</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          marginTop: '1rem', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '0.5rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f0f8ff', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
              {Object.values(metrics.statusCounts)[0] || 0}
            </div>
            <div style={{ color: '#666' }}>Available</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', background: '#fff3e0', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', color: '#f57c00' }}>
              {Math.round((metrics.totalSKUs / Math.max(metrics.totalItems, 1)) * 10) / 10}
            </div>
            <div style={{ color: '#666' }}>SKUs/Location</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
