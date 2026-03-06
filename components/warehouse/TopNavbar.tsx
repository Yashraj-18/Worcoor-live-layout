// @ts-nocheck
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

  // File Operations
  onSave?: () => void;
  onLoad?: () => void;
  onClear?: () => void;

  // View Controls
  onZoomReset?: () => void;

  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  // Boundary
  onAutoGenerateBoundary?: () => void;

  // Status
  itemCount?: number;

  // Navigation
  onNavigateToDashboard?: () => void;
  // Edit mode flag
  isEditMode?: boolean;
  // Auto-refresh
  autoRefreshSeconds?: number;
  onAutoRefreshChange?: (seconds: number) => void;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
  lastRefresh?: Date | null;
  hasActiveLayout?: boolean;
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

  // File Operations
  onSave,
  onLoad,
  onClear,

  // View Controls
  onZoomReset,

  onUndo,
  onRedo,
  canUndo,
  canRedo,

  // Boundary
  onAutoGenerateBoundary,

  // Status
  itemCount,

  // Navigation
  onNavigateToDashboard,
  // Edit mode flag
  isEditMode = false,
  // Auto-refresh
  autoRefreshSeconds = 0,
  onAutoRefreshChange,
  onManualRefresh,
  isRefreshing = false,
  lastRefresh = null,
  hasActiveLayout = false,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [isLoadingOrgUnits, setIsLoadingOrgUnits] = useState(true);
  const [orgUnitsError, setOrgUnitsError] = useState<string | null>(null);

  const fetchOrgUnits = async () => {
    try {
      setIsLoadingOrgUnits(true);
      setOrgUnitsError(null);
      const data = await orgUnitService.list();
      setOrgUnits(data);
    } catch (error) {
      console.error('Failed to fetch org units:', error);
      setOrgUnitsError('Unable to load org units. Tap to retry.');
    } finally {
      setIsLoadingOrgUnits(false);
    }
  };

  // Fetch org units from Reference Data Management
  useEffect(() => {
    fetchOrgUnits();
  }, []);

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

  const getDropdownLabel = () => {
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
              onClick={(e) => {
                if (isEditMode) return; // locked in edit mode
                e.stopPropagation();
                toggleDropdown('orgUnit');
              }}
              style={isEditMode ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              title={isEditMode ? 'Org Unit is locked in edit mode' : undefined}
            >
              <span className="selector-label">Org Unit{isEditMode ? ' 🔒' : ''}</span>
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
                    ) : orgUnitsError ? (
                      <button
                        className="dropdown-option"
                        onClick={(e) => { e.stopPropagation(); fetchOrgUnits(); }}
                      >
                        <span className="option-text text-destructive">{orgUnitsError}</span>
                      </button>
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
                  <span>{isEditMode ? 'Update Layout' : 'Save Layout'}</span>
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

          {/* Auto-refresh controls — only shown when a layout is open */}
          {hasActiveLayout && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '12px',
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              {/* Interval selector */}
              <select
                value={autoRefreshSeconds}
                onChange={(e) => onAutoRefreshChange?.(Number(e.target.value))}
                disabled={isRefreshing}
                title={autoRefreshSeconds > 0 ? `Auto-refreshing every ${autoRefreshSeconds}s` : 'Auto-refresh off'}
                style={{
                  fontSize: '11px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(15,23,42,0.6)',
                  color: autoRefreshSeconds > 0 ? '#22c55e' : '#94a3b8',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value={0}>Auto: Off</option>
                <option value={30}>Auto: 30s</option>
                <option value={60}>Auto: 1 min</option>
                <option value={300}>Auto: 5 min</option>
              </select>

              {/* Manual refresh button */}
              <button
                onClick={() => onManualRefresh?.()}
                disabled={isRefreshing}
                title={isRefreshing ? 'Refreshing…' : 'Refresh components now'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                  opacity: isRefreshing ? 0.5 : 1,
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                🔄
              </button>

              {/* Last-refreshed timestamp */}
              {lastRefresh && !isRefreshing && (
                <span style={{
                  fontSize: '10px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                }}
                  title={`Last refreshed: ${lastRefresh.toLocaleTimeString()}`}
                >
                  ✓ {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
              {isRefreshing && (
                <span style={{ fontSize: '10px', color: '#60a5fa', whiteSpace: 'nowrap' }}>Refreshing…</span>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;

