'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllLocations } from '@/lib/warehouse/utils/locationService';
import globalIdCache from '@/lib/warehouse/utils/globalIdCache';
import { getLucideIcon, getCategoryIcon, getIconSize, getIconColor } from '@/lib/warehouse/constants/lucideIconMapping';
import { Settings, X, MapPin, Tag, Package, Archive, Building, UsersRound, Star, Palette, Maximize2, Move, Shield, Zap, Users, Lock } from 'lucide-react';

const WarehousePropertiesPanel = ({ 
  selectedItem, 
  onUpdateItem, 
  onClose,
  isVisible,
  allItems = [] // Add allItems prop to check used locations
}) => {
  const [properties, setProperties] = useState({});
  const [availableLocations, setAvailableLocations] = useState([]);

  // Get the current item's location ID
  const currentLocationId = selectedItem?.locationId || 
                          (selectedItem?.locationData?.location_id) ||
                          '';

  // Validate location ID format (must match 'Loc-001' format)
  const isValidLocationId = useCallback((locId) => {
    if (!locId) return false;
    // Must match exactly 'Loc-001' format (case-sensitive with hyphen)
    return /^Loc-\d{3}$/.test(String(locId).trim());
  }, []);

  // Get list of used location IDs from all items (except current item)
  const usedLocationIds = React.useMemo(() => {
    const used = new Set();
    allItems.forEach(item => {
      if (item.id !== selectedItem?.id) { // Exclude current item
        // Check all possible locations where the location ID might be stored
        const locId = item.locationId || 
                     (item.locationData?.location_id) ||
                     (item.properties?.locationId) ||
                     (item.data?.locationId);
        if (locId && isValidLocationId(locId)) {
          used.add(String(locId).trim()); // Store exact format
        }
      }
    });
    return used;
  }, [allItems, selectedItem?.id, isValidLocationId]);

  // Load available locations, filtering out used ones
  useEffect(() => {
    const allLocations = getAllLocations();
    
    const locations = allLocations.filter(loc => {
      if (!loc.location_id) return false;
      
      const locId = loc.location_id.trim();
      
      // Always include the current item's location (exact match)
      if (currentLocationId && locId === currentLocationId.trim()) {
        return true;
      }
      
      // Only include valid format locations that aren't used
      return isValidLocationId(locId) && !usedLocationIds.has(locId);
    });
    
    setAvailableLocations(locations);
  }, [usedLocationIds, currentLocationId, isValidLocationId]);
  
  // Function to check if a location ID is available
  const isLocationAvailable = useCallback((locationId) => {
    if (!locationId) return true; // Allow empty selection
    
    // Must match exact format
    if (!isValidLocationId(locationId)) {
      return false;
    }
    
    // Check if the location ID is already used (exact match)
    return !usedLocationIds.has(String(locationId).trim());
  }, [usedLocationIds, isValidLocationId]);

  useEffect(() => {
    if (selectedItem) {
      setProperties({
        name: selectedItem.name || '',
        label: selectedItem.label || '',
        locationId: selectedItem.locationId || '',
        locationTag: selectedItem.locationTag || '',
        type: selectedItem.type || '',
        color: selectedItem.color || '#00BCD4',
        width: selectedItem.width || 0,
        height: selectedItem.height || 0,
        capacity: selectedItem.capacity || 0,
        access: selectedItem.access || 'Forklift Compatible',
        units: selectedItem.units || 0
      });
    }
  }, [selectedItem]);

  if (!isVisible || !selectedItem) return null;

  const panelStyle = {
    position: 'fixed',
    right: '0',
    top: '60px', // Below toolbar
    width: '300px',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#f8f9fa',
    borderLeft: '1px solid #dee2e6',
    padding: '16px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    overflow: 'auto',
    zIndex: 1000
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #dee2e6'
  };

  const fieldStyle = {
    marginBottom: '12px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
    color: '#495057'
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '13px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #007bff',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '8px'
  };

  const handlePropertyChange = (property, value) => {
    setProperties(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const handleLocationChange = (e) => {
    const newLocationId = e.target.value.trim();
    
    if (newLocationId) {
      // Validate format
      if (!isValidLocationId(newLocationId)) {
        // Show error message or handle invalid format
        console.error('Invalid location ID format. Must be in format "Loc-001"');
        return;
      }
      
      // Check if the location is already in use (exact match)
      const isUsed = allItems.some(item => {
        if (item.id === selectedItem?.id) return false; // Skip current item
        
        const itemLocId = item.locationId || 
                         (item.locationData?.location_id) ||
                         (item.properties?.locationId) ||
                         (item.data?.locationId);
                         
        return itemLocId && itemLocId.trim() === newLocationId;
      });
      
      if (isUsed) {
        // Show error message or handle duplicate
        console.error(`Location ID ${newLocationId} is already in use by another component`);
        return;
      }
    }
    
    // Update the property
    handlePropertyChange('locationId', newLocationId);
  };

  const handleSave = () => {
    if (onUpdateItem) {
      // Get the full location data if a location is selected
      const selectedLocation = availableLocations.find(loc => loc.location_id === properties.locationId);
      
      onUpdateItem(selectedItem.id, {
        ...properties,
        locationData: selectedLocation || null,
        name: properties.name || selectedLocation?.location_id || ''
      });
    }
  };

  const isZone = selectedItem.containerLevel === 2;
  const isUnit = selectedItem.containerLevel === 3;

  // Get appropriate icon for the selected item
  const getItemIcon = () => {
    if (selectedItem.type) {
      return getLucideIcon(selectedItem.type);
    }
    // Fallback based on container level
    if (isZone) return Building;
    if (isUnit) return Package;
    return Settings;
  };

  const ItemIcon = getItemIcon();

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} color="#374151" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#374151' }}>Properties</h3>
        </div>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '18px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={16} color="#6b7280" />
        </button>
      </div>

      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          backgroundColor: selectedItem.color || '#6b7280',
          borderRadius: '8px',
          flexShrink: 0
        }}>
          <ItemIcon size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#1f2937', fontSize: '14px' }}>
            {selectedItem.name || 'Untitled Item'}
          </strong>
          <br />
          <small style={{ color: '#6b7280', fontSize: '12px' }}>
            {isZone ? 'Zone Container' : isUnit ? selectedItem.name : 'Warehouse Component'}
          </small>
        </div>
      </div>

      {/* Basic Properties */}
      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={14} color="#6b7280" />
          Name:
        </label>
        <input
          type="text"
          value={properties.name}
          onChange={(e) => handlePropertyChange('name', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Component Labeling - Enhanced */}
      <div style={{ 
        ...fieldStyle, 
        backgroundColor: '#fef3c7', 
        padding: '12px', 
        borderRadius: '8px', 
        border: '1px solid #fbbf24',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <label style={{ 
          ...labelStyle, 
          color: '#92400e', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Star size={14} color="#92400e" />
          Display Name/Label:
        </label>
        <input
          type="text"
          value={properties.label}
          onChange={(e) => handlePropertyChange('label', e.target.value)}
          style={{ ...inputStyle, borderColor: '#fbbf24', backgroundColor: '#fff' }}
          placeholder="Enter display name (e.g., Zone A, Rack 01, Storage Unit 1)"
        />
        <small style={{ color: '#92400e', fontSize: '11px', fontWeight: '500' }}>
          ✨ This name will be displayed below the component in both layout builder and operational view
        </small>
      </div>

      {/* Location ID Selection */}
      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} color="#6b7280" />
          Location ID:
        </label>
        <select
          value={properties.locationId || ''}
          onChange={handleLocationChange}
          style={inputStyle}
        >
          <option value="">Select a location</option>
          {availableLocations
            .filter(loc => isLocationAvailable(loc.location_id))
            .map(loc => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.location_id}
              </option>
            ))}
        </select>
        {!isLocationAvailable(properties.locationId) && (
          <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <X size={12} color="#dc2626" />
            This location ID is already in use
          </div>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={14} color="#6b7280" />
          Location Tag (optional):
        </label>
        <input
          type="text"
          value={properties.locationTag || ''}
          onChange={(e) => setProperties({...properties, locationTag: e.target.value})}
          style={inputStyle}
          placeholder="e.g., A1-R1-S1"
        />
        <small style={{ color: '#6b7280', fontSize: '11px' }}>
          Unique location identifier for search and tracking
        </small>
      </div>

      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Archive size={14} color="#6b7280" />
          Type:
        </label>
        <select
          value={properties.type}
          onChange={(e) => handlePropertyChange('type', e.target.value)}
          style={inputStyle}
        >
          {isZone && (
            <>
              <option value="storage">Primary Storage</option>
              <option value="receiving">Receiving Area</option>
              <option value="dispatch">Dispatch Area</option>
              <option value="office">Office Space</option>
              <option value="transit">Transit Area</option>
            </>
          )}
          {isUnit && (
            <>
              <option value="storage_bay">Storage Bay</option>
              <option value="pallet_position">Pallet Position</option>
              <option value="shelf_unit">Shelf Unit</option>
              <option value="equipment_space">Equipment Space</option>
            </>
          )}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={14} color="#6b7280" />
          Color:
        </label>
        <input
          type="color"
          value={properties.color}
          onChange={(e) => handlePropertyChange('color', e.target.value)}
          style={{ ...inputStyle, height: '32px' }}
        />
      </div>

      {/* Dimensions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Maximize2 size={14} color="#6b7280" />
            Width:
          </label>
          <input
            type="number"
            value={properties.width}
            onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Maximize2 size={14} color="#6b7280" />
            Height:
          </label>
          <input
            type="number"
            value={properties.height}
            onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Additional Properties */}
      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Move size={14} color="#6b7280" />
          Units:
        </label>
        <select
          value={properties.units || 'px'}
          onChange={(e) => handlePropertyChange('units', e.target.value)}
          style={inputStyle}
        >
          <option value="px">Pixels</option>
          <option value="grid">Grid Units</option>
          <option value="meters">Meters</option>
          <option value="feet">Feet</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={14} color="#6b7280" />
          Access:
        </label>
        <select
          value={properties.access || 'public'}
          onChange={(e) => handlePropertyChange('access', e.target.value)}
          style={inputStyle}
        >
          <option value="public">Public</option>
          <option value="restricted">Restricted</option>
          <option value="private">Private</option>
          <option value="secure">Secure</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} color="#6b7280" />
          Status:
        </label>
        <select
          value={properties.status || 'active'}
          onChange={(e) => handlePropertyChange('status', e.target.value)}
          style={inputStyle}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Under Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={14} color="#6b7280" />
          Load Capacity:
        </label>
        <input
          type="number"
          value={properties.loadCapacity || ''}
          onChange={(e) => handlePropertyChange('loadCapacity', parseInt(e.target.value))}
          style={inputStyle}
          placeholder="Maximum load capacity"
        />
      </div>

      {/* Zone-specific properties */}
      {isZone && (
        <>
          <div style={fieldStyle}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Move size={14} color="#6b7280" />
              Units:
            </label>
            <input
              type="number"
              value={properties.units}
              readOnly
              style={{ ...inputStyle, backgroundColor: '#e9ecef' }}
            />
            <small style={{ color: '#6c757d' }}>Current unit count</small>
          </div>

          <div style={fieldStyle}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color="#6b7280" />
              Access Type:
            </label>
            <select
              value={properties.access}
              onChange={(e) => handlePropertyChange('access', e.target.value)}
              style={inputStyle}
            >
              <option value="Forklift Compatible">Forklift Compatible</option>
              <option value="Manual Access">Manual Access</option>
              <option value="Automated System">Automated System</option>
              <option value="Restricted Access">Restricted Access</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={14} color="#6b7280" />
              Capacity:
            </label>
            <input
              type="number"
              value={properties.capacity}
              onChange={(e) => handlePropertyChange('capacity', parseInt(e.target.value))}
              style={inputStyle}
            />
            <small style={{ color: '#6c757d' }}>Maximum storage units</small>
          </div>
        </>
      )}

      {/* Unit-specific properties */}
      {isUnit && (
        <>
          <div style={fieldStyle}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="#6b7280" />
              Status:
            </label>
            <select
              value={properties.status || 'available'}
              onChange={(e) => handlePropertyChange('status', e.target.value)}
              style={inputStyle}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={14} color="#6b7280" />
              Load Capacity (kg):
            </label>
            <input
              type="number"
              value={properties.loadCapacity || 1000}
              onChange={(e) => handlePropertyChange('loadCapacity', parseInt(e.target.value))}
              style={inputStyle}
            />
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #dee2e6' }}>
        <button onClick={handleSave} style={buttonStyle}>
          Apply Changes
        </button>
        <button 
          onClick={onClose}
          style={{ 
            ...buttonStyle, 
            backgroundColor: '#6c757d', 
            borderColor: '#6c757d' 
          }}
        >
          Cancel
        </button>
      </div>

      {/* Zone Actions */}
      {isZone && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Zone Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button style={{ 
              ...buttonStyle, 
              backgroundColor: '#28a745', 
              borderColor: '#28a745',
              width: '100%',
              margin: 0
            }}>
              Fill with Units
            </button>
            <button style={{ 
              ...buttonStyle, 
              backgroundColor: '#ffc107', 
              borderColor: '#ffc107',
              color: '#212529',
              width: '100%',
              margin: 0
            }}>
              Clear All Units
            </button>
            <button style={{ 
              ...buttonStyle, 
              backgroundColor: '#dc3545', 
              borderColor: '#dc3545',
              width: '100%',
              margin: 0
            }}>
              Delete Zone
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehousePropertiesPanel;

