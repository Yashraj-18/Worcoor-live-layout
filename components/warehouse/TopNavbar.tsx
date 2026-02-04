'use client';

import React, { useState, useEffect } from 'react';
import { orgUnitService, type OrgUnit } from '@/src/services/orgUnits';
import { locationTagService, type LocationTag } from '@/src/services/locationTags';

interface TopNavbarProps {
  // Layout Info
  layoutName?: string;
  selectedOrgUnit?: OrgUnit | null;
  onOrgUnitSelect?: (selection: { orgUnit: OrgUnit; status: { id: string; name: string } }) => void;
  selectedOrgMap?: any;
  onOrgMapSelect?: (map: any) => void;
  
  // Location Tags
  locationTags?: any[];
  isLoadingLocationTags?: boolean;
  
  // Facility Management
  onFacilityManager?: () => void;
  onMeasurementTools?: () => void;
  
  // File Operations
  onSave?: () => void;
  onLoad?: () => void;
  onClear?: () => void;
  onImportCAD?: () => void;
  onExportLayout?: (format: string) => void;
  
  // View Controls
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomFit?: () => void;
  
  // Grid & Snap
  gridVisible?: boolean;
  onToggleGrid?: () => void;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
  
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  
  // Search & Dashboard
  onSearch?: () => void;
  onToggleDashboard?: () => void;
  onNavigateToDashboard?: () => void;
  
  // Boundary
  onAutoGenerateBoundary?: () => void;
  
  // Status
  itemCount?: number;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  // Layout Info
  layoutName,
  selectedOrgUnit,
  onOrgUnitSelect,
  selectedOrgMap,
  onOrgMapSelect,
  
  // Location Tags
  locationTags,
  isLoadingLocationTags,
  
  // Facility Management
  onFacilityManager,
  onMeasurementTools,
  
  // File Operations
  onSave,
  onLoad,
  onClear,
  onImportCAD,
  onExportLayout,
  
  // View Controls
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  
  // Grid & Snap
  gridVisible,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  
  // Search & Dashboard
  onSearch,
  onToggleDashboard,
  onNavigateToDashboard,
  
  // Boundary
  onAutoGenerateBoundary,
  
  // Status
  itemCount
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [isLoadingOrgUnits, setIsLoadingOrgUnits] = useState(true);

  // Fetch org units from Reference Data Management
  useEffect(() => {
    const fetchOrgUnits = async () => {
      try {
        setIsLoadingOrgUnits(true);
        const data = await orgUnitService.list();
        setOrgUnits(data);
      } catch (error) {
        console.error('Failed to fetch org units:', error);
      } finally {
        setIsLoadingOrgUnits(false);
      }
    };

    fetchOrgUnits();
  }, []);

  // Log location tags when they change (for debugging)
  useEffect(() => {
    if (locationTags && locationTags.length > 0) {
      console.log(`🏷️ TopNavbar - Location tags updated: ${locationTags.length} tags`);
      console.table(locationTags);
    }
  }, [locationTags]);

  const toggleDropdown = (dropdown: string | null) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const handleOrgUnitSelectInternal = (option: OrgUnit) => {
    if (onOrgUnitSelect) {
      // Convert the OrgUnit from service to match expected interface
      const adaptedOrgUnit = {
        id: option.id,
        name: option.unitName
      };
      
      onOrgUnitSelect({ 
        orgUnit: adaptedOrgUnit, 
        status: { id: 'operational', name: 'Operational' } 
      });
    }
    if (onOrgMapSelect) {
      onOrgMapSelect(null);
    }
    closeDropdowns();
  };

  // Debug function to manually trigger location tags fetch
  const debugFetchLocationTags = () => {
    if (selectedOrgUnit) {
      console.log(`🔍 DEBUG: Manual trigger for location tags fetch - Org Unit: ${selectedOrgUnit.name}`);
      console.log(`📍 Current location tags count: ${locationTags?.length || 0}`);
      if (locationTags) {
        console.table(locationTags);
      }
    } else {
      console.log('⚠️ DEBUG: No org unit selected');
    }
  };

  const getDropdownLabel = () => {
    console.log('TopNavbar - selectedOrgUnit:', selectedOrgUnit);
    console.log('TopNavbar - selectedOrgMap:', selectedOrgMap);
    
    if (selectedOrgUnit && selectedOrgMap) {
      return `${selectedOrgUnit.name} • ${selectedOrgMap.name}`;
    }
    if (selectedOrgUnit) {
      return selectedOrgUnit.name;
    }
    return 'Select Org Unit';
  };

  return (
    <nav className="modern-navbar" onClick={closeDropdowns}>
      {/* Left Section - Brand & Selectors */}
      <div className="navbar-left">
        <div className="brand-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div className="brand-text" style={{ paddingTop: '8px' }}>
            <div className="brand-title">WC Builder</div>
          </div>
          <button 
            className="return-dashboard-btn"
            onClick={onNavigateToDashboard}
            title="Return to Dashboard"
            style={{ 
              marginTop: '0px',
              fontSize: '11px',
              padding: '4px 8px'
            }}
          >
            ← Dashboard
          </button>
        </div>
        
        <div className="selector-group">
          {/* Org Unit Selector */}
          <div className="selector-item">
            <button 
              className="modern-selector"
              onClick={(e) => { e.stopPropagation(); toggleDropdown('orgUnit'); }}
            >
              <span className="selector-label">Org Unit</span>
              <span className="selector-value">{getDropdownLabel()}</span>
              <span className="selector-arrow">▼</span>
            </button>
            {activeDropdown === 'orgUnit' && (
              <div className="modern-dropdown">
                <div className="dropdown-group single-column">
                  <div className="dropdown-group-header">
                    <div className="group-title">Name</div>
                  </div>
                  <div className="dropdown-group-options">
                    {isLoadingOrgUnits ? (
                      <div className="dropdown-option disabled">
                        <span className="option-text">Loading org units...</span>
                      </div>
                    ) : orgUnits.length > 0 ? (
                      orgUnits.map(option => {
                        const isSelected = selectedOrgUnit?.id === option.id;
                        return (
                          <button
                            key={option.id}
                            className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleOrgUnitSelectInternal(option)}
                          >
                            <span className="option-text">{option.unitName}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="dropdown-option disabled">
                        <span className="option-text">No org units available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Actions */}
      <div className="navbar-center">
        <div className="action-group">
          {/* File Actions */}
          <div className="action-item">
            <button 
              className="action-btn"
              onClick={(e) => { e.stopPropagation(); toggleDropdown('file'); }}
            >
              <span className="action-text">File</span>
            </button>
            {activeDropdown === 'file' && (
              <div className="action-dropdown">
                <button onClick={() => onSave?.()} className="action-option">
                  <span className="option-icon">💾</span>
                  <span>Save Layout</span>
                </button>
                <div className="dropdown-separator"></div>
                <button onClick={() => onClear?.()} className="action-option danger">
                  <span className="option-icon">🗑️</span>
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          
          {/* Tools Actions */}
          <div className="action-item">
            <button 
              className="action-btn"
              onClick={(e) => { e.stopPropagation(); toggleDropdown('tools'); }}
            >
              <span className="action-text">Tools</span>
            </button>
            {activeDropdown === 'tools' && (
              <div className="action-dropdown">
                <button onClick={onAutoGenerateBoundary} className="action-option">
                  <span className="option-icon">⬜</span>
                  <span>Auto-Generate Boundary</span>
                </button>
                <button onClick={() => { onZoomReset?.(); closeDropdowns(); }} className="action-option">
                  <span className="option-icon">🎯</span>
                  <span>Reset to Center</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section - Controls & Status */}
      <div className="navbar-right">
        <div className="control-group">
          <button 
            className={`control-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>
          <button 
            className={`control-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>
        </div>
        
        <div className="status-group">
          <div className="status-badge">
            <span className="status-count">{itemCount}</span>
            <span className="status-label">items</span>
          </div>
          
          {/* Location Tags Status */}
          {selectedOrgUnit && (
            <div className="status-badge" style={{ marginLeft: '8px' }}>
              {isLoadingLocationTags ? (
                <span className="status-label">🏷️ Loading...</span>
              ) : (
                <>
                  <span className="status-count">{locationTags?.length || 0}</span>
                  <span className="status-label">tags</span>
                </>
              )}
            </div>
          )}
          
          {/* Debug Button - Remove in production */}
          {process.env.NODE_ENV === 'development' && selectedOrgUnit && (
            <button 
              onClick={debugFetchLocationTags}
              style={{ 
                marginLeft: '8px', 
                padding: '2px 6px', 
                fontSize: '10px', 
                backgroundColor: '#ff6b6b', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px',
                cursor: 'pointer'
              }}
              title="Debug: Refresh location tags"
            >
              🔄
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;

