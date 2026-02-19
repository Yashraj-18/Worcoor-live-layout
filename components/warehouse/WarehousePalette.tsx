// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';

const DraggableComponent = ({ component, isActive }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: component,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    margin: '2px 0',
    backgroundColor: isActive ? '#e3f2fd' : 'white',
    border: `1px solid ${isActive ? '#2196f3' : '#e0e0e0'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    opacity: isDragging ? 0.5 : 1,
    fontSize: '13px',
    fontWeight: '500'
  };

  return (
    <div ref={drag} style={itemStyle}>
      <span style={{ marginRight: '8px', fontSize: '16px' }}>{component.icon}</span>
      <span>{component.name}</span>
    </div>
  );
};

const WarehousePalette = ({ mode, onComponentSelect }) => {
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Empty arrays for now - will be built step by step
  const zoneTypes = [
    // Zone types will be added here as we build them
  ];

  const unitTypes = [
    // Unit types will be added here as we build them
  ];

  const paletteStyle = {
    width: '250px',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #dee2e6',
    padding: '16px',
    fontFamily: 'Arial, sans-serif',
    overflow: 'auto'
  };

  const sectionStyle = {
    marginBottom: '24px'
  };

  const sectionHeaderStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: '8px',
    padding: '4px 0',
    borderBottom: '2px solid #dee2e6'
  };

  const instructionStyle = {
    fontSize: '12px',
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px'
  };

  const getInstructionText = () => {
    switch (mode) {
      case 'boundary':
        return 'Click "Create Boundary" to draw warehouse perimeter';
      case 'zone':
        return 'Drag zone types to canvas to create areas';
      case 'unit':
        return 'Select a zone first, then drag units into it';
      default:
        return 'Select a mode from the toolbar to begin';
    }
  };

  return (
    <div style={paletteStyle}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#343a40' }}>
        Component Palette
      </h3>
      
      <div style={instructionStyle}>
        {getInstructionText()}
      </div>

      {/* Zone Types Section */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          📦 Zone Types
        </div>
        {zoneTypes.length === 0 ? (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '12px',
            fontStyle: 'italic',
            backgroundColor: '#f8f9fa',
            border: '1px dashed #dee2e6',
            borderRadius: '4px'
          }}>
            No zone types available yet
          </div>
        ) : (
          zoneTypes.map(component => (
            <DraggableComponent
              key={component.id}
              component={component}
              isActive={mode === 'zone' && selectedComponent?.id === component.id}
            />
          ))
        )}
      </div>

      {/* Unit Types Section */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          📋 Unit Types
        </div>
        {unitTypes.length === 0 ? (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '12px',
            fontStyle: 'italic',
            backgroundColor: '#f8f9fa',
            border: '1px dashed #dee2e6',
            borderRadius: '4px'
          }}>
            No unit types available yet
          </div>
        ) : (
          unitTypes.map(component => (
            <DraggableComponent
              key={component.id}
              component={component}
              isActive={mode === 'unit' && selectedComponent?.id === component.id}
            />
          ))
        )}
      </div>

      {/* Batch Creation Tools */}
      {mode === 'unit' && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            🔧 Batch Tools
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              Fill 3x4 Grid
            </button>
            <button style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              Fill 2x6 Grid
            </button>
            <button style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}>
              Custom Grid...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehousePalette;

