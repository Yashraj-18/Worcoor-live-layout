'use client';

import React, { useState, useCallback } from 'react';
import SkuIdSelector from './SkuIdSelector';
import { getContextualLabel, generateStorageUnitLabelInfo } from '@/lib/warehouse/utils/componentLabeling';
import showMessage from '@/lib/warehouse/utils/showMessage';
import globalIdCache from '@/lib/warehouse/utils/globalIdCache';
import { getLucideIcon, getCategoryIcon, getIconSize, getIconColor } from '@/lib/warehouse/constants/lucideIconMapping';
import { Settings, X, MapPin, Tag, Package, Archive, Building, UsersRound, Star, Palette, Maximize2, Move, Shield, Zap, Users, Lock, Target } from 'lucide-react';

const normalizeHexColor = (value: string, fallback: string = '#8D6E63'): string => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  let hex = value.trim();
  if (!hex.startsWith('#')) {
    hex = `#${hex}`;
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex.toUpperCase();
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    const expanded = hex
      .substring(1)
      .split('')
      .map((char) => char + char)
      .join('');
    return `#${expanded.toUpperCase()}`;
  }

  return fallback;
};


interface PropertiesPanelProps {
  selectedItem: any;
  onUpdateItem: (id: string, updates: any) => void;
  onDeleteItem: (id: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem, onUpdateItem, onDeleteItem }) => {
  const [skuIdSelectorVisible, setSkuIdSelectorVisible] = useState(false);
  const [pendingCompartmentId, setPendingCompartmentId] = useState<string | null>(null);

  // Get appropriate icon for the selected item
  const getItemIcon = () => {
    if (selectedItem?.type) {
      return getLucideIcon(selectedItem.type);
    }
    return Settings;
  };

  const ItemIcon = getItemIcon();

  if (!selectedItem) {
    return (
      <div className="properties-panel animate-slide-right">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '16px 24px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={20} color="#94a3b8" />
            <span style={{ 
              margin: 0, 
              color: '#e2e8f0', 
              fontSize: '18px', 
              fontWeight: '500'
            }}>Properties</span>
          </div>
        </div>
        <div style={{ 
          textAlign: 'center', 
          color: '#94a3b8', 
          marginTop: 'var(--spacing-8)',
          fontSize: 'var(--font-size-sm)',
          padding: 'var(--spacing-6)',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed rgba(148, 163, 184, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)', display: 'flex', justifyContent: 'center' }}>
            <Target size={48} color="#64748b" />
          </div>
          <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-1)', color: '#e2e8f0' }}>No Selection</div>
          <div style={{ color: '#64748b' }}>Click on any warehouse item to view and edit its properties</div>
        </div>
      </div>
    );
  }

  const handleInputChange = (property: string, value: any) => {
    onUpdateItem(selectedItem.id, { [property]: value });
  };

  // Get all existing SKU IDs from the selected item
  const getExistingSkuIds = (): string[] => {
    if (!selectedItem.compartmentContents) return [];
    return Object.values(selectedItem.compartmentContents)
      .map((item: any) => item.locationId || item.uniqueId)
      .filter(Boolean) as string[];
  };

  // Handle SKU ID selection from dropdown
  const handleSkuIdSelect = (skuIdOrData: string | { locationId: string; category: string }) => {
    if (!pendingCompartmentId) return;
    
    const parts = pendingCompartmentId.split('-');
    if (parts.length < 2) return;
    
    const row = Math.floor(parseInt(parts[1]) / (selectedItem.width / 60));
    const col = parseInt(parts[1]) % (selectedItem.width / 60);
    
    // Extract location ID and category from the data
    const locationId = typeof skuIdOrData === 'string' ? skuIdOrData : skuIdOrData.locationId;
    const category = typeof skuIdOrData === 'string' ? '' : skuIdOrData.category;
    
    const newContents = { 
      ...selectedItem.compartmentContents, 
      [pendingCompartmentId]: { 
        locationId: locationId,
        uniqueId: locationId, // Keep for backward compatibility
        sku: locationId, // Use the selected SKU ID as the SKU
        quantity: 1,
        status: 'planned',
        category: category,
        lastModified: new Date().toISOString()
      }
    };
    
    onUpdateItem(selectedItem.id, { compartmentContents: newContents });
    setSkuIdSelectorVisible(false);
    setPendingCompartmentId(null);
  };

  const handleSkuIdSelectorClose = () => {
    setSkuIdSelectorVisible(false);
    setPendingCompartmentId(null);
  };

  const handleNumberChange = (property: string, value: string) => {
    // Check if the property is locked
    if ((property === 'x' || property === 'y') && selectedItem.isPositionLocked) {
      return; // Don't update position if position is locked
    }
    if ((property === 'width' || property === 'height') && selectedItem.isSizeLocked) {
      return; // Don't update size if size is locked
    }
    
    let numValue = parseInt(value) || 0;
    
    // Handle grid-based positioning for ALL components
    if (property === 'x' || property === 'y') {
      // Determine grid size based on component type and properties
      let gridSize = 15; // Default sub-grid for most components
      
      if (selectedItem.type === 'solid_boundary' || selectedItem.type === 'dotted_boundary') {
        // Boundary components use 15px grid for precise positioning
        gridSize = 15;
      } else if (selectedItem.gridStep) {
        // Use component's specific grid step if defined
        gridSize = selectedItem.gridStep;
      } else if (selectedItem.type === 'square_boundary' || selectedItem.gridAligned) {
        // Use major grid for floor plan components
        gridSize = 60;
      }
      
      // Snap to grid
      numValue = Math.round(numValue / gridSize) * gridSize;
      
      // Ensure minimum position (0 or positive)
      numValue = Math.max(0, numValue);
    }
    
    // Handle grid-based sizing for components with gridStep property
    if ((property === 'width' || property === 'height') && selectedItem.gridStep) {
      const gridStep = selectedItem.gridStep;
      
      // Round to nearest grid step
      numValue = Math.round(numValue / gridStep) * gridStep;
      
      // Ensure minimum size constraints
      if (selectedItem.minSize) {
        const minValue = selectedItem.minSize[property];
        if (minValue && numValue < minValue) {
          numValue = minValue;
        }
      }
      
      // Ensure maximum size constraints
      if (selectedItem.maxSize) {
        const maxValue = selectedItem.maxSize[property];
        if (maxValue && numValue > maxValue) {
          numValue = maxValue;
        }
      }
      
      // Ensure minimum grid step
      if (numValue < gridStep) {
        numValue = gridStep;
      }
    }
    
    if (numValue >= 0) {
      onUpdateItem(selectedItem.id, { [property]: numValue });
    }
  };

  const handleDelete = () => {
    onDeleteItem(selectedItem.id);
    showMessage.success('Item deleted successfully');
  };

  // Helper function to generate unique Location ID
  const generateUniqueLocationId = (itemName: string, row: number, col: number, totalCols: number): string => {
    // Extract zone/unit identifier from item name or use default
    const unitPrefix = itemName ? itemName.replace(/[^A-Z0-9]/g, '').substring(0, 3) || 'STG' : 'STG';
    const zone = String.fromCharCode(65 + (Math.floor((row + col) / 4) % 26)); // A, B, C, etc.
    const aisle = String(Math.floor((row + col) / 2) + 1).padStart(2, '0'); // 01, 02, etc.
    const position = String((row * totalCols + col) + 1).padStart(3, '0'); // 001, 002, etc.
    return `${unitPrefix}-${zone}${aisle}-${position}`;
  };

  // Helper function to update SKU metadata with global ID cache validation
  const updateSkuMetadata = (compartmentId: string, updates: any) => {
    const currentContents = selectedItem.compartmentContents || {};
    const currentSku = currentContents[compartmentId] || {};
    
    // If updating locationId, validate uniqueness using global cache
    if (updates.locationId) {
      const oldLocationId = currentSku.locationId || currentSku.uniqueId;
      const newLocationId = updates.locationId;
      
      // Check if the new ID is different from the old one
      if (oldLocationId && String(oldLocationId).trim().toUpperCase() !== String(newLocationId).trim().toUpperCase()) {
        // Check if new ID is already in use
        if (globalIdCache.isIdInUse(newLocationId)) {
          showMessage.error(`Location ID "${newLocationId}" is already in use elsewhere in the map`);
          return;
        }
        
        // Update the cache: remove old ID, add new ID
        if (oldLocationId) {
          globalIdCache.removeId(oldLocationId);
        }
        globalIdCache.addId(newLocationId);
      } else if (!oldLocationId) {
        // New location ID being added
        if (globalIdCache.isIdInUse(newLocationId)) {
          showMessage.error(`Location ID "${newLocationId}" is already in use elsewhere in the map`);
          return;
        }
        globalIdCache.addId(newLocationId);
      }
    }
    
    const updatedSku = { ...currentSku, ...updates };
    const newContents = { ...currentContents, [compartmentId]: updatedSku };
    onUpdateItem(selectedItem.id, { compartmentContents: newContents });
  };

  return (
    <div className="properties-panel animate-slide-right">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '16px 24px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ItemIcon size={20} color="#94a3b8" />
          <span style={{ 
            margin: 0, 
            color: '#e2e8f0', 
            fontSize: '18px', 
            fontWeight: '500'
          }}>Properties</span>
        </div>
      </div>
      
      {/* Enhanced Storage Unit Information */}
      {selectedItem.type === 'storage_unit' && (() => {
        const labelInfo = generateStorageUnitLabelInfo(selectedItem, 1);
        const displayName = selectedItem.name || 'Storage Unit';
        return (
          <div className="property-group storage-unit-info">
            <div className="property-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} color="#4ade80" />
              {displayName} Information
            </div>
            <div style={{ fontSize: '0.9rem', color: '#86efac', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={12} color="#86efac" />
                <strong>Type:</strong> {displayName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={12} color="#86efac" />
                <strong>Location ID:</strong> {getContextualLabel(selectedItem, 'properties') || 'Not Assigned'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={12} color="#86efac" />
                <strong>Category:</strong> {displayName}
              </div>
              
              {/* Multiple Location IDs Display */}
              {selectedItem.locationData && selectedItem.locationData.isMultiLocation && selectedItem.locationData.locationIds && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.8rem', 
                  color: '#bbf7d0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={12} color="#bbf7d0" />
                    <strong>Multiple Location IDs ({selectedItem.locationData.locationIds.length}):</strong>
                  </div>
                  <div style={{ marginLeft: '20px', fontSize: '0.75rem' }}>
                    {selectedItem.locationData.locationIds.map((id: string, index: number) => (
                      <div key={id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: index === 0 ? '#4CAF50' : '#81C784',
                          display: 'inline-block'
                        }} />
                        <span style={{ color: index === 0 ? '#4CAF50' : '#81C784' }}>
                          {id} {index === 0 && '(Primary)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Single Location ID Display (for non-multi-location items) */}
              {!selectedItem.locationData?.isMultiLocation && selectedItem.locationId && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.8rem', 
                  fontStyle: 'italic', 
                  color: '#bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Star size={12} color="#bbf7d0" />
                  Selected from dropdown: {selectedItem.locationId}
                </div>
              )}
              
              {/* Single Location ID Display (for multi-location items that also have primary locationId) */}
              {selectedItem.locationData?.isMultiLocation && selectedItem.locationId && !selectedItem.locationData.locationIds && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.8rem', 
                  fontStyle: 'italic', 
                  color: '#bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Star size={12} color="#bbf7d0" />
                  Selected from dropdown: {selectedItem.locationId}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="property-group">
        <label className="property-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={14} color="#6b7280" />
          Component Name
        </label>
        <input
          type="text"
          className="property-input"
          value={selectedItem.name || ''}
          readOnly
          disabled
          placeholder="Component name"
        />
        <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
        </div>
      </div>

      <div className="property-group">
        <label className="property-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={14} color="#6b7280" />
          Label
        </label>
        <input
          type="text"
          className="property-input"
          value={selectedItem.label || ''}
          onChange={(e) => handleInputChange('label', e.target.value)}
          placeholder="Optional label"
        />
      </div>

      

      <div className="property-group">
        <label className="property-label">
          Position X
        </label>
        <input
          type="number"
          className="property-input"
          value={selectedItem.x}
          onChange={(e) => handleNumberChange('x', e.target.value)}
          min="0"
          step={selectedItem.type === 'solid_boundary' || selectedItem.type === 'dotted_boundary' ? 15 : (selectedItem.gridStep || (selectedItem.gridAligned ? 60 : 15))}
        />
      </div>

      <div className="property-group">
        <label className="property-label">
          Position Y
        </label>
        <input
          type="number"
          className="property-input"
          value={selectedItem.y}
          onChange={(e) => handleNumberChange('y', e.target.value)}
          min="0"
          step={selectedItem.type === 'solid_boundary' || selectedItem.type === 'dotted_boundary' ? 15 : (selectedItem.gridStep || (selectedItem.gridAligned ? 60 : 15))}
        />
      </div>

      <div className="property-group">
        <label className="property-label">
          Width
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            className="property-input"
            value={selectedItem.width}
            onChange={(e) => handleNumberChange('width', e.target.value)}
            min={selectedItem.minSize?.width || selectedItem.gridStep || 20}
            max={selectedItem.maxSize?.width}
            step={selectedItem.gridStep || 1}
            style={{ 
              flex: 1
            }}
          />
          {selectedItem.gridStep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                onClick={() => handleNumberChange('width', String(selectedItem.width + selectedItem.gridStep))}
                style={{
                  width: '24px',
                  height: '16px',
                  border: '1px solid #ddd',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`Increase by ${selectedItem.gridStep}px`}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleNumberChange('width', String(selectedItem.width - selectedItem.gridStep))}
                style={{
                  width: '24px',
                  height: '16px',
                  border: '1px solid #ddd',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`Decrease by ${selectedItem.gridStep}px`}
              >
                -
              </button>
            </div>
          )}
        </div>
              </div>

      <div className="property-group">
        <label className="property-label">
          Height
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            className="property-input"
            value={selectedItem.height}
            onChange={(e) => handleNumberChange('height', e.target.value)}
            min={selectedItem.minSize?.height || 60}
            max={selectedItem.maxSize?.height || 1200}
            step={selectedItem.gridStep || 15}
            style={{
              flex: 1
            }}
          />
          {selectedItem.gridStep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                onClick={() => handleNumberChange('height', String(selectedItem.height + selectedItem.gridStep))}
                style={{
                  width: '24px',
                  height: '16px',
                  border: '1px solid #ddd',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`Increase by ${selectedItem.gridStep}px`}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleNumberChange('height', String(selectedItem.height - selectedItem.gridStep))}
                style={{
                  width: '24px',
                  height: '16px',
                  border: '1px solid #ddd',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`Decrease by ${selectedItem.gridStep}px`}
              >
                -
              </button>
            </div>
          )}
        </div>
              </div>


      <div className="property-group" style={{ marginTop: '2rem' }}>
        <button 
          className="btn btn-danger"
          onClick={handleDelete}
          style={{ 
            width: '100%', 
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            color: 'white'
          }}
        >
          🗑️ Delete Item
        </button>
      </div>

      {/* Stack Information */}
      {selectedItem.stack && selectedItem.stack.layers && selectedItem.stack.layers.length > 1 && (
        <div className="property-group" style={{ marginTop: '2rem' }}>
          <label className="property-label">Stack Information</label>
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '6px',
            fontSize: '0.9rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ marginBottom: '0.5rem', color: '#93c5fd' }}>
              <strong>📚 Layers:</strong> {selectedItem.stack.layers.length}
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#93c5fd' }}>
              <strong>📦 Total SKUs:</strong> {selectedItem.stack.layers.reduce((total: number, layer: any) => 
                total + (layer.skus ? layer.skus.length : 0), 0)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#bfdbfe' }}>
              Right-click to manage stack layers and SKUs
            </div>
          </div>
        </div>
      )}

      {/* SKU Holder Management */}
      {selectedItem.skuGrid && (() => {
        // Calculate compartments based on 60px grid system
        // Each 60x60px grid block = 1 SKU compartment
        const gridSize = 60; // Base grid size
        
        // Calculate how many grid blocks fit in current dimensions
        const cols = Math.max(1, Math.floor(selectedItem.width / gridSize));
        const rows = Math.max(1, Math.floor(selectedItem.height / gridSize));
        const totalCompartments = rows * cols;
        const occupiedCount = selectedItem.compartmentContents ? Object.keys(selectedItem.compartmentContents).length : 0;
        
        // Helper function to update SKU metadata with global ID cache validation
        const updateSkuMetadata = (compartmentId: string, updates: any) => {
          const currentContents = selectedItem.compartmentContents || {};
          const currentSku = currentContents[compartmentId] || {};
          
          // If updating locationId, validate uniqueness using global cache
          if (updates.locationId) {
            const oldLocationId = currentSku.locationId || currentSku.uniqueId;
            const newLocationId = updates.locationId;
            
            // Check if the new ID is different from the old one
            if (oldLocationId && String(oldLocationId).trim().toUpperCase() !== String(newLocationId).trim().toUpperCase()) {
              // Check if new ID is already in use
              if (globalIdCache.isIdInUse(newLocationId)) {
                showMessage.error(`Location ID "${newLocationId}" is already in use elsewhere in the map`);
                return;
              }
              
              // Update the cache: remove old ID, add new ID
              if (oldLocationId) {
                globalIdCache.removeId(oldLocationId);
              }
              globalIdCache.addId(newLocationId);
            } else if (!oldLocationId) {
              // New location ID being added
              if (globalIdCache.isIdInUse(newLocationId)) {
                showMessage.error(`Location ID "${newLocationId}" is already in use elsewhere in the map`);
                return;
              }
              globalIdCache.addId(newLocationId);
            }
          }
          
          const updatedSku = { ...currentSku, ...updates };
          const newContents = { ...currentContents, [compartmentId]: updatedSku };
          onUpdateItem(selectedItem.id, { compartmentContents: newContents });
        };
        
        return (
          <div className="property-group" style={{ marginTop: '2rem' }}>
            <label className="property-label">📋 SKU Compartments</label>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(0, 188, 212, 0.1)', 
              borderRadius: '6px',
              fontSize: '0.85rem',
              border: '1px solid rgba(0, 188, 212, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ marginBottom: '0.5rem', color: '#5eead4' }}>
                <strong>Layout:</strong> {rows} rows × {cols} cols (Dynamic)
              </div>
              <div style={{ marginBottom: '0.5rem', color: '#5eead4' }}>
                <strong>Total Compartments:</strong> {totalCompartments}
              </div>
              <div style={{ marginBottom: '0.5rem', color: '#5eead4' }}>
                <strong>Occupied:</strong> {occupiedCount}
              </div>
              <div style={{ marginBottom: '1rem', color: '#5eead4' }}>
                <strong>Available:</strong> {totalCompartments - occupiedCount}
              </div>
              
              {/* Compartment Grid Display */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Compartment Status:</div>
                <div style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: '2px',
                  maxWidth: '120px'
                }}>
                  {Array.from({ length: totalCompartments }).map((_, index) => {
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    const compartmentId = `${row}-${col}`;
                    const hasItem = selectedItem.compartmentContents && selectedItem.compartmentContents[compartmentId];
                    
                    return (
                      <div
                        key={index}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '1px solid #00BCD4',
                          borderRadius: '2px',
                          backgroundColor: hasItem ? '#00BCD4' : 'rgba(224, 247, 250, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          color: hasItem ? 'white' : '#006064',
                          cursor: 'pointer'
                        }}
                        title={hasItem ? `Location ID: ${hasItem.locationId || hasItem.uniqueId}\nSKU: ${hasItem.sku || 'N/A'}\nStatus: ${hasItem.status || 'unknown'}` : `Empty compartment ${row + 1}-${col + 1}`}
                        onClick={() => {
                          if (hasItem) {
                            // Edit existing Location ID
                            const newLocationId = prompt('Edit Location ID:', hasItem.locationId || hasItem.uniqueId || hasItem.sku);
                            if (newLocationId && newLocationId.trim()) {
                              updateSkuMetadata(compartmentId, {
                                locationId: newLocationId.trim(),
                                uniqueId: newLocationId.trim(), // Keep for backward compatibility
                                sku: hasItem.sku, // Keep original SKU for reference
                                lastModified: new Date().toISOString()
                              });
                            }
                          } else {
                            // Show SKU ID selector for new item
                            setPendingCompartmentId(compartmentId);
                            setSkuIdSelectorVisible(true);
                          }
                        }}
                      >
                        {hasItem ? '✓' : '○'}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Location Details with Detailed Management */}
              {selectedItem.compartmentContents && Object.keys(selectedItem.compartmentContents).length > 0 && (
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Location Details:</div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #00BCD4', borderRadius: '4px' }}>
                    {Object.entries(selectedItem.compartmentContents).map(([compartmentId, itemData]: [string, any]) => {
                      const [row, col] = compartmentId.split('-').map(Number);
                      return (
                        <div key={compartmentId} style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid #E0F7FA',
                          fontSize: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#006064' }}>
                              {itemData.isMultiLocation ? (
                                (() => {
                                  const mappingList = (itemData.levelLocationMappings && itemData.levelLocationMappings.length > 0)
                                    ? itemData.levelLocationMappings
                                    : (itemData.locationIds as string[] || []).map((locId: string, idx: number) => ({
                                        levelId: (itemData.levelIds && itemData.levelIds[idx]) || `L${idx + 1}`,
                                        locationId: locId
                                      }));

                                  if (!Array.isArray(mappingList) || mappingList.length === 0) {
                                    return 'Location data not available';
                                  }

                                  return (
                                    <div>
                                      <div>Level / Location Pairs ({mappingList.length}):</div>
                                      {mappingList.map((mapping, idx) => (
                                        <div
                                          key={`${mapping.levelId || `level-${idx}`}-${mapping.locationId || idx}`}
                                          style={{ fontSize: '0.7rem', marginLeft: '8px', color: '#FF5722' }}
                                        >
                                          • {mapping.levelId || `L${idx + 1}`} → {mapping.locationId || 'Not set'}
                                          {itemData.tags && itemData.tags[idx] ? ` (${itemData.tags[idx]})` : ''}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()
                              ) : (
                                `Location: ${itemData.locationId || itemData.uniqueId || itemData.sku}`
                              )}
                            </div>
                            <div style={{ color: '#666' }}>
                              Position: {row + 1}-{col + 1} | Status: {itemData.status || 'planned'}
                            </div>
                            {itemData.sku && (
                              <div style={{ color: '#666', fontSize: '0.7rem' }}>
                                SKU: {itemData.sku}
                              </div>
                            )}
                            {itemData.category && (
                              <div style={{ color: '#666', fontSize: '0.7rem' }}>
                                Category: {itemData.category}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => {
                                const newLocationId = prompt('Edit Location ID:', itemData.locationId || itemData.uniqueId || itemData.sku);
                                if (newLocationId && newLocationId.trim()) {
                                  updateSkuMetadata(compartmentId, {
                                    locationId: newLocationId.trim(),
                                    uniqueId: newLocationId.trim(), // Keep for backward compatibility
                                    lastModified: new Date().toISOString()
                                  });
                                }
                              }}
                              style={{
                                padding: '0.2rem 0.4rem',
                                fontSize: '0.6rem',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer'
                              }}
                              title="Edit Location ID"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                // Remove the location ID from global cache before deleting
                                const locationId = itemData.locationId || itemData.uniqueId;
                                if (locationId) {
                                  globalIdCache.removeId(locationId);
                                }
                                
                                const newContents = { ...selectedItem.compartmentContents };
                                delete newContents[compartmentId];
                                onUpdateItem(selectedItem.id, { compartmentContents: newContents });
                                showMessage.success(`Item at location "${locationId || itemData.sku}" deleted`);
                              }}
                              style={{
                                padding: '0.2rem 0.4rem',
                                fontSize: '0.6rem',
                                backgroundColor: '#F44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer'
                              }}
                              title="Delete Location"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
                          </div>
          </div>
        );
      })()}

      {/* Grid Information Panel */}
      {selectedItem.gridStep && (
        <div className="property-group" style={{ marginTop: '2rem' }}>
          <label className="property-label">📏 Grid Information</label>
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(34, 197, 94, 0.1)', 
            borderRadius: '6px',
            fontSize: '0.85rem',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ marginBottom: '0.5rem', color: '#4ade80' }}>
              <strong>Grid Size:</strong> {selectedItem.gridStep}px × {selectedItem.gridStep}px
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#4ade80' }}>
              <strong>Current Size:</strong> {Math.round(selectedItem.width / selectedItem.gridStep)} × {Math.round(selectedItem.height / selectedItem.gridStep)} blocks
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#4ade80' }}>
              <strong>Dimensions:</strong> {selectedItem.width}px × {selectedItem.height}px
            </div>
            {selectedItem.minSize && (
              <div style={{ marginBottom: '0.5rem', color: '#86efac', fontSize: '0.8rem' }}>
                <strong>Min Size:</strong> {selectedItem.minSize.width}px × {selectedItem.minSize.height}px
              </div>
            )}
            {selectedItem.maxSize && (
              <div style={{ marginBottom: '0.5rem', color: '#86efac', fontSize: '0.8rem' }}>
                <strong>Max Size:</strong> {selectedItem.maxSize.width}px × {selectedItem.maxSize.height}px
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#bbf7d0', fontStyle: 'italic' }}>
              Resizing is constrained to {selectedItem.gridStep}px increments
            </div>
          </div>
        </div>
      )}

      
      {/* SKU ID Selector Modal */}
      <SkuIdSelector
        isVisible={skuIdSelectorVisible}
        onClose={handleSkuIdSelectorClose}
        onSave={handleSkuIdSelect}
        existingLocationIds={getExistingSkuIds()}
      />
    </div>
  );
};

export default PropertiesPanel;

