// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import WarehouseDesigner from '@/components/warehouse/WarehouseDesigner';
import Dashboard from '../../dashboard/WarehouseDashboard';
import LocationDetailsPanel from '@/components/warehouse/LocationDetailsPanel';
import SavedLayoutRenderer, { getLayoutItemKey } from '@/components/warehouse/SavedLayoutRenderer';
import summarizeStorageComponents from '../../../lib/warehouse/utils/layoutComponentSummary';
import layoutComponentsMock from '@/warehouse/data/layoutComponentsMock.json';
import { RefreshCw } from 'lucide-react';

const WarehouseMapView = ({ facilityData }) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedUnitForDemo, setSelectedUnitForDemo] = useState(null);
  const [showDemoMapModal, setShowDemoMapModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [searchType, setSearchType] = useState('location'); // 'location' or 'item'
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);
  const [globalSearchType, setGlobalSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownSearchActive, setDropdownSearchActive] = useState(false);
  const [availableLocationTags, setAvailableLocationTags] = useState([]);
  const [availableSkus, setAvailableSkus] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedLocationTag, setSelectedLocationTag] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [savedLayouts, setSavedLayouts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLocationDetails, setShowLocationDetails] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  // Load saved layouts from localStorage
  const refreshSavedLayouts = useCallback(() => {
    const storedLayouts = localStorage.getItem('warehouseLayouts');
    if (storedLayouts) {
      const parsedLayouts = JSON.parse(storedLayouts);
      setSavedLayouts(parsedLayouts);
    } else {
      setSavedLayouts([]);
    }
  }, []);

  const refreshLiveData = useCallback(async () => {
    console.log('MapView - Refresh triggered', { selectedUnitForDemo });
    setIsRefreshing(true);
    try {
      refreshSavedLayouts();
      window.dispatchEvent(new Event('layoutSaved'));
    } catch (error) {
      console.error('MapView - Refresh failed:', error);
    } finally {
      setLastRefreshedAt(new Date());
      setIsRefreshing(false);
    }
  }, [refreshSavedLayouts, selectedUnitForDemo]);

  useEffect(() => {
    if (!autoRefreshMinutes) {
      return;
    }

    const intervalMs = autoRefreshMinutes * 60 * 1000;
    const id = window.setInterval(() => {
      void refreshLiveData();
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [autoRefreshMinutes, refreshLiveData]);

  useEffect(() => {
    refreshSavedLayouts();

    const handleStorageChange = () => {
      refreshSavedLayouts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('layoutSaved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('layoutSaved', handleStorageChange);
    };
  }, [refreshSavedLayouts]);

  // Extract dropdown options from the currently selected unit's layout only
  const extractDropdownOptionsFromSelectedUnit = useCallback((unitId) => {
    if (!unitId) {
      setAvailableLocationTags([]);
      setAvailableSkus([]);
      setAvailableAssets([]);
      return;
    }

    // Find the selected unit from saved layouts
    const selectedLayout = savedLayouts.find(layout => layout.id === unitId);
    
    if (!selectedLayout?.layoutData?.items) {
      setAvailableLocationTags([]);
      setAvailableSkus([]);
      setAvailableAssets([]);
      return;
    }

    const locationTags = new Set();
    const skus = new Set();
    const assets = new Set();

    // Create a lookup map from location_id to sku_name (case-insensitive)
    const locationToSkuMap = {};
    if (layoutComponentsMock?.locations) {
      layoutComponentsMock.locations.forEach(loc => {
        if (loc.location_id && loc.sku_name) {
          // Store both original case and uppercase version for matching
          locationToSkuMap[loc.location_id] = loc.sku_name;
          locationToSkuMap[loc.location_id.toUpperCase()] = loc.sku_name;
          locationToSkuMap[loc.location_id.toLowerCase()] = loc.sku_name;
        }
      });
    }

    const addLocation = (value) => {
      if (!value) return;
      const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
      if (normalized) {
        locationTags.add(normalized);
      }
    };

    const addSku = (value) => {
      if (!value) return;
      const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
      if (normalized) {
        // Handle comma-separated location IDs (e.g., "LOC-007,LOC-008")
        if (normalized.includes(',')) {
          const locationIds = normalized.split(',').map(id => id.trim());
          locationIds.forEach(locId => {
            const skuName = locationToSkuMap[locId];
            if (skuName) {
              skus.add(skuName);
            }
          });
        } else {
          // Single location ID - map it to SKU name
          const skuName = locationToSkuMap[normalized];
          if (skuName) {
            skus.add(skuName);
          } else if (!normalized.startsWith('LOC-') && !normalized.startsWith('Loc-') && !normalized.startsWith('loc-')) {
            // If it's not a location ID pattern, add it as-is (might be actual SKU)
            skus.add(normalized);
          }
        }
      }
    };

    const addAsset = (type) => {
      if (!type || type === 'square_boundary') return;
      // Map component types to readable names
      const typeMap = {
        'storage_unit': 'Storage Unit',
        'spare_unit': 'Spare Unit',
        'sku_holder': 'Horizontal Storage',
        'vertical_sku_holder': 'Vertical Storage',
        'solid_boundary': 'Solid Boundary',
        'dotted_boundary': 'Dotted Boundary'
      };
      const readableName = typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      assets.add(readableName);
    };

    const collectLocationsFromContent = (content = {}) => {
      if (!content) return;

      // Collect all location IDs from content
      addLocation(content.locationId);
      addLocation(content.primaryLocationId);

      if (Array.isArray(content.locationIds)) {
        content.locationIds.forEach(addLocation);
      }

      if (Array.isArray(content.levelLocationMappings)) {
        content.levelLocationMappings.forEach((mapping) => {
          addLocation(mapping?.locationId || mapping?.locId);
          // Also extract SKU from location ID in mapping
          addSku(mapping?.locationId || mapping?.locId);
        });
      }

      if (Array.isArray(content.levelIds) && Array.isArray(content.locationIds)) {
        content.locationIds.forEach(locId => {
          addLocation(locId);
          addSku(locId); // Also add as SKU to map to name
        });
      }

      // Add SKU data from all content fields
      addSku(content.sku);
      addSku(content.uniqueId);
      addSku(content.primarySku);
      addSku(content.locationId); // Location ID can map to SKU name
      addSku(content.primaryLocationId); // Primary location ID can map to SKU name
      
      // Handle locationIds array
      if (Array.isArray(content.locationIds)) {
        content.locationIds.forEach(addSku);
      }
    };

    const collectLocationsFromItem = (item = {}) => {
      if (item?.type === 'square_boundary') {
        return;
      }

      addLocation(item.locationId);
      addLocation(item.locationCode);
      addLocation(item.locationTag);

      if (Array.isArray(item.locationIds)) {
        item.locationIds.forEach(locId => {
          addLocation(locId);
          addSku(locId); // Extract SKU from location ID
        });
      }

      // Extract from item-level levelLocationMappings (vertical racks)
      if (Array.isArray(item.levelLocationMappings)) {
        item.levelLocationMappings.forEach((mapping) => {
          const locId = mapping?.locationId || mapping?.locId;
          addLocation(locId);
          addSku(locId); // Extract SKU from each level's location ID
        });
      }

      addLocation(item.primaryLocationId);
      addSku(item.primaryLocationId); // Extract SKU from primary location

      if (item.compartmentContents) {
        Object.values(item.compartmentContents).forEach((content) => {
          collectLocationsFromContent(content);
          addSku(content?.sku);
        });
      }
    };

    // Process only the selected layout's items
    selectedLayout.layoutData.items.forEach((item) => {
      collectLocationsFromItem(item);

      // Only add component type to assets
      if (item.type) {
        addAsset(item.type);
      }
    });

    setAvailableLocationTags(Array.from(locationTags).sort());
    setAvailableSkus(Array.from(skus).sort());
    setAvailableAssets(Array.from(assets).sort());
  }, [savedLayouts]);

  // Extract dropdown options when selected unit changes
  useEffect(() => {
    extractDropdownOptionsFromSelectedUnit(selectedUnitForDemo);
  }, [selectedUnitForDemo, savedLayouts, extractDropdownOptionsFromSelectedUnit]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // No default demo units - only show saved layouts
  const defaultUnits = [];
  
  // Convert saved layouts to warehouse units format
  const savedLayoutUnits = savedLayouts.map(layout => ({
    id: layout.id,
    name: layout.name,
    subtitle: `${layout.location} - ${layout.size}`,
    status: layout.status.toUpperCase(),
    statusColor: getStatusColor(layout.status),
    utilization: layout.utilization,
    zones: layout.zones,
    temperature: null,
    details: `Created: ${new Date(layout.lastActivity).toLocaleDateString()} - ${layout.items} items`,
    isCustomLayout: true,
    layoutData: layout.layoutData
  }));

  // Only use saved layouts - no mock/demo units
  const customLayoutUnits = savedLayoutUnits;
  
  // Helper function to get status colors
  function getStatusColor(status) {
    const colors = {
      'operational': '#00D4AA',
      'offline': '#FF6B6B',
      'maintenance': '#FFB800',
      'planning': '#4ECDC4'
    };
    return colors[status] || '#6C757D';
  }
  
  const warehouseUnits = [...defaultUnits, ...customLayoutUnits];

  const { layoutItemsForSummary, storageSummaries } = useMemo(() => {
    const result = {
      layoutItemsForSummary: [],
      storageSummaries: []
    };

    const unit = warehouseUnits.find((u) => u.id === selectedUnitForDemo);
    if (!unit || !unit.isCustomLayout || !unit.layoutData || !Array.isArray(unit.layoutData.items)) {
      return result;
    }

    result.layoutItemsForSummary = unit.layoutData.items;
    result.storageSummaries = summarizeStorageComponents(unit.layoutData.items);

    return result;
  }, [warehouseUnits, selectedUnitForDemo]);

  const selectedOrgUnitForDashboard = useMemo(() => {
    if (!selectedUnitForDemo) return null;
    return warehouseUnits.find(unit => unit.id === selectedUnitForDemo) || null;
  }, [selectedUnitForDemo, warehouseUnits]);

  const dashboardItems = useMemo(() => {
    return selectedOrgUnitForDashboard?.layoutData?.items || [];
  }, [selectedOrgUnitForDashboard]);

  // Hierarchical filter structure
  const hierarchicalFilters = {
    all: { label: 'All Units', count: warehouseUnits.length },
    warehouse1: {
      label: 'Warehouse 1',
      children: {
        'unit1': { label: 'Unit 1', subtitle: 'Building 1' },
        'unit2': { label: 'Unit 2', subtitle: 'Building 2' }
      }
    },
    warehouse2: {
      label: 'Warehouse 2', 
      children: {
        'unit3': { label: 'Unit 3', subtitle: 'Building 1' },
        'unit4': { label: 'Unit 4', subtitle: 'Building 2' }
      }
    },
    warehouse3: {
      label: 'Warehouse 3',
      children: {
        'unit5': { label: 'Unit 5', subtitle: 'Building 1' },
        'unit6': { label: 'Unit 6', subtitle: 'Building 2' }
      }
    },
    customLayouts: {
      label: 'Custom Layouts',
      children: customLayoutUnits.reduce((acc, unit) => {
        acc[unit.id] = { label: unit.name, subtitle: unit.subtitle };
        return acc;
      }, {})
    }
  };

  // Filter units based on selected filter
  const getFilteredUnits = () => {
    if (selectedFilter === 'all') {
      return warehouseUnits;
    }
    
    // Check if it's a warehouse filter
    if (hierarchicalFilters[selectedFilter] && hierarchicalFilters[selectedFilter].children) {
      const childIds = Object.keys(hierarchicalFilters[selectedFilter].children);
      return warehouseUnits.filter(unit => childIds.includes(unit.id));
    }
    
    // Check if it's a specific unit filter
    return warehouseUnits.filter(unit => unit.id === selectedFilter);
  };

  const filteredUnits = getFilteredUnits();

  const selectedDemoUnit = warehouseUnits.find(unit => unit.id === selectedUnitForDemo);
  const shouldShowDemoLegend = !selectedDemoUnit || !selectedDemoUnit.isCustomLayout;
  const isDemoUnit = selectedDemoUnit && !selectedDemoUnit.isCustomLayout;

  // Demo map data for each unit
  const demoMapsData = {
    unit1: {
      name: 'Warehouse 1 - Org Unit',
      location: 'RM 1',
      zones: [
        // Horizontal Storage Racks A-H (Cyan color like reference)
        { id: 'A', name: 'Rack A', type: 'rack', x: 120, y: 40, width: 55, height: 140, color: '#00CED1', items: 24, capacity: 28, racks: 4 },
        { id: 'B', name: 'Rack B', type: 'rack', x: 185, y: 40, width: 55, height: 140, color: '#00CED1', items: 26, capacity: 28, racks: 4 },
        { id: 'C', name: 'Rack C', type: 'rack', x: 250, y: 40, width: 55, height: 140, color: '#00CED1', items: 22, capacity: 28, racks: 4 },
        { id: 'D', name: 'Rack D', type: 'rack', x: 315, y: 40, width: 55, height: 140, color: '#00CED1', items: 25, capacity: 28, racks: 4 },
        { id: 'E', name: 'Rack E', type: 'rack', x: 380, y: 40, width: 55, height: 140, color: '#00CED1', items: 27, capacity: 28, racks: 4 },
        { id: 'F', name: 'Rack F', type: 'rack', x: 445, y: 40, width: 55, height: 140, color: '#00CED1', items: 23, capacity: 28, racks: 4 },
        { id: 'G', name: 'Rack G', type: 'rack', x: 510, y: 40, width: 55, height: 140, color: '#00CED1', items: 28, capacity: 28, racks: 4 },
        { id: 'H', name: 'Rack H', type: 'rack', x: 575, y: 40, width: 55, height: 140, color: '#00CED1', items: 21, capacity: 28, racks: 4 },
        
        // Back Office Space (Blue)
        { id: 'OFFICE', name: 'Back Office Space', type: 'office', x: 20, y: 40, width: 80, height: 140, color: '#1E90FF', items: 0, capacity: 0 },
        
        // Receiving Areas (Orange/Yellow)
        { id: 'REC1', name: 'Receiving Area 1', type: 'receiving', x: 120, y: 200, width: 80, height: 60, color: '#FFA500', items: 8, capacity: 12 },
        { id: 'REC2', name: 'Receiving Area 2', type: 'receiving', x: 210, y: 200, width: 80, height: 60, color: '#FFD700', items: 6, capacity: 12 },
        
        // Dispatch Areas (Green)
        { id: 'DISP1', name: 'Dispatch Area 1', type: 'dispatch', x: 300, y: 200, width: 80, height: 60, color: '#32CD32', items: 5, capacity: 10 },
        { id: 'DISP2', name: 'Dispatch Area 2', type: 'dispatch', x: 390, y: 200, width: 80, height: 60, color: '#228B22', items: 7, capacity: 10 },
        { id: 'DISP3', name: 'Dispatch Area 3', type: 'dispatch', x: 480, y: 200, width: 80, height: 60, color: '#006400', items: 4, capacity: 10 },
        
        // Transit/Temp Area (Light Green)
        { id: 'TRANSIT', name: 'Transit/Temp Area', type: 'transit', x: 570, y: 200, width: 80, height: 60, color: '#90EE90', items: 3, capacity: 8 },
        
        // Packaging Area (Purple)
        { id: 'PACK', name: 'Packaging Area', type: 'packaging', x: 20, y: 200, width: 80, height: 60, color: '#9370DB', items: 12, capacity: 15 }
      ],
      gates: [
        { id: 'IN1', name: 'In-Gate 1', x: 150, y: 280, type: 'in-gate' },
        { id: 'IN2', name: 'In-Gate 2', x: 240, y: 280, type: 'in-gate' },
        { id: 'OUT1', name: 'Out Gate 1', x: 330, y: 280, type: 'out-gate' },
        { id: 'OUT2', name: 'Out Gate 2', x: 420, y: 280, type: 'out-gate' },
        { id: 'OUT3', name: 'Out Gate 3', x: 510, y: 280, type: 'out-gate' }
      ],
      equipment: [
        { id: 'fork1', name: 'Forklift #1', x: 150, y: 190, status: 'active' },
        { id: 'fork2', name: 'Forklift #2', x: 350, y: 190, status: 'active' },
        { id: 'scanner1', name: 'Barcode Scanner', x: 60, y: 230, status: 'active' }
      ]
    },
    unit2: {
      name: 'Unit 2 - Cold Storage',
      zones: [
        { id: 'CS1', name: 'Cold Zone 1', type: 'cold-storage', x: 50, y: 50, width: 150, height: 100, color: '#5DADE2', items: 28, capacity: 35 },
        { id: 'CS2', name: 'Cold Zone 2', type: 'cold-storage', x: 220, y: 50, width: 150, height: 100, color: '#5DADE2', items: 32, capacity: 35 },
        { id: 'FZ1', name: 'Freezer Zone', type: 'freezer', x: 390, y: 50, width: 120, height: 100, color: '#3498DB', items: 18, capacity: 25 },
        { id: 'R2', name: 'Cold Receiving', type: 'receiving', x: 50, y: 180, width: 180, height: 50, color: '#58D68D', items: 5, capacity: 10 },
        { id: 'S2', name: 'Cold Dispatch', type: 'shipping', x: 250, y: 180, width: 180, height: 50, color: '#F39C12', items: 3, capacity: 10 }
      ],
      equipment: [
        { id: 'temp1', name: 'Temperature Monitor', x: 150, y: 100, status: 'normal', temp: '-18°C' },
        { id: 'temp2', name: 'Temperature Monitor', x: 300, y: 100, status: 'normal', temp: '-18°C' },
        { id: 'temp3', name: 'Freezer Monitor', x: 450, y: 100, status: 'normal', temp: '-25°C' }
      ]
    },
    unit3: {
      name: 'Unit 3 - Distribution Hub',
      zones: [
        { id: 'SORT', name: 'Sorting Area', type: 'sorting', x: 50, y: 50, width: 200, height: 80, color: '#E67E22', items: 150, capacity: 200 },
        { id: 'PACK', name: 'Packaging', type: 'packaging', x: 280, y: 50, width: 150, height: 80, color: '#8E44AD', items: 45, capacity: 60 },
        { id: 'QC', name: 'Quality Control', type: 'quality', x: 460, y: 50, width: 100, height: 80, color: '#E74C3C', items: 12, capacity: 20 },
        { id: 'DOCK1', name: 'Loading Dock 1', type: 'loading', x: 50, y: 160, width: 120, height: 60, color: '#F39C12', items: 8, capacity: 10 },
        { id: 'DOCK2', name: 'Loading Dock 2', type: 'loading', x: 200, y: 160, width: 120, height: 60, color: '#F39C12', items: 6, capacity: 10 },
        { id: 'DOCK3', name: 'Loading Dock 3', type: 'loading', x: 350, y: 160, width: 120, height: 60, color: '#F39C12', items: 4, capacity: 10 }
      ],
      equipment: [
        { id: 'conv2', name: 'Main Conveyor', x: 150, y: 130, width: 200, height: 15, status: 'running' },
        { id: 'scanner1', name: 'Barcode Scanner', x: 200, y: 80, status: 'active' },
        { id: 'scale1', name: 'Weighing Scale', x: 350, y: 80, status: 'active' }
      ]
    },
    unit4: {
      name: 'Unit 4 - Returns Processing',
      zones: [
        { id: 'RET1', name: 'Returns Intake', type: 'returns', x: 50, y: 50, width: 140, height: 70, color: '#E67E22', items: 25, capacity: 40 },
        { id: 'INSP', name: 'Inspection Area', type: 'inspection', x: 220, y: 50, width: 120, height: 70, color: '#9B59B6', items: 15, capacity: 25 },
        { id: 'REP', name: 'Repair Station', type: 'repair', x: 370, y: 50, width: 100, height: 70, color: '#E74C3C', items: 8, capacity: 15 },
        { id: 'RESTOCK', name: 'Restock Area', type: 'restock', x: 50, y: 150, width: 180, height: 60, color: '#27AE60', items: 32, capacity: 50 },
        { id: 'DISP', name: 'Disposal', type: 'disposal', x: 260, y: 150, width: 100, height: 60, color: '#95A5A6', items: 5, capacity: 20 }
      ],
      equipment: [
        { id: 'test1', name: 'Testing Station', x: 280, y: 80, status: 'active' },
        { id: 'printer1', name: 'Label Printer', x: 150, y: 180, status: 'active' }
      ]
    },
    unit5: {
      name: 'Unit 5 - Hazmat Storage (OFFLINE)',
      zones: [
        { id: 'HAZ1', name: 'Hazmat Zone 1', type: 'hazmat', x: 50, y: 50, width: 120, height: 80, color: '#E74C3C', items: 0, capacity: 30 },
        { id: 'HAZ2', name: 'Hazmat Zone 2', type: 'hazmat', x: 200, y: 50, width: 120, height: 80, color: '#E74C3C', items: 0, capacity: 30 },
        { id: 'SAFE', name: 'Safety Station', type: 'safety', x: 350, y: 50, width: 80, height: 80, color: '#F39C12', items: 0, capacity: 0 },
        { id: 'DECON', name: 'Decontamination', type: 'decon', x: 50, y: 160, width: 150, height: 60, color: '#95A5A6', items: 0, capacity: 0 }
      ],
      equipment: [
        { id: 'alarm1', name: 'Safety Alarm', x: 390, y: 90, status: 'offline' },
        { id: 'vent1', name: 'Ventilation System', x: 125, y: 190, status: 'offline' }
      ],
      offline: true
    },
    unit6: {
      name: 'Unit 6 - Overflow Storage',
      zones: [
        { id: 'OV1', name: 'Overflow A', type: 'overflow', x: 50, y: 40, width: 100, height: 60, color: '#3498DB', items: 48, capacity: 50 },
        { id: 'OV2', name: 'Overflow B', type: 'overflow', x: 170, y: 40, width: 100, height: 60, color: '#3498DB', items: 50, capacity: 50 },
        { id: 'OV3', name: 'Overflow C', type: 'overflow', x: 290, y: 40, width: 100, height: 60, color: '#3498DB', items: 47, capacity: 50 },
        { id: 'OV4', name: 'Overflow D', type: 'overflow', x: 410, y: 40, width: 100, height: 60, color: '#3498DB', items: 45, capacity: 50 },
        { id: 'OV5', name: 'Overflow E', type: 'overflow', x: 50, y: 120, width: 100, height: 60, color: '#3498DB', items: 49, capacity: 50 },
        { id: 'OV6', name: 'Overflow F', type: 'overflow', x: 170, y: 120, width: 100, height: 60, color: '#3498DB', items: 46, capacity: 50 },
        { id: 'TEMP', name: 'Temporary Storage', type: 'temporary', x: 290, y: 120, width: 220, height: 60, color: '#F39C12', items: 25, capacity: 40 }
      ],
      equipment: [
        { id: 'crane1', name: 'Overhead Crane', x: 250, y: 20, status: 'active' },
        { id: 'lift1', name: 'Scissor Lift', x: 150, y: 200, status: 'active' }
      ]
    }
  };

  // Real-time notifications data
  const notifications = [
    {
      id: 'notif1',
      type: 'success',
      title: 'Unit 2 - Capacity Updated',
      message: 'Cold storage capacity increased to 85%. Temperature maintained at -18°C.',
      timestamp: '2 minutes ago',
      unit: 'Unit 2',
      priority: 'medium'
    },
    {
      id: 'notif2',
      type: 'warning',
      title: 'Unit 3 - Maintenance Required',
      message: 'Distribution hub showing reduced efficiency. Scheduled maintenance in progress.',
      timestamp: '15 minutes ago',
      unit: 'Unit 3',
      priority: 'high'
    },
    {
      id: 'notif3',
      type: 'info',
      title: 'Unit 1 - Inventory Movement',
      message: 'Large shipment processed. 150 pallets moved to storage zones A-D.',
      timestamp: '1 hour ago',
      unit: 'Unit 1',
      priority: 'low'
    },
    {
      id: 'notif4',
      type: 'error',
      title: 'Unit 5 - System Offline',
      message: 'Hazmat storage unit offline due to safety protocol activation.',
      timestamp: '2 hours ago',
      unit: 'Unit 5',
      priority: 'critical'
    },
    {
      id: 'notif5',
      type: 'success',
      title: 'Unit 6 - Peak Capacity Reached',
      message: 'Overflow storage at 92% capacity. Additional space allocation recommended.',
      timestamp: '3 hours ago',
      unit: 'Unit 6',
      priority: 'medium'
    },
    {
      id: 'notif6',
      type: 'info',
      title: 'Unit 4 - Quality Control Complete',
      message: 'Returns processing completed. 45 items cleared for redistribution.',
      timestamp: '4 hours ago',
      unit: 'Unit 4',
      priority: 'low'
    }
  ];

  const areas = [
    { name: 'Storage A', color: '#4A90E2', occupied: true },
    { name: 'Storage B', color: '#4A90E2', occupied: true },
    { name: 'Storage C', color: '#4A90E2', occupied: true },
    { name: 'Storage D', color: '#4A90E2', occupied: false },
    { name: 'Receiving', color: '#7ED321', occupied: true },
    { name: 'Dispatch', color: '#F5A623', occupied: true },
    { name: 'Office Area', color: '#BD10E0', occupied: true }
  ];

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (actionId) => {
    console.log('Action clicked:', actionId);
    // Add your action handling logic here
    switch(actionId) {
      case 'all-units':
        // Navigate to all units view
        break;
      case 'layout-builder':
        // Navigate to layout builder
        break;
      case 'live-map':
        // Navigate to live map
        break;
      default:
        break;
    }
  };

  const handleDeleteLayout = (layoutId) => {
    if (!layoutId || typeof window === 'undefined') return;

    const confirmed = window.confirm('Delete this layout permanently? This action cannot be undone.');
    if (!confirmed) return;

    setSavedLayouts(prevLayouts => {
      const updatedLayouts = prevLayouts.filter(layout => layout.id !== layoutId);
      window.localStorage.setItem('warehouseLayouts', JSON.stringify(updatedLayouts));
      window.dispatchEvent(new Event('layoutSaved'));
      return updatedLayouts;
    });
  };

  const handleUnitAction = (unitId, action) => {
    console.log('Unit action:', unitId, action);
    
    switch(action) {
      case 'view-live':
        // Show demo map modal for specific unit
        setSelectedUnitForDemo(unitId);
        setShowDemoMapModal(true);
        break;
      case 'edit':
        // Navigate to layout builder for specific unit
        setSelectedUnit(unitId);
        setCurrentSection('layout-builder');
        break;
      default:
        break;
    }
  };

  const handleCreateNewUnit = () => {
    setShowCreateUnitModal(true);
  };

  const handleUseTemplate = () => {
    setShowTemplateModal(true);
  };

  const handleNotificationAction = (notificationId, action) => {
    console.log('Notification action:', notificationId, action);
    
    switch(action) {
      case 'view':
        // Navigate to the specific unit mentioned in notification
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          const unitId = notification.unit.toLowerCase().replace(' ', '');
          handleUnitAction(unitId, 'view-live');
        }
        break;
      case 'dismiss':
        // Remove notification from list
        // In this demo implementation we simply log the dismissal
        console.log('Notification dismissed:', notificationId);
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all notifications as read');
    // Mark all notifications as read
  };

  // Search functionality
  const performSearch = (query, type) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const searchTerm = query.toLowerCase();

    // Get current unit data
    const unit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
    if (!unit) return;

    // Search in custom layouts
    if (unit.isCustomLayout && unit.layoutData && unit.layoutData.items) {
      unit.layoutData.items.forEach((item, index) => {
        const itemId = `item-${index}`;
        
        // Generate operational data for search
        const generateSearchData = (item, index) => {
          if (item.type?.includes('storage') || item.type?.includes('sku')) {
            return {
              type: 'storage',
              unitId: `STG-${String(index + 1).padStart(3, '0')}`,
              location: {
                zone: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
                aisle: Math.floor(Math.random() * 10) + 1,
                position: Math.floor(Math.random() * 20) + 1
              },
              items: item.compartmentContents || {}
            };
          }
          return null;
        };

        const searchData = generateSearchData(item, index);
        
        if (type === 'location' && searchData) {
          // Search by location ID
          const locationId = `${searchData.location.zone}-${searchData.location.aisle}-${searchData.location.position}`;
          if (searchData.unitId.toLowerCase().includes(searchTerm) || 
              locationId.toLowerCase().includes(searchTerm)) {
            results.push({
              id: itemId,
              type: 'location',
              title: `Location: ${searchData.unitId}`,
              subtitle: `Zone ${searchData.location.zone}, Aisle ${searchData.location.aisle}, Position ${searchData.location.position}`,
              item: item,
              searchData: searchData
            });
          }
        } else if (type === 'item' && searchData && searchData.items) {
          // Search by item/SKU in compartments
          Object.values(searchData.items).forEach(itemData => {
            if (itemData.locationId?.toLowerCase().includes(searchTerm) ||
                itemData.sku?.toLowerCase().includes(searchTerm) ||
                itemData.uniqueId?.toLowerCase().includes(searchTerm)) {
              results.push({
                id: `${itemId}-${itemData.uniqueId || itemData.sku || 'compartment'}`,
                type: 'item',
                title: `Item: ${itemData.uniqueId || itemData.sku || 'Inventory Item'}`,
                subtitle: `SKU: ${itemData.sku || 'N/A'}`,
                item,
                itemData
              });
              }
          });
        }
      });
    }

    // Search in demo data
    const demoData = demoMapsData[selectedUnitForDemo];
    if (demoData && demoData.zones) {
      demoData.zones.forEach((zone, index) => {
        if (type === 'location') {
          if (zone.id.toLowerCase().includes(searchTerm) ||
              zone.name?.toLowerCase().includes(searchTerm)) {
            results.push({
              id: `zone-${index}`,
              type: 'location',
              title: `Zone: ${zone.id}`,
              subtitle: zone.name || 'Demo Zone',
              zone: zone
            });
          }
        } else if (type === 'item') {
          // Search for items in zones (simulated)
          if (zone.items && zone.items > 0) {
            const simulatedItems = Array.from({length: Math.min(zone.items, 5)}, (_, i) => 
              `ITEM-${zone.id}-${String(i + 1).padStart(3, '0')}`
            );
            
            simulatedItems.forEach(itemId => {
              if (itemId.toLowerCase().includes(searchTerm)) {
                results.push({
                  id: `zone-${index}`,
                  type: 'item',
                  title: `Item: ${itemId}`,
                  subtitle: `In Zone ${zone.id}`,
                  zone: zone,
                  itemId: itemId
                });
                  }
            });
          }
        }
      });
    }

    setSearchResults(results);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query, searchType);
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    performSearch(searchQuery, type);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle opening fullscreen preview in a new tab
  const handleOpenFullscreen = () => {
    if (!selectedUnitForDemo) {
      return;
    }

    const unit = warehouseUnits.find((u) => u.id === selectedUnitForDemo);
    if (!unit) {
      return;
    }

    const { layoutData: unitLayoutData, ...unitMeta } = unit;
    const payload = {
      unit: unitMeta,
      isCustomLayout: Boolean(unit.isCustomLayout),
      layoutData: unit.isCustomLayout ? unitLayoutData : null,
      demoData: unit.isCustomLayout ? null : demoMapsData[unit.id] || null,
      storageSummaries,
      layoutItems: unit.isCustomLayout ? unitLayoutData?.items || [] : null
    };

    try {
      const encoded = encodeURIComponent(JSON.stringify(payload));
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      window.open(`${baseUrl}#fullscreen-map=${encoded}`, '_blank', 'noopener,noreferrer');
      setShowDemoMapModal(false);
    } catch (err) {
      console.error('Failed to open fullscreen map:', err);
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleClearAllNotifications = () => {
    console.log('Clear all notifications');
    // Clear all notifications
  };

  // Filter handlers
  const handleFilterSelect = (filterId) => {
    setSelectedFilter(filterId);
    setShowFilterDropdown(false);
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const getFilterLabel = () => {
    if (selectedFilter === 'all') {
      return `All Units (${warehouseUnits.length})`;
    }
    
    // Check if it's a warehouse filter
    if (hierarchicalFilters[selectedFilter] && hierarchicalFilters[selectedFilter].children) {
      const childCount = Object.keys(hierarchicalFilters[selectedFilter].children).length;
      return `${hierarchicalFilters[selectedFilter].label} (${childCount})`;
    }
    
    // Check if it's a specific unit
    const unit = warehouseUnits.find(u => u.id === selectedFilter);
    if (unit) {
      return unit.name;
    }
    
    return 'Filter';
  };

  // Global search functionality across all maps
  const performGlobalSearch = (query, searchType) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    const results = [];
    const searchTerm = query.toLowerCase();

    // Search through all warehouse units
    warehouseUnits.forEach(unit => {
      const unitResults = [];

      // Search in custom layouts
      if (unit.isCustomLayout && unit.layoutData && unit.layoutData.items) {
        unit.layoutData.items.forEach((item, index) => {
          const itemId = `${unit.id}-item-${index}`;
          
          // Generate search data for custom layout items
          const generateItemSearchData = (item, index) => {
            const baseData = {
              unitId: `STG-${String(index + 1).padStart(3, '0')}`,
              location: {
                zone: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
                aisle: Math.floor(Math.random() * 10) + 1,
                position: Math.floor(Math.random() * 20) + 1
              },
              type: item.type || 'storage'
            };

            // Add SKU data if available
            if (item.compartmentContents) {
              baseData.skus = Object.values(item.compartmentContents).map(content => ({
                id: content.locationId || content.uniqueId || content.sku,
                sku: content.sku || content.locationId,
                quantity: content.quantity || 1,
                status: content.status || 'active'
              }));
            } else if (item.skuId) {
              baseData.skus = [{
                id: item.skuId,
                sku: item.skuId,
                quantity: 1,
                status: 'active'
              }];
            }

            return baseData;
          };

          const searchData = generateItemSearchData(item, index);

          // Search by type (all, items, locations, zones)
          if (searchType === 'all' || searchType === 'locations') {
            // Search locations
            const locationId = `${searchData.location.zone}-${searchData.location.aisle}-${searchData.location.position}`;
            if (searchData.unitId.toLowerCase().includes(searchTerm) || 
                locationId.toLowerCase().includes(searchTerm) ||
                item.name?.toLowerCase().includes(searchTerm)) {
              unitResults.push({
                id: itemId,
                type: 'location',
                title: `${item.name || item.type}: ${item.locationId || item.locationCode || 'No ID'}`,
                subtitle: `Layout: ${unit.name}`,
                layoutId: unit.id,
                item: item
              });
            }
          }

          if (searchType === 'all' || searchType === 'items') {
            // Search items/SKUs
            if (searchData.skus) {
              searchData.skus.forEach(skuData => {
                if (skuData.id?.toLowerCase().includes(searchTerm) ||
                    skuData.sku?.toLowerCase().includes(searchTerm)) {
                  unitResults.push({
                    id: `${itemId}-${skuData.id}`,
                    type: 'item',
                    title: `Item: ${skuData.id}`,
                    subtitle: `SKU: ${skuData.sku} | Qty: ${skuData.quantity} | Status: ${skuData.status}`,
                    unit: unit,
                    item: item,
                    skuData: skuData,
                    searchData: searchData
                  });
                }
              });
            }
          }

          if (searchType === 'all' || searchType === 'zones') {
            // Search zones/areas
            if (item.type?.includes('zone') || item.type?.includes('storage') || item.type?.includes('boundary')) {
              if (item.name?.toLowerCase().includes(searchTerm) ||
                  item.type?.toLowerCase().includes(searchTerm)) {
                unitResults.push({
                  id: itemId,
                  type: 'zone',
                  title: `Zone: ${item.name}`,
                  subtitle: `Type: ${item.type} | Size: ${item.width}×${item.height}`,
                  unit: unit,
                  item: item
                });
              }
            }
          }
        });
      }

      // Search in demo data
      const demoData = demoMapsData[unit.id];
      if (demoData && demoData.zones) {
        demoData.zones.forEach((zone, index) => {
          const zoneId = `${unit.id}-zone-${index}`;

          if (searchType === 'all' || searchType === 'zones') {
            // Search zones
            if (zone.id.toLowerCase().includes(searchTerm) ||
                zone.name?.toLowerCase().includes(searchTerm) ||
                zone.type?.toLowerCase().includes(searchTerm)) {
              unitResults.push({
                id: zoneId,
                type: 'zone',
                title: `Zone: ${zone.id} - ${zone.name}`,
                subtitle: `Type: ${zone.type} | Capacity: ${zone.items}/${zone.capacity}`,
                unit: unit,
                zone: zone
              });
            }
          }

          if (searchType === 'all' || searchType === 'items') {
            // Search simulated items in zones
            if (zone.items && zone.items > 0) {
              const simulatedItems = Array.from({length: Math.min(zone.items, 3)}, (_, i) => 
                `ITEM-${zone.id}-${String(i + 1).padStart(3, '0')}`
              );
              
              simulatedItems.forEach(itemId => {
                if (itemId.toLowerCase().includes(searchTerm)) {
                  unitResults.push({
                    id: `${zoneId}-${itemId}`,
                    type: 'item',
                    title: `Item: ${itemId}`,
                    subtitle: `In Zone ${zone.id} - ${zone.name}`,
                    unit: unit,
                    zone: zone,
                    itemId: itemId
                  });
                }
              });
            }
          }
        });
      }

      // Add unit results to main results if any found
      if (unitResults.length > 0) {
        results.push({
          unit: unit,
          results: unitResults,
          count: unitResults.length
        });
      }
    });

    setGlobalSearchResults(results);
  };

  // Global search handlers
  const handleGlobalSearchChange = (e) => {
    const query = e.target.value;
    setGlobalSearchQuery(query);
    performGlobalSearch(query, globalSearchType);
    setShowGlobalSearchDropdown(query.trim().length > 0);
  };

  const handleGlobalSearchTypeChange = (type) => {
    setGlobalSearchType(type);
    performGlobalSearch(globalSearchQuery, type);
  };

  const handleGlobalSearchResultClick = (result) => {
    // Navigate to the specific unit and highlight the item
    setSelectedUnitForDemo(result.unit.id);
    setShowDemoMapModal(true);
    setShowGlobalSearchDropdown(false);
    
    // You could add highlighting logic here
    console.log('Navigate to:', result);
  };

  const clearGlobalSearch = () => {
    setGlobalSearchQuery('');
    setGlobalSearchResults([]);
    setShowGlobalSearchDropdown(false);
  };

  // Close global search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGlobalSearchDropdown && !event.target.closest('.global-search-container')) {
        setShowGlobalSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGlobalSearchDropdown]);

  const highlightData = useMemo(() => {
    const empty = { itemKeys: [], compartmentMap: {} };

    if (!selectedUnitForDemo || (!selectedLocationTag && !selectedSku && !selectedAsset)) {
      return empty;
    }

    const unit = warehouseUnits.find((u) => u.id === selectedUnitForDemo);
    if (!unit?.isCustomLayout || !unit?.layoutData?.items) {
      return empty;
    }

    const highlightedItemKeys = [];
    const compartmentMap = {};
    const typeMap = {
      'Storage Unit': 'storage_unit',
      'Spare Unit': 'spare_unit',
      'Horizontal Storage': 'sku_holder',
      'Vertical Storage': 'vertical_sku_holder',
      'Square Boundary': 'square_boundary',
      'Solid Boundary': 'solid_boundary',
      'Dotted Boundary': 'dotted_boundary'
    };

    // Create reverse lookup: SKU name -> location IDs (with all case variations)
    const skuNameToLocationIds = {};
    if (layoutComponentsMock?.locations) {
      layoutComponentsMock.locations.forEach(loc => {
        if (loc.sku_name && loc.location_id) {
          if (!skuNameToLocationIds[loc.sku_name]) {
            skuNameToLocationIds[loc.sku_name] = [];
          }
          // Add all case variations of the location ID
          skuNameToLocationIds[loc.sku_name].push(loc.location_id);
          skuNameToLocationIds[loc.sku_name].push(loc.location_id.toUpperCase());
          skuNameToLocationIds[loc.sku_name].push(loc.location_id.toLowerCase());
        }
      });
    }

    unit.layoutData.items.forEach((item, index) => {
      const itemKey = getLayoutItemKey(item) || `${unit.id}-${item.id || index}`;
      let matchesFilters = true;

      const locationCompartmentMatches = [];
      const skuCompartmentMatches = [];

      if (selectedLocationTag) {
        const itemLevelMatch = [item.locationId, item.locationCode, item.locationTag, item.primaryLocationId]
          .some((value) => typeof value === 'string' && value.trim() === selectedLocationTag);

        // Check item-level locationIds array
        let itemLocationIdsMatch = false;
        if (Array.isArray(item.locationIds)) {
          itemLocationIdsMatch = item.locationIds.includes(selectedLocationTag);
        }

        // Check item-level levelLocationMappings (vertical racks)
        let itemLevelMappingsMatch = false;
        if (Array.isArray(item.levelLocationMappings)) {
          itemLevelMappingsMatch = item.levelLocationMappings.some(mapping => 
            (mapping?.locationId === selectedLocationTag || mapping?.locId === selectedLocationTag)
          );
        }

        if (item.compartmentContents) {
          Object.entries(item.compartmentContents).forEach(([compartmentId, content]) => {
            if (!content) {
              return;
            }

            const matches = (
              content.locationId === selectedLocationTag ||
              content.uniqueId === selectedLocationTag ||
              content.primaryLocationId === selectedLocationTag ||
              (Array.isArray(content.locationIds) && content.locationIds.includes(selectedLocationTag)) ||
              (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.some(mapping =>
                mapping?.locationId === selectedLocationTag || mapping?.locId === selectedLocationTag
              ))
            );

            if (matches) {
              locationCompartmentMatches.push(compartmentId);
            }
          });
        }

        const hasLocationMatch = itemLevelMatch || itemLocationIdsMatch || itemLevelMappingsMatch || locationCompartmentMatches.length > 0;
        matchesFilters = matchesFilters && hasLocationMatch;
      }

      if (selectedSku) {
        // Get location IDs that have this SKU name
        const locationIdsForSku = skuNameToLocationIds[selectedSku] || [];
        
        let itemLevelSkuMatch = false;
        itemLevelSkuMatch = [item.sku, item.skuId, item.locationId]
          .some((value) => typeof value === 'string' && (value.trim() === selectedSku || locationIdsForSku.includes(value.trim())));

        // Check item-level locationIds array
        let itemLocationIdsSkuMatch = false;
        if (Array.isArray(item.locationIds)) {
          itemLocationIdsSkuMatch = item.locationIds.some(locId => locationIdsForSku.includes(locId));
        }

        // Check item-level levelLocationMappings (vertical racks)
        let itemLevelMappingsSkuMatch = false;
        if (Array.isArray(item.levelLocationMappings)) {
          itemLevelMappingsSkuMatch = item.levelLocationMappings.some(mapping => {
            const locId = mapping?.locationId || mapping?.locId;
            return locId && locationIdsForSku.includes(locId);
          });
        }

        if (item.compartmentContents) {
          Object.entries(item.compartmentContents).forEach(([compartmentId, content]) => {
            if (!content) {
              return;
            }

            // Check all possible SKU/location fields
            const matches = (
              content.sku === selectedSku ||
              content.uniqueId === selectedSku ||
              content.primarySku === selectedSku ||
              content.locationId === selectedSku ||
              locationIdsForSku.includes(content.sku) ||
              locationIdsForSku.includes(content.uniqueId) ||
              locationIdsForSku.includes(content.locationId) ||
              locationIdsForSku.includes(content.primaryLocationId) ||
              (Array.isArray(content.locationIds) && content.locationIds.some(locId => locationIdsForSku.includes(locId))) ||
              (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.some(mapping => {
                const locId = mapping?.locationId || mapping?.locId;
                return locId && locationIdsForSku.includes(locId);
              }))
            );

            if (matches) {
              skuCompartmentMatches.push(compartmentId);
            }
          });
        }

        const hasSkuMatch = itemLevelSkuMatch || itemLocationIdsSkuMatch || itemLevelMappingsSkuMatch || skuCompartmentMatches.length > 0;
        matchesFilters = matchesFilters && hasSkuMatch;
      }

      if (selectedAsset) {
        const itemType = typeMap[selectedAsset] || selectedAsset.toLowerCase().replace(/ /g, '_');
        const assetMatches = item.type === itemType;
        matchesFilters = matchesFilters && assetMatches;
      }

      if (!matchesFilters) {
        return;
      }

      highlightedItemKeys.push(itemKey);

      let compartmentHighlights = [];
      if (locationCompartmentMatches.length && skuCompartmentMatches.length) {
        compartmentHighlights = locationCompartmentMatches.filter((id) => skuCompartmentMatches.includes(id));
      } else if (locationCompartmentMatches.length) {
        compartmentHighlights = locationCompartmentMatches;
      } else if (skuCompartmentMatches.length) {
        compartmentHighlights = skuCompartmentMatches;
      }

      if (compartmentHighlights.length) {
        compartmentMap[itemKey] = Array.from(new Set(compartmentHighlights));
      }
    });

    return { itemKeys: highlightedItemKeys, compartmentMap };
  }, [selectedUnitForDemo, selectedLocationTag, selectedSku, selectedAsset, warehouseUnits]);

  const filteredItemKeys = highlightData.itemKeys;
  const highlightedCompartmentsMap = highlightData.compartmentMap;

  // Dropdown filter handlers
  const handleLocationTagChange = (e) => {
    const value = e.target.value;
    setSelectedLocationTag(value);
  };

  const handleSkuChange = (e) => {
    const value = e.target.value;
    setSelectedSku(value);
  };

  const handleAssetChange = (e) => {
    const value = e.target.value;
    setSelectedAsset(value);
  };

  const clearDropdownSearch = () => {
    setSelectedLocationTag('');
    setSelectedSku('');
    setSelectedAsset('');
  };

  return (
    <div className="warehouse-dashboard">
      {/* Clean Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb-nav">
            <button 
              className={`breadcrumb-item ${currentSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentSection('dashboard')}
            >
              Dashboard
            </button>
            {selectedUnit && (
              <>
                <span className="breadcrumb-separator">›</span>
                <button 
                  className={`breadcrumb-item ${currentSection === 'live-view' ? 'active' : ''}`}
                  onClick={() => setCurrentSection('live-view')}
                >
                  {warehouseUnits.find(u => u.id === selectedUnit)?.name || 'Unit'} - Live View
                </button>
              </>
            )}
            {currentSection === 'layout-builder' && selectedUnit && (
              <>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-item active">
                  Layout Builder
                </span>
              </>
            )}
          </div>
          <div className="page-title">
            <h1>Warehouse Layouts</h1>
            <span className="live-badge">LIVE</span>
          </div>
          <p className="page-subtitle">Interactive facility layout and asset management</p>
        </div>
        <div className="header-right">
          <div className="header-actions">
            {/* Layout Builder and Export buttons removed */}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {currentSection === 'layout-builder' ? (
          <div className="layout-builder-container">
            <div className="layout-builder-header">
              <h2>Layout Builder - {warehouseUnits.find(u => u.id === selectedUnit)?.name || 'Unit'}</h2>
              <button 
                className="btn secondary"
                onClick={() => setCurrentSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <WarehouseDesigner onBack={() => setCurrentSection('dashboard')} />
          </div>
        ) : (
          <>
        {/* Live Warehouse Maps Section */}
        <div className="maps-section">
          <div className="section-header">
            <h2 className="section-title">Live Warehouse Maps</h2>
            <div className="section-controls">
              {/* Global Search Dropdown */}
              <div className="global-search-container">
                <div className="global-search-input-container">
                  <input
                    type="text"
                    placeholder="🔍 Search across all maps..."
                    value={globalSearchQuery}
                    onChange={handleGlobalSearchChange}
                    className="global-search-input"
                  />
                  {globalSearchQuery && (
                    <button 
                      className="clear-search-btn"
                      onClick={clearGlobalSearch}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {showGlobalSearchDropdown && (
                  <div className="global-search-dropdown">
                    <div className="search-dropdown-header">
                      <div className="search-type-filters">
                        <button
                          className={`search-type-btn ${globalSearchType === 'all' ? 'active' : ''}`}
                          onClick={() => handleGlobalSearchTypeChange('all')}
                        >
                          All
                        </button>
                        <button
                          className={`search-type-btn ${globalSearchType === 'items' ? 'active' : ''}`}
                          onClick={() => handleGlobalSearchTypeChange('items')}
                        >
                          Items
                        </button>
                        <button
                          className={`search-type-btn ${globalSearchType === 'locations' ? 'active' : ''}`}
                          onClick={() => handleGlobalSearchTypeChange('locations')}
                        >
                          Locations
                        </button>
                        <button
                          className={`search-type-btn ${globalSearchType === 'zones' ? 'active' : ''}`}
                          onClick={() => handleGlobalSearchTypeChange('zones')}
                        >
                          Zones
                        </button>
                      </div>
                    </div>
                    
                    <div className="search-results-container">
                      {globalSearchResults.length === 0 ? (
                        <div className="no-search-results">
                          <div className="no-results-icon">🔍</div>
                          <div className="no-results-text">No results found</div>
                          <div className="no-results-hint">Try different keywords or search type</div>
                        </div>
                      ) : (
                        globalSearchResults.map((unitResult, unitIndex) => (
                          <div key={unitIndex} className="search-unit-group">
                            <div className="search-unit-header">
                              <span className="unit-icon">🏭</span>
                              <span className="unit-name">{unitResult.unit.name}</span>
                              <span className="result-count">{unitResult.count} results</span>
                            </div>
                            
                            <div className="search-unit-results">
                              {unitResult.results.slice(0, 5).map((result, resultIndex) => (
                                <button
                                  key={resultIndex}
                                  className="search-result-item"
                                  onClick={() => handleGlobalSearchResultClick(result)}
                                >
                                  <div className="result-icon">
                                    {result.type === 'item' && '📦'}
                                    {result.type === 'location' && '📍'}
                                    {result.type === 'zone' && '🏢'}
                                  </div>
                                  <div className="result-content">
                                    <div className="result-title">{result.title}</div>
                                    <div className="result-subtitle">{result.subtitle}</div>
                                  </div>
                                  <div className="result-arrow">→</div>
                                </button>
                              ))}
                              
                              {unitResult.results.length > 5 && (
                                <div className="more-results">
                                  +{unitResult.results.length - 5} more results
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hierarchical Filter Dropdown */}
              <div className="filter-dropdown-container">
                <button 
                  className="control-btn filter-btn"
                  onClick={toggleFilterDropdown}
                >
                  🏭 {getFilterLabel()} ▼
                </button>
                {showFilterDropdown && (
                  <div className="filter-dropdown-menu">
                    <div className="filter-dropdown-header">Filter by Warehouse</div>
                    
                    {/* All Units */}
                    <button
                      className={`filter-option ${selectedFilter === 'all' ? 'selected' : ''}`}
                      onClick={() => handleFilterSelect('all')}
                    >
                      <span className="filter-icon">🏢</span>
                      <div className="filter-content">
                        <div className="filter-label">All Units</div>
                        <div className="filter-count">{warehouseUnits.length} units</div>
                      </div>
                    </button>
                    
                    <div className="filter-divider"></div>
                    
                    {/* Warehouse Groups */}
                    {Object.entries(hierarchicalFilters).map(([key, filter]) => {
                      if (key === 'all') return null;
                      
                      const hasChildren = filter.children && Object.keys(filter.children).length > 0;
                      if (!hasChildren) return null;
                      
                      return (
                        <div key={key} className="filter-group">
                          <button
                            className={`filter-option warehouse-option ${selectedFilter === key ? 'selected' : ''}`}
                            onClick={() => handleFilterSelect(key)}
                          >
                            <span className="filter-icon">🏭</span>
                            <div className="filter-content">
                              <div className="filter-label">{filter.label}</div>
                              <div className="filter-count">{Object.keys(filter.children).length} units</div>
                            </div>
                          </button>
                          
                          {/* Child Units */}
                          <div className="filter-children">
                            {Object.entries(filter.children).map(([unitId, unit]) => (
                              <button
                                key={unitId}
                                className={`filter-option unit-option ${selectedFilter === unitId ? 'selected' : ''}`}
                                onClick={() => handleFilterSelect(unitId)}
                              >
                                <span className="filter-icon">📦</span>
                                <div className="filter-content">
                                  <div className="filter-label">{unit.label}</div>
                                  <div className="filter-subtitle">{unit.subtitle}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <button 
                className="control-btn primary"
                onClick={handleExpandToggle}
              >
                {isExpanded ? 'Collapse' : 'View All'}
              </button>
            </div>
          </div>
          
          {/* Filter Results Indicator */}
          {selectedFilter !== 'all' && (
            <div className="filter-results-indicator">
              <span className="filter-results-text">
                Showing {filteredUnits.length} of {warehouseUnits.length} units
                {selectedFilter !== 'all' && (
                  <button 
                    className="clear-filter-btn"
                    onClick={() => handleFilterSelect('all')}
                    title="Clear filter"
                  >
                    ✕ Clear Filter
                  </button>
                )}
              </span>
            </div>
          )}
          
          <div className={`warehouse-scroll-container ${isExpanded ? 'expanded' : ''}`}>
            <div className={`warehouse-grid-horizontal ${isExpanded ? 'expanded-grid' : ''}`}>
              {filteredUnits.map((unit) => (
                <div key={unit.id} className="warehouse-unit-card">
                  <div className="unit-header">
                    <div className="unit-status">
                      <span className={`status-indicator ${unit.status.toLowerCase()}`}>
                        {unit.status}
                      </span>
                    </div>
                    <h3 className="unit-name">{unit.name}</h3>
                    <p className="unit-subtitle">{unit.subtitle}</p>
                  </div>
                  
                  <div className="unit-content">
                    <p className="unit-description">{unit.details}</p>
                    
                    <div className="unit-metrics">
                      <div className="metric">
                        <span className="metric-label">Utilization:</span>
                        <span className="metric-value">{unit.utilization}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Zones:</span>
                        <span className="metric-value">{unit.zones}</span>
                      </div>
                      {unit.temperature && (
                        <div className="metric">
                          <span className="metric-label">Temperature:</span>
                          <span className="metric-value">{unit.temperature}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="unit-actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => {
                          setSelectedUnitForDemo(unit.id);
                          setShowDemoMapModal(true);
                        }}
                      >
                        View Live
                      </button>
                      {unit.isCustomLayout ? (
                        <>
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => {
                              // Load layout back into builder
                              if (unit.layoutData && unit.layoutData.items) {
                                localStorage.setItem('loadLayoutData', JSON.stringify(unit.layoutData));
                                setCurrentSection('layout-builder');
                              }
                            }}
                          >
                            Edit Layout
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteLayout(unit.id)}
                          >
                            Delete Layout
                          </button>
                        </>
                      ) : (
                        <button className="action-btn edit-btn">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Notifications Panel */}
        <div className="notifications-section">
          <div className="section-header">
            <h2 className="section-title">Real-time Notifications</h2>
            <div className="section-controls">
              <button 
                className="control-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark All Read
              </button>
              <button 
                className="control-btn primary"
                onClick={handleClearAllNotifications}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="notifications-container">
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.type} ${notification.priority}`}>
                  <div className="notification-indicator">
                    <div className={`notification-icon ${notification.type}`}>
                      {notification.type === 'success' && '✓'}
                      {notification.type === 'warning' && '⚠'}
                      {notification.type === 'error' && '✕'}
                      {notification.type === 'info' && 'ℹ'}
                    </div>
                    {notification.priority === 'critical' && <div className="priority-pulse"></div>}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4 className="notification-title">{notification.title}</h4>
                      <div className="notification-meta">
                        <span className={`unit-tag ${notification.unit.toLowerCase().replace(' ', '')}`}>
                          {notification.unit}
                        </span>
                        <span className={`priority-badge ${notification.priority}`}>
                          {notification.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="notification-message">{notification.message}</p>
                    
                    <div className="notification-footer">
                      <span className="notification-timestamp">{notification.timestamp}</span>
                      <div className="notification-actions">
                        <button 
                          className="notification-btn"
                          onClick={() => handleNotificationAction(notification.id, 'view')}
                        >
                          View
                        </button>
                        <button 
                          className="notification-btn dismiss"
                          onClick={() => handleNotificationAction(notification.id, 'dismiss')}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="notifications-summary">
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-count">{notifications.filter(n => n.priority === 'critical').length}</span>
                  <span className="summary-label">Critical</span>
                </div>
                <div className="summary-item">
                  <span className="summary-count">{notifications.filter(n => n.priority === 'high').length}</span>
                  <span className="summary-label">High</span>
                </div>
                <div className="summary-item">
                  <span className="summary-count">{notifications.filter(n => n.priority === 'medium').length}</span>
                  <span className="summary-label">Medium</span>
                </div>
                <div className="summary-item">
                  <span className="summary-count">{notifications.filter(n => n.priority === 'low').length}</span>
                  <span className="summary-label">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Create New Unit Modal */}
      {showCreateUnitModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUnitModal(false)}>
          <div className="modal-content create-unit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Warehouse Unit</h3>
              <button className="close-btn" onClick={() => setShowCreateUnitModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Unit Name</label>
                <input type="text" placeholder="Enter unit name (e.g., Unit 7)" />
              </div>
              <div className="form-group">
                <label>Floor Plan</label>
                <select>
                  <option>Floor Plan 1</option>
                  <option>Floor Plan 2</option>
                  <option>Floor Plan 3</option>
                  <option>Floor Plan 4</option>
                </select>
              </div>
              <div className="form-group">
                <label>Building</label>
                <select>
                  <option>Building 1</option>
                  <option>Building 2</option>
                  <option>Building 3</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unit Type</label>
                <select>
                  <option>General Storage</option>
                  <option>Cold Storage</option>
                  <option>Distribution Hub</option>
                  <option>Hazmat Storage</option>
                  <option>Returns Processing</option>
                </select>
              </div>
              <div className="form-group">
                <label>Initial Zones</label>
                <input type="number" placeholder="Number of zones (e.g., 8)" min="1" max="20" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setShowCreateUnitModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={() => {
                console.log('Creating new unit...');
                setShowCreateUnitModal(false);
              }}>
                Create Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Template</h3>
              <button className="close-btn" onClick={() => setShowTemplateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="template-grid">
                <div className="template-card" onClick={() => {
                  console.log('Using standard warehouse template');
                  setShowTemplateModal(false);
                }}>
                  <div className="template-icon">🏭</div>
                  <h4>Standard Warehouse</h4>
                  <p>Basic layout with storage, receiving, and dispatch zones</p>
                </div>
                <div className="template-card" onClick={() => {
                  console.log('Using cold storage template');
                  setShowTemplateModal(false);
                }}>
                  <div className="template-icon">❄️</div>
                  <h4>Cold Storage</h4>
                  <p>Temperature-controlled storage with specialized zones</p>
                </div>
                <div className="template-card" onClick={() => {
                  console.log('Using distribution center template');
                  setShowTemplateModal(false);
                }}>
                  <div className="template-icon">📦</div>
                  <h4>Distribution Center</h4>
                  <p>High-throughput layout optimized for fast processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Details Modal */}
      {selectedZone && (
        <div className="zone-details-modal" onClick={() => setSelectedZone(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedZone.name}</h3>
              <button className="close-btn" onClick={() => setSelectedZone(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Zone Type: {selectedZone.type}</p>
              <p>Status: Active</p>
              <p>Capacity: 85%</p>
              <p>Last Activity: 2 hours ago</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Map Modal */}
      {showDemoMapModal && selectedUnitForDemo && (
        <div 
          className={`demo-map-modal-overlay ${isFullscreen ? 'fullscreen-mode' : ''}`} 
          onClick={() => !isFullscreen && setShowDemoMapModal(false)}
          style={isFullscreen ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            backgroundColor: '#fff'
          } : {}}
        >
          <div 
            className="demo-map-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={isFullscreen ? {
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              margin: 0,
              borderRadius: 0
            } : {}}
          >
            <div className="demo-map-header">
              <div className="demo-map-title">
                <h2>{(() => {
                  const unit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
                  return unit ? unit.name : 'Warehouse Unit';
                })()}</h2>
                <div className="demo-map-status">
                  {(() => {
                    const unit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
                    const status = unit ? unit.status : 'UNKNOWN';
                    return (
                      <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
                    );
                  })()}
                </div>
              </div>
              
              {/* Enhanced Dropdown Search Filters - Moved to Header */}
              <div className="demo-map-search-inline">
                <div className="search-dropdown-filters">
                  <div className="dropdown-filter">
                    <select 
                      value={selectedLocationTag} 
                      onChange={handleLocationTagChange}
                      className="search-dropdown"
                    >
                      <option value="">All Locations</option>
                      {availableLocationTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="dropdown-filter">
                    <select 
                      value={selectedSku} 
                      onChange={handleSkuChange}
                      className="search-dropdown"
                    >
                      <option value="">All SKUs</option>
                      {availableSkus.map(sku => (
                        <option key={sku} value={sku}>{sku}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="dropdown-filter">
                    <select 
                      value={selectedAsset} 
                      onChange={handleAssetChange}
                      className="search-dropdown"
                    >
                      <option value="">All Assets</option>
                      {availableAssets.map(asset => (
                        <option key={asset} value={asset}>{asset}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Clear button only shows when filters are active */}
                  {(selectedLocationTag || selectedSku || selectedAsset) && (
                    <div className="dropdown-filter">
                      <button 
                        className="search-clear-btn-dropdown" 
                        onClick={clearDropdownSearch}
                        title="Clear All"
                      >
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="demo-map-controls">
                <div className="dropdown-filter">
                  <select
                    value={autoRefreshMinutes}
                    onChange={(e) => setAutoRefreshMinutes(Number(e.target.value) || 0)}
                    className="search-dropdown"
                    title="Auto Refresh"
                    disabled={isRefreshing}
                  >
                    <option value={0}>Off</option>
                    <option value={1}>1 min</option>
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                  </select>
                </div>
                {lastRefreshedAt && (
                  <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }} title={lastRefreshedAt.toLocaleString()}>
                    Updated {lastRefreshedAt.toLocaleTimeString()}
                  </div>
                )}
                <button
                  className="demo-map-fullscreen-btn"
                  onClick={() => {
                    console.log('MapView - Refresh button clicked');
                    void refreshLiveData();
                  }}
                  title="Refresh"
                  type="button"
                  disabled={isRefreshing}
                  style={{ opacity: isRefreshing ? 0.6 : 1 }}
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
                {isFullscreen ? (
                  <button 
                    className="demo-map-fullscreen-btn" 
                    onClick={handleExitFullscreen}
                    title="Exit fullscreen"
                    type="button"
                  >
                    ⛶
                  </button>
                ) : (
                  <button 
                    className="demo-map-fullscreen-btn" 
                    onClick={handleOpenFullscreen}
                    title="Enter fullscreen"
                    type="button"
                  >
                    ⛶
                  </button>
                )}
                {!isFullscreen && (
                  <button className="demo-map-close-btn" onClick={() => setShowDemoMapModal(false)} type="button">×</button>
                )}
              </div>
            </div>
            
            {/* Search Results - Moved outside header */}
            <div className="demo-map-search-results">
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="search-results">
                  <div className="search-results-header">
                    <span>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="search-results-list">
                    {searchResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="search-result-item">
                        <div className="search-result-icon">📍</div>
                        <div className="search-result-content">
                          <div className="search-result-title">{result.title}</div>
                          <div className="search-result-subtitle">{result.subtitle}</div>
                        </div>
                      </div>
                    ))}
                    {searchResults.length > 5 && (
                      <div className="search-result-more">
                        +{searchResults.length - 5} more results
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className={`demo-map-body ${isDemoUnit ? '' : 'demo-map-body-single'}`} style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch' }}>
              <div className="demo-map-canvas" style={{ flex: 1 }}>
                {(() => {
                  const unit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
                  
                  // If it's a custom layout, render the actual layout
                  console.log('Debug - Unit data:', unit);
                  console.log('Debug - Is custom layout:', unit?.isCustomLayout);
                  console.log('Debug - Layout data:', unit?.layoutData);
                  
                  if (unit && unit.isCustomLayout && unit.layoutData && Array.isArray(unit.layoutData.items)) {
                    const layoutItems = unit.layoutData.items;
                    if (layoutItems.length === 0) {
                      return (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px'
                          }}
                        />
                      );
                    }

                    return (
                      <SavedLayoutRenderer
                        items={layoutItems}
                        metadata={{
                          name: unit.layoutData.name || unit.name,
                          timestamp: unit.layoutData.timestamp
                        }}
                        width="100%"
                        height="100%"
                        background="transparent"
                        showLabels={false}
                        showMetadata={false}
                        highlightedKeys={filteredItemKeys}
                        filteredKeys={filteredItemKeys}
                        highlightedCompartmentsMap={highlightedCompartmentsMap}
                        padding={60}
                        allowUpscale={false}
                        fitMode="contain"
                        stageBackground="transparent"
                        stageBorder="none"
                        stageShadow="none"
                        stageBorderRadius="0px"
                        onItemClick={(item, index) => {
                          console.log('WarehouseMapView - Item clicked:', item);
                          console.log('WarehouseMapView - Item index:', index);
                          setSelectedItem(item);
                          setShowLocationDetails(true);
                        }}
                      />
                    );
                  }

                  // For default units, show demo map
                  const demoData = demoMapsData[selectedUnitForDemo];
                  if (!demoData) {
                    return (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        <h3>No map data available</h3>
                        <p>This warehouse unit doesn't have map data configured.</p>
                        <p><strong>Unit ID:</strong> {selectedUnitForDemo}</p>
                        <p><strong>Unit Type:</strong> {unit?.isCustomLayout ? 'Custom Layout' : 'Default Unit'}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <svg width="700" height="320" viewBox="0 0 700 320" className="warehouse-svg">
                      {/* Background */}
                      <rect width="700" height="320" fill="#ffffff" stroke="#dee2e6" strokeWidth="2" rx="8"/>
                      
                      {/* Header with location info */}
                      <rect x="10" y="10" width="680" height="25" fill="#f8f9fa" stroke="#dee2e6" strokeWidth="1"/>
                      <text x="20" y="27" fontSize="14" fontWeight="bold" fill="#333">
                        {demoData.name}
                      </text>
                      {demoData.location && (
                        <text x="600" y="27" fontSize="12" fill="#666">
                          Location: {demoData.location}
                        </text>
                      )}
                      
                      {/* Enhanced demo zones with operational data */}
                      {demoData.zones.map((zone, index) => {
                        // Generate operational data for demo zones
                        const generateDemoOpData = (zone, index) => {
                          if (zone.type === 'storage' || zone.type === 'overflow') {
                            return {
                              type: 'storage',
                              unitId: `STG-${String(index + 1).padStart(3, '0')}`,
                              location: {
                                zone: ['A', 'B', 'C', 'D'][index % 4],
                                aisle: Math.floor(index / 4) + 1,
                                position: (index % 10) + 1
                              },
                              capacity: zone.capacity || 50,
                              occupied: zone.items || Math.floor(Math.random() * 40) + 10,
                              utilization: Math.round(((zone.items || 30) / (zone.capacity || 50)) * 100),
                              status: 'operational'
                            };
                          } else {
                            return {
                              type: 'zone',
                              zoneId: zone.id,
                              throughput: Math.floor(Math.random() * 500) + 100,
                              activeWorkers: Math.floor(Math.random() * 5) + 1,
                              efficiency: (85 + Math.random() * 12).toFixed(1) + '%',
                              status: 'operational'
                            };
                          }
                        };

                        const opData = generateDemoOpData(zone, index);
                        const isInteractive = opData && (opData.type === 'storage' || opData.type === 'zone');

                        const getStatusColor = (status) => {
                          return status === 'operational' ? '#28a745' : '#ffc107';
                        };

                        const getUtilizationColor = (utilization) => {
                          if (utilization >= 90) return '#dc3545';
                          if (utilization >= 75) return '#ffc107';
                          if (utilization >= 50) return '#28a745';
                          return '#17a2b8';
                        };

                        return (
                          <g key={zone.id}>
                            <rect
                              x={zone.x}
                              y={zone.y}
                              width={zone.width}
                              height={zone.height}
                              fill={zone.color}
                              fillOpacity="0.8"
                              stroke="#333"
                              strokeWidth="2"
                              rx="4"
                              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                            />
                            
                            {/* Operational status indicator */}
                            <circle
                              cx={zone.x + zone.width - 8}
                              cy={zone.y + 8}
                              r="4"
                              fill={getStatusColor(opData.status)}
                              stroke="white"
                              strokeWidth="1"
                            />
                            
                            {/* Utilization bar for storage zones */}
                            {opData.type === 'storage' && zone.width > 40 && (
                              <g>
                                <rect
                                  x={zone.x + 5}
                                  y={zone.y + zone.height - 12}
                                  width={zone.width - 10}
                                  height="4"
                                  fill="#e0e0e0"
                                  rx="2"
                                />
                                <rect
                                  x={zone.x + 5}
                                  y={zone.y + zone.height - 12}
                                  width={(zone.width - 10) * (opData.utilization / 100)}
                                  height="4"
                                  fill={getUtilizationColor(opData.utilization)}
                                  rx="2"
                                />
                              </g>
                            )}
                            
                            {/* Storage unit metrics */}
                            {opData.type === 'storage' && zone.width > 60 && zone.height > 40 && (
                              <g>
                                {/* Unit ID */}
                                <text
                                  x={zone.x + 5}
                                  y={zone.y + 15}
                                  fontSize="9"
                                  fill="#333"
                                  fontWeight="bold"
                                >
                                  {opData.unitId}
                                </text>
                                
                                {/* Capacity info */}
                                <text
                                  x={zone.x + zone.width / 2}
                                  y={zone.y + zone.height / 2 + 10}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="#666"
                                  fontWeight="bold"
                                >
                                  {opData.occupied}/{opData.capacity}
                                </text>
                                
                                {/* Location info */}
                                <text
                                  x={zone.x + zone.width / 2}
                                  y={zone.y + zone.height / 2 + 23}
                                  textAnchor="middle"
                                  fontSize="8"
                                  fill="#888"
                                >
                                  {opData.location.zone}-{opData.location.aisle}-{opData.location.position}
                                </text>
                              </g>
                            )}

                            {/* Zone metrics for operational zones */}
                            {opData.type === 'zone' && zone.width > 80 && zone.height > 50 && (
                              <g>
                                {/* Zone ID */}
                                <text
                                  x={zone.x + 8}
                                  y={zone.y + 18}
                                  fontSize="11"
                                  fill="#333"
                                  fontWeight="bold"
                                >
                                  {zone.id}
                                </text>
                                
                                {/* Throughput */}
                                <text
                                  x={zone.x + 8}
                                  y={zone.y + 32}
                                  fontSize="9"
                                  fill="#666"
                                >
                                  {opData.throughput} items/hr
                                </text>
                                
                                {/* Workers */}
                                <text
                                  x={zone.x + 8}
                                  y={zone.y + 45}
                                  fontSize="9"
                                  fill="#666"
                                >
                                  👥 {opData.activeWorkers}
                                </text>
                                
                                {/* Efficiency */}
                                <text
                                  x={zone.x + zone.width - 8}
                                  y={zone.y + 18}
                                  textAnchor="end"
                                  fontSize="9"
                                  fill={parseFloat(opData.efficiency) > 90 ? "#28a745" : "#ffc107"}
                                  fontWeight="bold"
                                >
                                  {opData.efficiency}
                                </text>
                              </g>
                            )}
                            
                            {/* Fixed info icon for interactive zones */}
                            {isInteractive && (
                              <g>
                                <circle
                                  cx={zone.x + zone.width - 12}
                                  cy={zone.y + 12}
                                  r="8"
                                  fill="rgba(0, 123, 255, 0.9)"
                                  stroke="white"
                                  strokeWidth="2"
                                  style={{ cursor: 'pointer' }}
                                />
                                <text
                                  x={zone.x + zone.width - 12}
                                  y={zone.y + 12}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fontSize="10"
                                  fill="white"
                                  fontWeight="bold"
                                >
                                  ℹ
                                </text>
                              </g>
                            )}
                            
                            {/* Unified Demo Zone Label - Below Every Zone */}
                            {(() => {
                              // Generate smart label for demo zones
                              const getDemoZoneLabel = () => {
                                if (zone.label && zone.label.trim()) return zone.label.trim();
                                if (zone.name && zone.name.trim()) return zone.name.trim();
                                if (zone.id && zone.id.trim()) return zone.id.trim();
                                
                                // Auto-generate based on type
                                const typeLabels = {
                                  'storage': 'ZONE',
                                  'receiving': 'RCV',
                                  'dispatch': 'DSP',
                                  'office': 'OFF',
                                  'overflow': 'OVF'
                                };
                                
                                const prefix = typeLabels[zone.type] || 'ZONE';
                                return `${prefix}-${String(index + 1).padStart(2, '0')}`;
                              };

                              const label = getDemoZoneLabel();
                              if (!label) return null;

                              // Calculate label styling for demo zones
                              const fontSize = Math.min(Math.max(zone.width / 12, 9), 14);
                              let labelColor = '#2c3e50';
                              let bgColor = 'rgba(52, 152, 219, 0.1)';
                              let borderColor = '#3498db';
                              
                              // Different colors for different zone types
                              if (zone.type === 'receiving') {
                                labelColor = '#e67e22';
                                bgColor = 'rgba(230, 126, 34, 0.1)';
                                borderColor = '#f39c12';
                              } else if (zone.type === 'dispatch') {
                                labelColor = '#8e44ad';
                                bgColor = 'rgba(142, 68, 173, 0.1)';
                                borderColor = '#9b59b6';
                              } else if (zone.type === 'office') {
                                labelColor = '#27ae60';
                                bgColor = 'rgba(39, 174, 96, 0.1)';
                                borderColor = '#2ecc71';
                              }

                              return (
                                <g>
                                  {/* Label background */}
                                  <rect
                                    x={zone.x + zone.width / 2 - Math.max(label.length * fontSize * 0.3, 20)}
                                    y={zone.y + zone.height + 5}
                                    width={Math.max(label.length * fontSize * 0.6, 40)}
                                    height={fontSize + 6}
                                    fill={bgColor}
                                    stroke={borderColor}
                                    strokeWidth="1"
                                    rx="3"
                                  />
                                  {/* Label text */}
                                  <text
                                    x={zone.x + zone.width / 2}
                                    y={zone.y + zone.height + fontSize + 8}
                                    textAnchor="middle"
                                    fontSize={fontSize}
                                    fontWeight="600"
                                    fill={labelColor}
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })()}
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
              
              {/* Zone Information Panel - Always visible on the right */}
              <div className="demo-map-sidebar" style={{ width: '300px', flexShrink: 0, overflowY: 'auto', height: '100%' }}>
                {(() => {
                  const unit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
                  const demoData = demoMapsData[selectedUnitForDemo];
                  
                  // Show zone info for demo units
                  if (unit && !unit.isCustomLayout && demoData) {
                    return (
                      <>
                        <div className="demo-map-info">
                          <h3>Zone Information</h3>
                          <div className="zone-list">
                            {demoData.zones.map((zone) => (
                              <div key={zone.id} className="zone-info-item">
                                <div className="zone-color" style={{ backgroundColor: zone.color }}></div>
                                <div className="zone-details">
                                  <div className="zone-name">{zone.name}</div>
                                  <div className="zone-capacity">
                                    {zone.items}/{zone.capacity} items
                                    <div className="capacity-bar">
                                      <div 
                                        className="capacity-fill" 
                                        style={{ 
                                          width: `${zone.capacity > 0 ? (zone.items / zone.capacity) * 100 : 0}%`,
                                          backgroundColor: zone.color 
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="demo-map-equipment">
                          <h3>Equipment Status</h3>
                          <div className="equipment-list">
                            {demoData.equipment.map((equipment) => (
                              <div key={equipment.id} className="equipment-item">
                                <div className={`equipment-status ${equipment.status}`}></div>
                                <div className="equipment-info">
                                  <div className="equipment-name">{equipment.name}</div>
                                  <div className="equipment-details">
                                    Status: {equipment.status}
                                    {equipment.temp && <span> | Temp: {equipment.temp}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  }
                  
                  // Show Location Details Panel if an item is selected
                  if (showLocationDetails && selectedItem) {
                    return (
                      <div className="demo-map-info location-details-container">
                        <LocationDetailsPanel
                          selectedItem={selectedItem}
                          onClose={() => {
                            setShowLocationDetails(false);
                            setSelectedItem(null);
                          }}
                          isEmbedded={true}
                        />
                      </div>
                    );
                  }
                  
                  // Don't show Layout Components panel - only show when item is clicked
                  return null;
                })()}
              </div>
            </div>
            
            {isDemoUnit && (
              <div className="demo-map-footer">
                {shouldShowDemoLegend && (
                  <div className="demo-map-legend">
                    <div className="legend-item">
                      <div className="legend-color active"></div>
                      <span>Active Equipment</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color offline"></div>
                      <span>Offline Equipment</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color zone"></div>
                      <span>Storage Zones</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseMapView;
