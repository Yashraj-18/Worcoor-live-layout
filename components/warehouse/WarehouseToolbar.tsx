// @ts-nocheck
'use client';

import React from 'react';

const WarehouseToolbar = ({ 
  onCreateBoundary, 
  onAddZone, 
  onAddUnits, 
  onShowProperties, 
  onSave,
  selectedZone,
  mode,
  onModeChange,
  onBack,
  showLabels, // full
  onToggleLabels,
  onBulkLabelEdit,
  onAutoGenerateBoundary
}) => {
  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    gap: '8px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '6px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'
  };

  const separatorStyle = {
    width: '1px',
    height: '24px',
    backgroundColor: '#dee2e6',
    margin: '0 8px'
  };

  const backButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white',
    borderColor: '#6c757d',
    fontWeight: 'bold'
  };

  return (
    <div style={toolbarStyle}>
      {/* Back Button */}
      {onBack && (
        <>
          <button style={backButtonStyle} onClick={onBack}>
            ← Back to Dashboard
          </button>
          <div style={separatorStyle}></div>
        </>
      )}
      
      {/* Mode Selection */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          style={mode === 'boundary' ? activeButtonStyle : buttonStyle}
          onClick={() => onModeChange('boundary')}
        >
          📐 Create Boundary
        </button>
        <button 
          style={buttonStyle}
          onClick={onAutoGenerateBoundary}
          title="Automatically generate boundary around all components"
        >
          ⬜ Auto-Boundary
        </button>
        <button 
          style={mode === 'zone' ? activeButtonStyle : buttonStyle}
          onClick={() => onModeChange('zone')}
        >
          📦 Add Zone
        </button>
        <button 
          style={mode === 'unit' ? activeButtonStyle : buttonStyle}
          onClick={() => onModeChange('unit')}
          disabled={!selectedZone}
        >
          ▢ Add Units
        </button>
      </div>

      <div style={separatorStyle}></div>

      {/* Zone Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          style={buttonStyle}
          onClick={onShowProperties}
          disabled={!selectedZone}
        >
          ⚙️ Properties
        </button>
        <button 
          style={buttonStyle}
          onClick={() => {
            if (selectedZone) {
              // Auto-fill selected zone
              onAddUnits('auto-fill');
            }
          }}
          disabled={!selectedZone}
        >
          🔄 Fill Zone
        </button>
      </div>

      <div style={separatorStyle}></div>

      {/* Label Management */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          style={showLabels ? activeButtonStyle : buttonStyle}
          onClick={onToggleLabels}
          title="Toggle label visibility"
        >
          🏷️ Labels
        </button>
        <button 
          style={buttonStyle}
          onClick={onBulkLabelEdit}
          title="Bulk edit labels"
        >
          📝 Bulk Edit
        </button>
      </div>

      <div style={separatorStyle}></div>

      {/* File Operations */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button style={buttonStyle} onClick={onSave}>
          💾 Save
        </button>
        <button style={buttonStyle}>
          📁 Load
        </button>
        <button style={buttonStyle}>
          📤 Export
        </button>
      </div>

      <div style={separatorStyle}></div>

      {/* Status Info */}
      <div style={{ marginLeft: 'auto', color: '#6c757d', fontSize: '12px' }}>
        {selectedZone ? (
          <span>Selected: <strong>{selectedZone.name}</strong> ({selectedZone.type})</span>
        ) : (
          <span>No zone selected</span>
        )}
      </div>
    </div>
  );
};

export default WarehouseToolbar;

