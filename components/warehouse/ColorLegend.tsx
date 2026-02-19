// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { COLOR_LEGEND } from '@/lib/warehouse/utils/componentColors';

const ColorLegend = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const legendStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    maxWidth: '300px'
  };

  const headerStyle = {
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
    color: '#495057'
  };

  const contentStyle = {
    padding: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const categoryStyle = {
    marginBottom: '16px'
  };

  const categoryTitleStyle = {
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#343a40',
    fontSize: '13px'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '6px',
    padding: '4px 0'
  };

  const colorBoxStyle = (color) => ({
    width: '16px',
    height: '16px',
    backgroundColor: color,
    border: '1px solid #dee2e6',
    borderRadius: '3px',
    marginRight: '8px',
    flexShrink: 0
  });

  const itemTextStyle = {
    flex: 1
  };

  const itemNameStyle = {
    fontWeight: '500',
    color: '#495057'
  };

  const itemDescStyle = {
    color: '#6c757d',
    fontSize: '11px',
    marginTop: '2px'
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <span>🎨 Color Legend</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div style={contentStyle}>
          {Object.entries(COLOR_LEGEND).map(([categoryName, items]) => (
            <div key={categoryName} style={categoryStyle}>
              <div style={categoryTitleStyle}>{categoryName}</div>
              {Object.entries(items).map(([itemName, itemData]) => (
                <div key={itemName} style={itemStyle}>
                  <div style={colorBoxStyle(itemData.color)}></div>
                  <div style={itemTextStyle}>
                    <div style={itemNameStyle}>{itemName}</div>
                    <div style={itemDescStyle}>{itemData.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          <div style={{ 
            marginTop: '16px', 
            padding: '8px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '4px',
            fontSize: '11px',
            color: '#1565c0'
          }}>
            💡 <strong>Tip:</strong> Colors are automatically assigned based on component type to maintain consistency across your warehouse layout.
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorLegend;

