// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { 
  facilityHierarchy, 
  FACILITY_LEVELS, 
  FACILITY_TYPES,
  createBuilding,
  createFloor,
  createZone
} from '@/lib/warehouse/utils/facilityHierarchy';

const FacilityManager = ({ isVisible, onClose, onFacilitySelect }) => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeLevel, setActiveLevel] = useState(FACILITY_LEVELS.BUILDING);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    if (isVisible) {
      refreshFacilities();
    }
  }, [isVisible, activeLevel]);

  const refreshFacilities = () => {
    const allFacilities = facilityHierarchy.getFacilitiesByLevel(activeLevel);
    setFacilities(allFacilities);
    setStatistics(facilityHierarchy.getStatistics());
  };

  const handleCreateFacility = (formData) => {
    let newFacility;
    
    switch (activeLevel) {
      case FACILITY_LEVELS.BUILDING:
        newFacility = createBuilding(formData.name, formData.type, formData.properties);
        break;
      case FACILITY_LEVELS.FLOOR:
        newFacility = createFloor(formData.name, formData.parentId, formData.properties);
        break;
      case FACILITY_LEVELS.ZONE:
        newFacility = createZone(formData.name, formData.type, formData.parentId, formData.properties);
        break;
      default:
        return;
    }

    refreshFacilities();
    setShowCreateForm(false);
  };

  const handleDeleteFacility = (facilityId) => {
    if (window.confirm('Are you sure you want to delete this facility and all its children?')) {
      facilityHierarchy.deleteFacility(facilityId);
      refreshFacilities();
      setSelectedFacility(null);
    }
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.locationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isVisible) return null;

  return (
    <div className="facility-manager-overlay">
      <div className="facility-manager">
        <div className="facility-manager-header">
          <h2>Facility Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="facility-manager-content">
          {/* Level Navigation */}
          <div className="level-navigation">
            {Object.values(FACILITY_LEVELS).map(level => (
              <button
                key={level}
                className={`level-btn ${activeLevel === level ? 'active' : ''}`}
                onClick={() => setActiveLevel(level)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}s
              </button>
            ))}
          </div>

          {/* Statistics */}
          <div className="facility-statistics">
            <div className="stat-card">
              <span className="stat-label">Total Facilities</span>
              <span className="stat-value">{statistics.total || 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Current Level</span>
              <span className="stat-value">{statistics.byLevel?.[activeLevel] || 0}</span>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="facility-actions">
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button
              className="create-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create {activeLevel}
            </button>
          </div>

          {/* Facility List */}
          <div className="facility-list">
            {filteredFacilities.map(facility => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                isSelected={selectedFacility?.id === facility.id}
                onSelect={setSelectedFacility}
                onDelete={handleDeleteFacility}
                onEdit={(facility) => {
                  setSelectedFacility(facility);
                  setShowCreateForm(true);
                }}
              />
            ))}
          </div>

          {/* Facility Details */}
          {selectedFacility && (
            <FacilityDetails
              facility={selectedFacility}
              onUpdate={(updates) => {
                facilityHierarchy.updateFacility(selectedFacility.id, updates);
                refreshFacilities();
                setSelectedFacility(facilityHierarchy.getFacility(selectedFacility.id));
              }}
              onSelect={onFacilitySelect}
            />
          )}
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <FacilityForm
            level={activeLevel}
            facility={selectedFacility}
            onSubmit={handleCreateFacility}
            onCancel={() => {
              setShowCreateForm(false);
              setSelectedFacility(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

const FacilityCard = ({ facility, isSelected, onSelect, onDelete, onEdit }) => {
  const hierarchyPath = facilityHierarchy.getHierarchyPath(facility.id);
  
  return (
    <div 
      className={`facility-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(facility)}
    >
      <div className="facility-card-header">
        <h4>{facility.name}</h4>
        <span className="location-code">{facility.locationCode}</span>
      </div>
      
      <div className="facility-card-body">
        <div className="facility-type">{facility.type}</div>
        <div className="facility-path">
          {hierarchyPath.map(f => f.name).join(' → ')}
        </div>
        <div className="facility-children">
          {facility.children.size} child{facility.children.size !== 1 ? 'ren' : ''}
        </div>
      </div>

      <div className="facility-card-actions">
        <button onClick={(e) => { e.stopPropagation(); onEdit(facility); }}>
          Edit
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(facility.id); }}
          className="delete-btn"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const FacilityDetails = ({ facility, onUpdate, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: facility.name,
    properties: { ...facility.properties }
  });

  const children = facilityHierarchy.getChildren(facility.id);
  const hierarchyPath = facilityHierarchy.getHierarchyPath(facility.id);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  return (
    <div className="facility-details">
      <div className="facility-details-header">
        <h3>Facility Details</h3>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="facility-details-content">
        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              placeholder="Facility Name"
            />
            <button onClick={handleSave}>Save</button>
          </div>
        ) : (
          <>
            <div className="detail-row">
              <label>Name:</label>
              <span>{facility.name}</span>
            </div>
            <div className="detail-row">
              <label>Location Code:</label>
              <span>{facility.locationCode}</span>
            </div>
            <div className="detail-row">
              <label>Type:</label>
              <span>{facility.type}</span>
            </div>
            <div className="detail-row">
              <label>Level:</label>
              <span>{facility.level}</span>
            </div>
            <div className="detail-row">
              <label>Hierarchy Path:</label>
              <span>{hierarchyPath.map(f => f.name).join(' → ')}</span>
            </div>
            <div className="detail-row">
              <label>Children:</label>
              <span>{facility.children.size}</span>
            </div>
            {facility.coordinates && (
              <div className="detail-row">
                <label>Coordinates:</label>
                <span>({facility.coordinates.x}, {facility.coordinates.y})</span>
              </div>
            )}
          </>
        )}

        {children.length > 0 && (
          <div className="children-section">
            <h4>Child Facilities</h4>
            <div className="children-list">
              {children.map(child => (
                <div key={child.id} className="child-item">
                  <span>{child.name}</span>
                  <span className="child-code">{child.locationCode}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          className="select-facility-btn"
          onClick={() => onSelect(facility)}
        >
          Select for Layout
        </button>
      </div>
    </div>
  );
};

const FacilityForm = ({ level, facility, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: facility?.name || '',
    type: facility?.type || getDefaultType(level),
    parentId: facility?.parentId || '',
    properties: facility?.properties || {}
  });

  const [availableParents, setAvailableParents] = useState([]);

  useEffect(() => {
    // Get available parent facilities based on level
    const parentLevel = getParentLevel(level);
    if (parentLevel) {
      const parents = facilityHierarchy.getFacilitiesByLevel(parentLevel);
      setAvailableParents(parents);
    }
  }, [level]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="facility-form-overlay">
      <div className="facility-form">
        <h3>{facility ? 'Edit' : 'Create'} {level}</h3>
        
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
            <label>Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              {getTypeOptions(level).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {availableParents.length > 0 && (
            <div className="form-group">
              <label>Parent {getParentLevel(level)}:</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                required
              >
                <option value="">Select Parent</option>
                {availableParents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.locationCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="submit">
              {facility ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper functions
const getDefaultType = (level) => {
  switch (level) {
    case FACILITY_LEVELS.BUILDING:
      return FACILITY_TYPES.WAREHOUSE;
    case FACILITY_LEVELS.ZONE:
      return FACILITY_TYPES.STORAGE;
    default:
      return FACILITY_TYPES.MIXED_USE;
  }
};

const getParentLevel = (level) => {
  switch (level) {
    case FACILITY_LEVELS.FLOOR:
      return FACILITY_LEVELS.BUILDING;
    case FACILITY_LEVELS.ZONE:
      return FACILITY_LEVELS.FLOOR;
    case FACILITY_LEVELS.LOCATION:
      return FACILITY_LEVELS.ZONE;
    default:
      return null;
  }
};

const getTypeOptions = (level) => {
  switch (level) {
    case FACILITY_LEVELS.BUILDING:
      return [
        FACILITY_TYPES.WAREHOUSE,
        FACILITY_TYPES.MANUFACTURING,
        FACILITY_TYPES.OFFICE,
        FACILITY_TYPES.DISTRIBUTION_CENTER,
        FACILITY_TYPES.MIXED_USE
      ];
    case FACILITY_LEVELS.ZONE:
      return [
        FACILITY_TYPES.STORAGE,
        FACILITY_TYPES.PRODUCTION,
        FACILITY_TYPES.SHIPPING,
        FACILITY_TYPES.RECEIVING,
        FACILITY_TYPES.OFFICE_SPACE,
        FACILITY_TYPES.UTILITIES,
        FACILITY_TYPES.SAFETY,
        FACILITY_TYPES.TRAFFIC
      ];
    default:
      return [FACILITY_TYPES.MIXED_USE];
  }
};

export default FacilityManager;

