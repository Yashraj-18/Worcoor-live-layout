'use client';

import React, { useState } from 'react';

// TypeScript interfaces
interface OrgUnit {
  id: string;
  name: string;
}

interface TopNavbarProps {
  // Layout Info
  layoutName?: string;
  selectedOrgUnit?: OrgUnit | null;
  onOrgUnitSelect?: (selection: { orgUnit: OrgUnit; status: { id: string; name: string } }) => void;
  selectedOrgMap?: any;
  onOrgMapSelect?: (map: any) => void;
  
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

  // Flat org unit list shown in dropdown (per latest requirements)
  const orgUnitOptions = [
    { id: 'unit-1', name: 'Unit 1' },
    { id: 'production-unit-1', name: 'Production Unit 1' },
    { id: 'asset-storing-facility', name: 'Asset Storing Facility' },
    { id: 'main-office', name: 'Main Office' }
  ];

  const toggleDropdown = (dropdown: string | null) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const handleOrgUnitSelectInternal = (option: OrgUnit) => {
    if (onOrgUnitSelect) {
      // Properly structure the selection object with orgUnit property
      onOrgUnitSelect({ 
        orgUnit: option, 
        status: { id: 'operational', name: 'Operational' } 
      });
    }
    if (onOrgMapSelect) {
      onOrgMapSelect(null);
    }
    closeDropdowns();
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
                    {orgUnitOptions.map(option => {
                      const isSelected = selectedOrgUnit?.id === option.id;
                      return (
                        <button
                          key={option.id}
                          className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOrgUnitSelectInternal(option)}
                        >
                          <span className="option-text">{option.name}</span>
                        </button>
                      );
                    })}
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
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;

