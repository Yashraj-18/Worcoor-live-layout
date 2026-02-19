// @ts-nocheck
'use client';

import React, { useState } from 'react';
import showMessage from '@/lib/warehouse/utils/showMessage';

const EnhancedToolbar = ({ 
  onFacilityManager,
  onMeasurementTools,
  onShapeLibrary,
  onImportCAD,
  onExportLayout,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleGrid,
  gridVisible,
  onToggleSnap,
  snapEnabled,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className="enhanced-toolbar">
      {/* Main Toolbar */}
      <div className="toolbar-section">
        <div className="toolbar-group">
          <button 
            className="toolbar-btn primary"
            onClick={onFacilityManager}
            title="Manage multi-level facilities"
          >
            🏢 Facilities
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={onMeasurementTools}
            title="Measurement and scale tools"
          >
            📏 Measure
          </button>
          
          <button 
            className="toolbar-btn"
            onClick={onShapeLibrary}
            title="Advanced shape library"
          >
            🔷 Shapes
          </button>
        </div>

        <div className="toolbar-separator"></div>

        {/* View Controls */}
        <div className="toolbar-group">
          <div className="zoom-controls">
            <button 
              className="toolbar-btn small"
              onClick={onZoomOut}
              title="Zoom out"
            >
              ➖
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button 
              className="toolbar-btn small"
              onClick={onZoomIn}
              title="Zoom in"
            >
              ➕
            </button>
            <button 
              className="toolbar-btn small"
              onClick={onZoomReset}
              title="Reset zoom"
            >
              🎯
            </button>
          </div>
        </div>

        <div className="toolbar-separator"></div>

        {/* Grid and Snap Controls */}
        <div className="toolbar-group">
          <button 
            className={`toolbar-btn ${gridVisible ? 'active' : ''}`}
            onClick={onToggleGrid}
            title="Toggle grid visibility"
          >
            ⊞ Grid
          </button>
          
          <button 
            className={`toolbar-btn ${snapEnabled ? 'active' : ''}`}
            onClick={onToggleSnap}
            title="Toggle snap to grid"
          >
            🧲 Snap
          </button>
        </div>

        <div className="toolbar-separator"></div>

        {/* Edit Controls */}
        <div className="toolbar-group">
          <button 
            className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last action"
          >
            ↶ Undo
          </button>
          
          <button 
            className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo last action"
          >
            ↷ Redo
          </button>
        </div>

        <div className="toolbar-separator"></div>

        {/* Import/Export */}
        <div className="toolbar-group">
          <div className="dropdown-container">
            <button 
              className="toolbar-btn dropdown-toggle"
              onClick={() => toggleDropdown('import')}
              title="Import options"
            >
              📥 Import ▼
            </button>
            
            {activeDropdown === 'import' && (
              <div className="dropdown-menu">
                <button onClick={onImportCAD}>
                  📐 Import CAD File
                </button>
                <button onClick={() => document.getElementById('import-layout').click()}>
                  📄 Import Layout
                </button>
                <button onClick={() => document.getElementById('import-measurements').click()}>
                  📏 Import Measurements
                </button>
              </div>
            )}
          </div>

          <div className="dropdown-container">
            <button 
              className="toolbar-btn dropdown-toggle"
              onClick={() => toggleDropdown('export')}
              title="Export options"
            >
              📤 Export ▼
            </button>
            
            {activeDropdown === 'export' && (
              <div className="dropdown-menu">
                <button onClick={() => onExportLayout('png')}>
                  🖼️ Export as PNG
                </button>
                <button onClick={() => onExportLayout('svg')}>
                  📊 Export as SVG
                </button>
                <button onClick={() => onExportLayout('pdf')}>
                  📄 Export as PDF
                </button>
                <button onClick={() => onExportLayout('json')}>
                  💾 Export Layout Data
                </button>
                <button onClick={() => onExportLayout('cad')}>
                  📐 Export to CAD
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scale Information */}
      <div className="scale-info">
        <span className="scale-label">Scale:</span>
        <span className="scale-value">1:100</span>
        <span className="unit-label">Units: m</span>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        id="import-layout"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          // Handle layout import
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const data = JSON.parse(event.target.result);
                // Import layout data
                console.log('Importing layout:', data);
              } catch (error) {
                showMessage.error('Invalid layout file format');
              }
            };
            reader.readAsText(file);
          }
        }}
      />

      <input
        type="file"
        id="import-measurements"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          // Handle measurements import
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const data = JSON.parse(event.target.result);
                // Import measurements data
                console.log('Importing measurements:', data);
              } catch (error) {
                showMessage.error('Invalid measurements file format');
              }
            };
            reader.readAsText(file);
          }
        }}
      />
    </div>
  );
};

export default EnhancedToolbar;

