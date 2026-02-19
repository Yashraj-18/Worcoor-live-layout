// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  measurementSystem, 
  gridSystem, 
  areaCalculator,
  MEASUREMENT_UNITS,
  SCALE_PRESETS
} from '@/lib/warehouse/utils/measurementTools';

const MeasurementTools = ({ 
  isVisible, 
  onClose, 
  canvasRef, 
  zoomLevel = 1, 
  panOffset = { x: 0, y: 0 } 
}) => {
  const [activeMode, setActiveMode] = useState('none');
  const [measurements, setMeasurements] = useState([]);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [scale, setScale] = useState(measurementSystem.scale);
  const [unit, setUnit] = useState(measurementSystem.unit);
  const [gridVisible, setGridVisible] = useState(gridSystem.visible);
  const [snapEnabled, setSnapEnabled] = useState(gridSystem.snapEnabled);
  const [scalePreset, setScalePreset] = useState('1:100');
  const [customScale, setCustomScale] = useState('');

  const measurementRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (isVisible) {
      refreshMeasurements();
    }
  }, [isVisible]);

  useEffect(() => {
    measurementSystem.setScale(scale, unit);
    gridSystem.setVisible(gridVisible);
    gridSystem.setSnapEnabled(snapEnabled);
  }, [scale, unit, gridVisible, snapEnabled]);

  const refreshMeasurements = () => {
    setMeasurements(measurementSystem.getAllMeasurements());
  };

  const handleScalePresetChange = (preset) => {
    setScalePreset(preset);
    if (preset !== 'custom') {
      measurementSystem.setScaleFromPreset(preset);
      setScale(measurementSystem.scale);
    }
  };

  const handleCustomScaleChange = (value) => {
    setCustomScale(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      measurementSystem.setScale(numericValue, unit);
      setScale(numericValue);
    }
  };

  const getCanvasCoordinates = (clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (clientY - rect.top - panOffset.y) / zoomLevel;
    
    return snapEnabled ? gridSystem.snapPoint({ x, y }) : { x, y };
  };

  const handleCanvasMouseDown = (e) => {
    if (activeMode === 'measure') {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      setCurrentMeasurement({
        startPoint: point,
        endPoint: point
      });
      isDrawing.current = true;
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (activeMode === 'measure' && isDrawing.current && currentMeasurement) {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      setCurrentMeasurement({
        ...currentMeasurement,
        endPoint: point
      });
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (activeMode === 'measure' && isDrawing.current && currentMeasurement) {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      const finalMeasurement = measurementSystem.createMeasurement(
        `measurement_${Date.now()}`,
        currentMeasurement.startPoint,
        point
      );
      
      refreshMeasurements();
      setCurrentMeasurement(null);
      isDrawing.current = false;
    }
  };

  const deleteMeasurement = (id) => {
    measurementSystem.deleteMeasurement(id);
    refreshMeasurements();
  };

  const clearAllMeasurements = () => {
    measurementSystem.clearMeasurements();
    refreshMeasurements();
  };

  const exportMeasurements = () => {
    const data = measurementSystem.exportMeasurements();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="measurement-tools-overlay">
      <div className="measurement-tools">
        <div className="measurement-tools-header">
          <h3>Measurement Tools</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="measurement-tools-content">
          {/* Scale Configuration */}
          <div className="scale-section">
            <h4>Scale Configuration</h4>
            
            <div className="scale-presets">
              <label>Scale Preset:</label>
              <select 
                value={scalePreset} 
                onChange={(e) => handleScalePresetChange(e.target.value)}
              >
                {Object.entries(SCALE_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>{preset.name}</option>
                ))}
              </select>
            </div>

            {scalePreset === 'custom' && (
              <div className="custom-scale">
                <label>Pixels per {unit}:</label>
                <input
                  type="number"
                  value={customScale}
                  onChange={(e) => handleCustomScaleChange(e.target.value)}
                  placeholder="Enter scale value"
                />
              </div>
            )}

            <div className="unit-selection">
              <label>Unit:</label>
              <select 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)}
              >
                {Object.values(MEASUREMENT_UNITS).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="current-scale">
              Current Scale: {scale.toFixed(2)} px/{unit}
            </div>
          </div>

          {/* Grid Settings */}
          <div className="grid-section">
            <h4>Grid Settings</h4>
            
            <div className="grid-controls">
              <label>
                <input
                  type="checkbox"
                  checked={gridVisible}
                  onChange={(e) => setGridVisible(e.target.checked)}
                />
                Show Grid
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                />
                Snap to Grid
              </label>
            </div>

            <div className="grid-spacing">
              Grid Spacing: {gridSystem.getRealGridSpacing().major.toFixed(2)} {unit}
            </div>
          </div>

          {/* Measurement Tools */}
          <div className="tools-section">
            <h4>Measurement Tools</h4>
            
            <div className="tool-buttons">
              <button
                className={`tool-btn ${activeMode === 'measure' ? 'active' : ''}`}
                onClick={() => setActiveMode(activeMode === 'measure' ? 'none' : 'measure')}
              >
                📏 Measure Distance
              </button>
              
              <button
                className={`tool-btn ${activeMode === 'area' ? 'active' : ''}`}
                onClick={() => setActiveMode(activeMode === 'area' ? 'none' : 'area')}
              >
                📐 Measure Area
              </button>
            </div>

            {activeMode === 'measure' && (
              <div className="tool-instructions">
                Click and drag to measure distance between two points
              </div>
            )}

            {activeMode === 'area' && (
              <div className="tool-instructions">
                Click multiple points to define an area, double-click to finish
              </div>
            )}
          </div>

          {/* Current Measurement Display */}
          {currentMeasurement && (
            <div className="current-measurement">
              <h4>Current Measurement</h4>
              <div className="measurement-value">
                {measurementSystem.formatMeasurement(
                  measurementSystem.calculateRealDistance(
                    currentMeasurement.startPoint,
                    currentMeasurement.endPoint
                  )
                )}
              </div>
            </div>
          )}

          {/* Measurements List */}
          <div className="measurements-section">
            <div className="measurements-header">
              <h4>Measurements ({measurements.length})</h4>
              <div className="measurements-actions">
                <button onClick={clearAllMeasurements} disabled={measurements.length === 0}>
                  Clear All
                </button>
                <button onClick={exportMeasurements} disabled={measurements.length === 0}>
                  Export
                </button>
              </div>
            </div>

            <div className="measurements-list">
              {measurements.map(measurement => (
                <MeasurementItem
                  key={measurement.id}
                  measurement={measurement}
                  onDelete={deleteMeasurement}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Event Handlers */}
      {activeMode !== 'none' && (
        <div
          className="measurement-canvas-overlay"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          style={{ cursor: activeMode === 'measure' ? 'crosshair' : 'default' }}
        />
      )}
    </div>
  );
};

const MeasurementItem = ({ measurement, onDelete }) => {
  return (
    <div className="measurement-item">
      <div className="measurement-info">
        <div className="measurement-label">{measurement.label}</div>
        <div className="measurement-details">
          Start: ({measurement.startPoint.x.toFixed(1)}, {measurement.startPoint.y.toFixed(1)})
          <br />
          End: ({measurement.endPoint.x.toFixed(1)}, {measurement.endPoint.y.toFixed(1)})
        </div>
      </div>
      <button 
        className="delete-measurement-btn"
        onClick={() => onDelete(measurement.id)}
      >
        ×
      </button>
    </div>
  );
};

// Measurement overlay component for canvas rendering
export const MeasurementOverlay = ({ measurements, currentMeasurement, zoomLevel, panOffset }) => {
  return (
    <svg 
      className="measurement-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {/* Render existing measurements */}
      {measurements.map(measurement => (
        <g key={measurement.id}>
          <line
            x1={measurement.startPoint.x * zoomLevel + panOffset.x}
            y1={measurement.startPoint.y * zoomLevel + panOffset.y}
            x2={measurement.endPoint.x * zoomLevel + panOffset.x}
            y2={measurement.endPoint.y * zoomLevel + panOffset.y}
            stroke="#ff4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <circle
            cx={measurement.startPoint.x * zoomLevel + panOffset.x}
            cy={measurement.startPoint.y * zoomLevel + panOffset.y}
            r="4"
            fill="#ff4444"
          />
          <circle
            cx={measurement.endPoint.x * zoomLevel + panOffset.x}
            cy={measurement.endPoint.y * zoomLevel + panOffset.y}
            r="4"
            fill="#ff4444"
          />
          <text
            x={(measurement.startPoint.x + measurement.endPoint.x) / 2 * zoomLevel + panOffset.x}
            y={(measurement.startPoint.y + measurement.endPoint.y) / 2 * zoomLevel + panOffset.y - 10}
            fill="#ff4444"
            fontSize="12"
            textAnchor="middle"
            className="measurement-label"
          >
            {measurement.label}
          </text>
        </g>
      ))}

      {/* Render current measurement being drawn */}
      {currentMeasurement && (
        <g>
          <line
            x1={currentMeasurement.startPoint.x * zoomLevel + panOffset.x}
            y1={currentMeasurement.startPoint.y * zoomLevel + panOffset.y}
            x2={currentMeasurement.endPoint.x * zoomLevel + panOffset.x}
            y2={currentMeasurement.endPoint.y * zoomLevel + panOffset.y}
            stroke="#44ff44"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          <circle
            cx={currentMeasurement.startPoint.x * zoomLevel + panOffset.x}
            cy={currentMeasurement.startPoint.y * zoomLevel + panOffset.y}
            r="4"
            fill="#44ff44"
          />
          <circle
            cx={currentMeasurement.endPoint.x * zoomLevel + panOffset.x}
            cy={currentMeasurement.endPoint.y * zoomLevel + panOffset.y}
            r="4"
            fill="#44ff44"
          />
        </g>
      )}
    </svg>
  );
};

// Grid overlay component
export const GridOverlay = ({ viewBox, zoomLevel, panOffset }) => {
  if (!gridSystem.visible) return null;

  const gridLines = gridSystem.getGridLines(viewBox);

  return (
    <svg 
      className="grid-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      {gridLines.map((line, index) => (
        <line
          key={index}
          x1={line.orientation === 'vertical' ? line.position * zoomLevel + panOffset.x : line.start * zoomLevel + panOffset.x}
          y1={line.orientation === 'horizontal' ? line.position * zoomLevel + panOffset.y : line.start * zoomLevel + panOffset.y}
          x2={line.orientation === 'vertical' ? line.position * zoomLevel + panOffset.x : line.end * zoomLevel + panOffset.x}
          y2={line.orientation === 'horizontal' ? line.position * zoomLevel + panOffset.y : line.end * zoomLevel + panOffset.y}
          stroke={line.type === 'major' ? gridSystem.majorGridColor : gridSystem.minorGridColor}
          strokeWidth={line.type === 'major' ? 1 : 0.5}
        />
      ))}
    </svg>
  );
};

export default MeasurementTools;

