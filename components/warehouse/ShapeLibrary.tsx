// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { shapeCreator, SHAPE_CATEGORIES, SHAPE_TYPES } from '@/lib/warehouse/utils/shapeCreator';
import showMessage from '@/lib/warehouse/utils/showMessage';

const ShapeLibrary = ({ isVisible, onClose, onShapeSelect }) => {
  const [activeCategory, setActiveCategory] = useState(SHAPE_CATEGORIES.BASIC);
  const [customShapes, setCustomShapes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isVisible) {
      refreshCustomShapes();
    }
  }, [isVisible]);

  const refreshCustomShapes = () => {
    setCustomShapes(shapeCreator.getCustomShapes());
  };

  const shapeLibrary = shapeCreator.getShapeLibrary();

  const getCurrentShapes = () => {
    if (activeCategory === SHAPE_CATEGORIES.CUSTOM) {
      return customShapes.filter(shape =>
        shape.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return shapeLibrary[activeCategory]?.filter(shape =>
      shape.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  };

  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);
    if (onShapeSelect) {
      onShapeSelect(shape);
    }
  };

  const handleCreateCustomShape = (formData) => {
    const customShape = shapeCreator.saveCustomShape(
      formData.name,
      formData.path,
      formData.dimensions,
      {
        icon: formData.icon,
        description: formData.description
      }
    );
    
    refreshCustomShapes();
    setShowCreateForm(false);
    setSelectedShape(customShape);
  };

  if (!isVisible) return null;

  return (
    <div className="shape-library-overlay">
      <div className="shape-library">
        <div className="shape-library-header">
          <h3>Shape Library</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="shape-library-content">
          {/* Category Navigation */}
          <div className="category-navigation">
            {Object.values(SHAPE_CATEGORIES).map(category => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
                {category === SHAPE_CATEGORIES.CUSTOM && customShapes.length > 0 && (
                  <span className="count">({customShapes.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="shape-actions">
            <input
              type="text"
              placeholder="Search shapes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {activeCategory === SHAPE_CATEGORIES.CUSTOM && (
              <button
                className="create-btn"
                onClick={() => setShowCreateForm(true)}
              >
                Create Custom Shape
              </button>
            )}
          </div>

          {/* Shape Grid */}
          <div className="shapes-grid">
            {getCurrentShapes().map(shape => (
              <ShapeCard
                key={shape.type || shape.id}
                shape={shape}
                isSelected={selectedShape?.type === shape.type || selectedShape?.id === shape.id}
                onSelect={handleShapeSelect}
                isCustom={activeCategory === SHAPE_CATEGORIES.CUSTOM}
              />
            ))}
          </div>

          {/* Shape Details */}
          {selectedShape && (
            <ShapeDetails
              shape={selectedShape}
              onUse={() => {
                if (onShapeSelect) {
                  onShapeSelect(selectedShape);
                }
              }}
            />
          )}
        </div>

        {/* Create Custom Shape Form */}
        {showCreateForm && (
          <CustomShapeForm
            onSubmit={handleCreateCustomShape}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
};

const ShapeCard = ({ shape, isSelected, onSelect, isCustom }) => {
  const previewSize = 60;
  
  return (
    <div 
      className={`shape-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(shape)}
    >
      <div className="shape-preview">
        <div className="shape-icon">{shape.icon}</div>
        {shape.path && (
          <svg width={previewSize} height={previewSize} viewBox="0 0 100 100">
            <path
              d={shape.path}
              fill="#e3f2fd"
              stroke="#1976d2"
              strokeWidth="2"
              transform="scale(0.8) translate(10, 10)"
            />
          </svg>
        )}
      </div>
      
      <div className="shape-info">
        <h4>{shape.name}</h4>
        <p>{shape.description}</p>
        {shape.defaultSize && (
          <div className="shape-size">
            {shape.defaultSize.width} × {shape.defaultSize.height}
          </div>
        )}
        {isCustom && (
          <div className="custom-badge">Custom</div>
        )}
      </div>
    </div>
  );
};

const ShapeDetails = ({ shape, onUse }) => {
  return (
    <div className="shape-details">
      <div className="shape-details-header">
        <h4>Shape Details</h4>
        <button className="use-shape-btn" onClick={onUse}>
          Use Shape
        </button>
      </div>

      <div className="shape-details-content">
        <div className="detail-row">
          <label>Name:</label>
          <span>{shape.name}</span>
        </div>
        
        <div className="detail-row">
          <label>Type:</label>
          <span>{shape.type}</span>
        </div>
        
        <div className="detail-row">
          <label>Description:</label>
          <span>{shape.description}</span>
        </div>

        {shape.defaultSize && (
          <div className="detail-row">
            <label>Default Size:</label>
            <span>{shape.defaultSize.width} × {shape.defaultSize.height} px</span>
          </div>
        )}

        {shape.createdAt && (
          <div className="detail-row">
            <label>Created:</label>
            <span>{new Date(shape.createdAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Shape Preview */}
        <div className="shape-large-preview">
          <svg width="200" height="150" viewBox="0 0 200 150">
            {shape.path && (
              <path
                d={shape.path}
                fill="#e3f2fd"
                stroke="#1976d2"
                strokeWidth="2"
                transform="scale(1.5) translate(20, 20)"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

const CustomShapeForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '⭐',
    path: '',
    dimensions: { width: 100, height: 100 }
  });

  const [drawingPoints, setDrawingPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let finalPath = formData.path;
    
    // If drawing points exist, convert to path
    if (drawingPoints.length > 0) {
      finalPath = pointsToPath(drawingPoints);
    }
    
    if (!finalPath) {
      showMessage.warning('Please provide a path or draw a shape');
      return;
    }

    onSubmit({
      ...formData,
      path: finalPath
    });
  };

  const pointsToPath = (points) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += ' Z';
    
    return path;
  };

  const handleCanvasClick = (e) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawingPoints(prev => [...prev, { x, y }]);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    const path = pointsToPath(drawingPoints);
    setFormData(prev => ({ ...prev, path }));
  };

  const clearDrawing = () => {
    setDrawingPoints([]);
    setFormData(prev => ({ ...prev, path: '' }));
  };

  return (
    <div className="custom-shape-form-overlay">
      <div className="custom-shape-form">
        <h3>Create Custom Shape</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Icon (emoji):</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              maxLength="2"
            />
          </div>

          <div className="form-group">
            <label>SVG Path:</label>
            <textarea
              value={formData.path}
              onChange={(e) => setFormData({...formData, path: e.target.value})}
              placeholder="Enter SVG path data or use the drawing canvas below"
              rows="3"
            />
          </div>

          {/* Drawing Canvas */}
          <div className="drawing-section">
            <h4>Or Draw Your Shape:</h4>
            <div className="drawing-controls">
              <button type="button" onClick={startDrawing} disabled={isDrawing}>
                Start Drawing
              </button>
              <button type="button" onClick={finishDrawing} disabled={!isDrawing}>
                Finish Drawing
              </button>
              <button type="button" onClick={clearDrawing}>
                Clear
              </button>
            </div>
            
            <div 
              className={`drawing-canvas ${isDrawing ? 'active' : ''}`}
              onClick={handleCanvasClick}
              style={{
                width: '300px',
                height: '200px',
                border: '2px dashed #ccc',
                position: 'relative',
                cursor: isDrawing ? 'crosshair' : 'default'
              }}
            >
              <svg width="100%" height="100%">
                {drawingPoints.length > 0 && (
                  <>
                    <path
                      d={pointsToPath(drawingPoints)}
                      fill="rgba(25, 118, 210, 0.1)"
                      stroke="#1976d2"
                      strokeWidth="2"
                    />
                    {drawingPoints.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        fill="#1976d2"
                      />
                    ))}
                  </>
                )}
              </svg>
              
              {isDrawing && (
                <div className="drawing-instructions">
                  Click to add points. Click "Finish Drawing" when done.
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {formData.path && (
            <div className="shape-preview-section">
              <h4>Preview:</h4>
              <svg width="150" height="100" viewBox="0 0 150 100">
                <path
                  d={formData.path}
                  fill="#e3f2fd"
                  stroke="#1976d2"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}

          <div className="form-actions">
            <button type="submit">Create Shape</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShapeLibrary;

