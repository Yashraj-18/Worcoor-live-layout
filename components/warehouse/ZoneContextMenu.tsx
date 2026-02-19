// @ts-nocheck
'use client';

import React from 'react';
import { batchCreator } from '@/lib/warehouse/utils/batchCreator';
import showMessage from '@/lib/warehouse/utils/showMessage';

const ZoneContextMenu = ({ 
  isVisible, 
  x, 
  y, 
  zone, 
  onClose, 
  onAddUnits,
  onClearZone 
}) => {
  if (!isVisible || !zone) return null;

  const handleFillZone = () => {
    const units = batchCreator.createZoneLayout(zone, zone.zoneType);
    onAddUnits(units);
    onClose();
  };

  const handleFillOptimal = () => {
    const unitTemplate = {
      type: 'storage_bay',
      name: 'Storage Unit',
      defaultSize: { width: 25, height: 25 },
      color: '#00BCD4',
      icon: '▫',
      unitType: 'storage'
    };
    const units = batchCreator.fillZoneOptimally(zone, unitTemplate);
    onAddUnits(units);
    onClose();
  };

  const handleClear = () => {
    onClearZone(zone.id);
    onClose();
  };

  const menuStyle = {
    position: 'fixed',
    left: x,
    top: y,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '200px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  };

  const menuItemStyle = {
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee'
  };

  const menuItemHoverStyle = {
    backgroundColor: '#f5f5f5'
  };

  return (
    <div style={menuStyle}>
      <div 
        style={menuItemStyle}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        onClick={handleFillZone}
      >
        📦 Fill Zone ({zone.zoneType})
      </div>
      
      <div 
        style={menuItemStyle}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        onClick={handleFillOptimal}
      >
        🔄 Fill Optimally
      </div>
      
      <div 
        style={menuItemStyle}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        onClick={() => {
          const capacity = batchCreator.calculateZoneCapacity(zone, {
            defaultSize: { width: 25, height: 25 }
          });
          showMessage.info(`Zone ${zone.label} can hold up to ${capacity} units`);
          onClose();
        }}
      >
        📊 Show Capacity
      </div>
      
      <div 
        style={{...menuItemStyle, borderBottom: 'none', color: '#d32f2f'}}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#ffebee'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
        onClick={handleClear}
      >
        🗑️ Clear Zone
      </div>
    </div>
  );
};

export default ZoneContextMenu;

