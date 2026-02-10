'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WarehouseLayoutBuilder from '@/components/warehouse/WarehouseLayoutBuilder';
import LocationDetailsPanel from '@/components/warehouse/LocationDetailsPanel';
import WarehouseOverviewPanel from '@/components/warehouse/WarehouseOverviewPanel';
import SavedLayoutRenderer, { getLayoutItemKey } from '@/components/warehouse/SavedLayoutRenderer';
import summarizeStorageComponents from '@/lib/warehouse/utils/layoutComponentSummary';
import layoutComponentsMock from '@/lib/warehouse/data/layoutComponentsMock.json';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { locationTagService } from '@/src/services/locationTags';

// TypeScript interfaces
interface WarehouseLayout {
  id: string;
  name: string;
  location: string;
  size: string;
  status: string;
  utilization: number;
  zones: number;
  items: number;
  lastActivity: string;
  layoutData: {
    items: WarehouseItem[];
  };
}

interface WarehouseItem {
  type?: string;
  locationId?: string;
  locationCode?: string;
  locationTag?: string;
  primaryLocationId?: string;
  locationIds?: string[];
  levelLocationMappings?: Array<{ locationId?: string; locId?: string }>;
  compartmentContents?: Record<string, CompartmentContent>;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  id?: string;
  sku?: string;
  skuId?: string;
}

interface CompartmentContent {
  locationId?: string;
  primaryLocationId?: string;
  locationIds?: string[];
  levelLocationMappings?: Array<{ locationId?: string; locId?: string }>;
  levelIds?: string[];
  sku?: string;
  uniqueId?: string;
  primarySku?: string;
}

interface WarehouseUnit {
  id: string;
  name: string;
  subtitle: string;
  status: string;
  statusColor: string;
  utilization: number;
  zones: number;
  temperature?: number;
  details: string;
  isCustomLayout?: boolean;
  layoutData?: {
    items: WarehouseItem[];
  };
}

interface FacilityData {
  // Add properties as needed
  [key: string]: any;
}

interface WarehouseMapViewProps {
  facilityData?: FacilityData;
  initialSelectedLayoutId?: string | null;
  onModalClose?: () => void;
  fullscreenMode?: boolean;
}

const WarehouseMapView: React.FC<WarehouseMapViewProps> = ({ facilityData, initialSelectedLayoutId, onModalClose, fullscreenMode }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoutId = searchParams?.get('layoutId');
  
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedUnitForDemo, setSelectedUnitForDemo] = useState<string | null>(initialSelectedLayoutId || null);
  const [showDemoMapModal, setShowDemoMapModal] = useState<boolean>(!!initialSelectedLayoutId);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showCreateUnitModal, setShowCreateUnitModal] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('dashboard');
  const [searchType, setSearchType] = useState<string>('location'); // 'location' or 'item'
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState<boolean>(false);
  const [globalSearchType, setGlobalSearchType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dropdownSearchActive, setDropdownSearchActive] = useState<boolean>(false);
  const [availableLocationTags, setAvailableLocationTags] = useState<string[]>([]);
  const [availableSkus, setAvailableSkus] = useState<string[]>([]);
  const [availableAssets, setAvailableAssets] = useState<string[]>([]);
  const [selectedLocationTag, setSelectedLocationTag] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<WarehouseLayout[]>([]);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameFromDashboard, setCameFromDashboard] = useState(false);

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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState<number>(0);

  const refreshLiveData = useCallback(async () => {
    console.log('WarehouseMapView - Refresh triggered', { selectedUnitForDemo });
    setIsRefreshing(true);
    try {
      refreshSavedLayouts();
      window.dispatchEvent(new Event('layoutSaved'));

      if (!selectedUnitForDemo) {
        console.warn('WarehouseMapView - Refresh skipped: no selectedUnitForDemo');
        return;
      }

      const storedLayouts = localStorage.getItem('warehouseLayouts');
      if (!storedLayouts) {
        console.warn('WarehouseMapView - Refresh skipped: no warehouseLayouts in localStorage');
        return;
      }

      const parsedLayouts = JSON.parse(storedLayouts) as any[];
      const selectedLayout = parsedLayouts.find((layout) => layout?.id === selectedUnitForDemo);
      const unitId: string | undefined = selectedLayout?.orgUnit?.id || selectedLayout?.unitId;

      if (!unitId) {
        console.warn('WarehouseMapView - Refresh skipped: selected layout missing unitId/orgUnit.id', {
          selectedUnitForDemo,
          selectedLayout,
        });
        return;
      }

      const tags = await locationTagService.listByUnit(unitId);
      const tagNames = tags.map((tag) => tag.locationTagName).filter(Boolean);
      setAvailableLocationTags(tagNames);
    } catch (error) {
      console.error('Failed to refresh live map data:', error);
    } finally {
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
    setMounted(true);
    refreshSavedLayouts();
    // Reset transition state when layoutId changes
    setIsTransitioning(false);
    
    // Check if user came from main dashboard (has layoutId in URL)
    if (layoutId) {
      setCameFromDashboard(true);
      setSelectedUnitForDemo(layoutId);
      setShowDemoMapModal(true);
    }

    if (fullscreenMode && initialSelectedLayoutId) {
      setSelectedUnitForDemo(initialSelectedLayoutId);
      setShowDemoMapModal(true);
    }
  }, [layoutId]);

  // Handle browser back button to close modal
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showDemoMapModal) {
        setShowDemoMapModal(false);
        if (onModalClose) {
          onModalClose();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showDemoMapModal, onModalClose]);

  // Handle modal close with URL cleanup
  const handleCloseModal = useCallback(() => {
    setShowDemoMapModal(false);
    
    // Restore original URL when modal closes
    const originalUrl = window.location.pathname;
    window.history.pushState({}, '', originalUrl);
    
    if (onModalClose) {
      onModalClose();
    }
  }, [onModalClose]);

  const handleOpenFullscreenTab = useCallback(() => {
    if (!selectedUnitForDemo) return;

    const url = `/dashboard/warehouse-management/warehouse-map/fullscreen?layoutId=${encodeURIComponent(selectedUnitForDemo)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [selectedUnitForDemo]);

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
  const extractDropdownOptionsFromSelectedUnit = useCallback((unitId: string | null) => {
    if (!unitId) {
      setAvailableLocationTags([]);
      setAvailableSkus([]);
      setAvailableAssets([]);
      return;
    }

    // Find the selected unit from saved layouts
    const selectedLayout: WarehouseLayout | undefined = savedLayouts.find(layout => layout.id === unitId);
    
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
    const locationToSkuMap: Record<string, string> = {};
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

    const addLocation = (value: string | undefined) => {
      if (!value) return;
      const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
      if (normalized) {
        locationTags.add(normalized);
      }
    };

    const addSku = (value: string | undefined) => {
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

    const addAsset = (type: string | undefined) => {
      if (!type || type === 'square_boundary') return;
      // Map component types to readable names
      const typeMap = {
        'storage_unit': 'Storage Unit',
        'spare_unit': 'Spare Unit',
        'sku_holder': 'Horizontal Storage',
        'vertical_sku_holder': 'Vertical Storage',
        'open_storage_space': 'Open Storage Space',
        'dispatch_staging_area': 'Dispatch Staging Area',
        'grading_area': 'Grading Area',
        'processing_area': 'Processing Area',
        'production_area': 'Production Area',
        'packaging_area': 'Packaging Area',
        'cold_storage': 'Cold Storage',
        'solid_boundary': 'Solid Boundary',
        'dotted_boundary': 'Dotted Boundary'
      };
      const readableName = typeMap[type as keyof typeof typeMap] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      assets.add(readableName);
    };

    const collectLocationsFromContent = (content: CompartmentContent = {}) => {
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

    const collectLocationsFromItem = (item: WarehouseItem = {}) => {
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

    setAvailableLocationTags(Array.from(locationTags) as string[]);
    setAvailableSkus(Array.from(skus) as string[]);
    setAvailableAssets(Array.from(assets) as string[]);
  }, [savedLayouts]);

  // Extract dropdown options when selected unit changes
  useEffect(() => {
    extractDropdownOptionsFromSelectedUnit(selectedUnitForDemo);
  }, [selectedUnitForDemo, savedLayouts, extractDropdownOptionsFromSelectedUnit]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown && event.target && !(event.target as HTMLElement).closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // No default demo units - only show saved layouts
  const defaultUnits: WarehouseUnit[] = [];
  
  // Helper function to get status colors
  function getStatusColor(status: string) {
    const colors = {
      'operational': '#00D4AA',
      'offline': '#FF6B6B',
      'maintenance': '#FFB800',
      'planning': '#4ECDC4'
    };
    return colors[status as keyof typeof colors] || '#6C757D';
  }

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
  
  const warehouseUnits = [...defaultUnits, ...customLayoutUnits];

  const { layoutItemsForSummary, storageSummaries } = useMemo(() => {
    const result: {
      layoutItemsForSummary: WarehouseItem[];
      storageSummaries: any[];
    } = {
      layoutItemsForSummary: [] as WarehouseItem[],
      storageSummaries: [] as any[]
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
  const hierarchicalFilters: Record<string, any> = {
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
      children: customLayoutUnits.reduce((acc: Record<string, { label: string; subtitle: string }>, unit) => {
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

  // Demo map data - empty as we only use custom layouts
  const demoMapsData: Record<string, any> = {};

  // Real-time notifications data
  const notifications = [];

  const areas = [
    { name: 'Storage A', color: '#4A90E2', occupied: true },
    { name: 'Storage B', color: '#4A90E2', occupied: true },
    { name: 'Storage C', color: '#4A90E2', occupied: true },
    { name: 'Storage D', color: '#4A90E2', occupied: false },
    { name: 'Receiving', color: '#7ED321', occupied: true },
    { name: 'Dispatch', color: '#F5A623', occupied: true },
    { name: 'Office Area', color: '#BD10E0', occupied: true }
  ];

  const handleZoneClick = (zone: any) => {
    setSelectedZone(zone);
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (actionId: string, unitId?: string) => {
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
      case 'view-live':
        // Show demo map modal for specific unit and update URL
        if (unitId) {
          setSelectedUnitForDemo(unitId);
          setShowDemoMapModal(true);
          
          // Update URL to include the layout ID
          const unit = warehouseUnits.find(u => u.id === unitId);
          if (unit) {
            const layoutName = unit.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
            const newUrl = `${window.location.pathname}?map=${unit.id}&name=${layoutName}`;
            window.history.pushState({ mapId: unit.id, mapName: unit.name }, '', newUrl);
          }
        }
        break;
      case 'edit':
        // Navigate to layout builder for specific unit
        break;
      default:
        break;
    }
  };

  const handleDeleteLayout = (layoutId: string | undefined) => {
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

  const handleUnitAction = (unitId: string, action: string) => {
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

  // Search functionality
  const performSearch = (query: string, type: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: any[] = [];
    const searchTerm = query.toLowerCase();

    // Get current unit data
    const unit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
    if (!unit) return;

    // Search in custom layouts
    if (unit.isCustomLayout && unit.layoutData && unit.layoutData.items) {
      unit.layoutData.items.forEach((item: WarehouseItem, index: number) => {
        const itemId = `item-${index}`;
        
        // Generate operational data for search
        const generateSearchData = (item: WarehouseItem, index: number) => {
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
    const demoData = demoMapsData[selectedUnitForDemo || ''];
    if (demoData && demoData.zones) {
      demoData.zones.forEach((zone: any, index: number) => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query, searchType);
  };

  const handleSearchTypeChange = (type: string) => {
    setSearchType(type);
    performSearch(searchQuery, type);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };


  // Filter handlers
  const handleFilterSelect = (filterId: string) => {
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
  const performGlobalSearch = (query: string, searchType: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    const results: any[] = [];
    const searchTerm = query.toLowerCase();

    // Search through all warehouse units
    warehouseUnits.forEach(unit => {
      const unitResults: any[] = [];

      // Search in custom layouts
      if (unit.isCustomLayout && unit.layoutData && unit.layoutData.items) {
        unit.layoutData.items.forEach((item: WarehouseItem, index: number) => {
          const itemId = `${unit.id}-item-${index}`;
          
          // Generate search data for custom layout items
          const generateItemSearchData = (item: WarehouseItem, index: number) => {
            const baseData: any = {
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
              baseData.skus = Object.values(item.compartmentContents).map((content: any) => ({
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
              searchData.skus.forEach((skuData: any) => {
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
        demoData.zones.forEach((zone: any, index: number) => {
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
  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGlobalSearchQuery(query);
    performGlobalSearch(query, globalSearchType);
    setShowGlobalSearchDropdown(query.trim().length > 0);
  };

  const handleGlobalSearchTypeChange = (type: string) => {
    setGlobalSearchType(type);
    performGlobalSearch(globalSearchQuery, type);
  };

  const handleGlobalSearchResultClick = (result: any) => {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (showGlobalSearchDropdown && event.target && !(event.target as HTMLElement).closest('.global-search-container')) {
        setShowGlobalSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGlobalSearchDropdown]);

  const highlightData = useMemo(() => {
    const empty = { itemKeys: [] as string[], compartmentMap: {} as Record<string, string[]> };

    if (!selectedUnitForDemo || (!selectedLocationTag && !selectedSku && !selectedAsset)) {
      return empty;
    }

    const unit = warehouseUnits.find((u) => u.id === selectedUnitForDemo);
    if (!unit?.isCustomLayout || !unit?.layoutData?.items) {
      return empty;
    }

    const highlightedItemKeys: string[] = [];
    const compartmentMap: Record<string, string[]> = {};
    const typeMap: Record<string, string> = {
      'Storage Unit': 'storage_unit',
      'Spare Unit': 'spare_unit',
      'Horizontal Storage': 'sku_holder',
      'Vertical Storage': 'vertical_sku_holder',
      'Open Storage Space': 'storage_unit',
      'Dispatch Staging Area': 'storage_unit',
      'Grading Area': 'storage_unit',
      'Processing Area': 'storage_unit',
      'Production Area': 'storage_unit',
      'Packaging Area': 'storage_unit',
      'Cold Storage': 'storage_unit',
      'Square Boundary': 'square_boundary',
      'Solid Boundary': 'solid_boundary',
      'Dotted Boundary': 'dotted_boundary'
    };

    // Create reverse lookup: SKU name -> location IDs (with all case variations)
    const skuNameToLocationIds: Record<string, string[]> = {};
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

    unit.layoutData.items.forEach((item: WarehouseItem, index: number) => {
      const itemKey = getLayoutItemKey(item) || `${unit.id}-${item.id || index}`;
      let matchesFilters = true;

      const locationCompartmentMatches: string[] = [];
      const skuCompartmentMatches: string[] = [];

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
          itemLevelMappingsMatch = item.levelLocationMappings.some((mapping: { locationId?: string; locId?: string }) => 
            (mapping?.locationId === selectedLocationTag || mapping?.locId === selectedLocationTag)
          );
        }

        if (item.compartmentContents) {
          Object.entries(item.compartmentContents).forEach(([compartmentId, content]) => {
            const typedContent = content as CompartmentContent;
            if (!typedContent) {
              return;
            }

            const matches = (
              typedContent.locationId === selectedLocationTag ||
              typedContent.uniqueId === selectedLocationTag ||
              typedContent.primaryLocationId === selectedLocationTag ||
              (Array.isArray(typedContent.locationIds) && typedContent.locationIds.includes(selectedLocationTag)) ||
              (Array.isArray(typedContent.levelLocationMappings) && typedContent.levelLocationMappings.some(mapping =>
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
          itemLevelMappingsSkuMatch = item.levelLocationMappings.some((mapping: { locationId?: string; locId?: string }) => {
            const locId = mapping?.locationId || mapping?.locId;
            return locId && locationIdsForSku.includes(locId);
          });
        }

        if (item.compartmentContents) {
          Object.entries(item.compartmentContents).forEach(([compartmentId, content]) => {
            const typedContent = content as CompartmentContent;
            if (!typedContent) {
              return;
            }

            // Check all possible SKU/location fields
            const matches = (
              typedContent.sku === selectedSku ||
              typedContent.uniqueId === selectedSku ||
              typedContent.primarySku === selectedSku ||
              typedContent.locationId === selectedSku ||
              locationIdsForSku.includes(typedContent.sku || '') ||
              locationIdsForSku.includes(typedContent.uniqueId || '') ||
              locationIdsForSku.includes(typedContent.locationId || '') ||
              locationIdsForSku.includes(typedContent.primaryLocationId || '') ||
              (Array.isArray(typedContent.locationIds) && typedContent.locationIds.some((locId: string) => locationIdsForSku.includes(locId))) ||
              (Array.isArray(typedContent.levelLocationMappings) && typedContent.levelLocationMappings.some(mapping => {
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

      let compartmentHighlights: string[] = [];
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
  const handleLocationTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocationTag(value);
  };

  const handleSkuChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSku(value);
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
            <WarehouseLayoutBuilder 
              initialOrgUnit={(() => {
                const unit = warehouseUnits.find(u => u.id === selectedUnit);
                return unit ? {
                  id: unit.id,
                  name: unit.name,
                  location: unit.subtitle.split(' - ')[0] || unit.subtitle
                } : null;
              })()}
              initialLayout={(() => {
                const unit = warehouseUnits.find(u => u.id === selectedUnit);
                return unit && unit.isCustomLayout && unit.layoutData ? unit.layoutData : null;
              })()}
            />
          </div>
        ) : (
          <div>
            {/* Header section removed */}
          
          {/* Unit cards display removed */}
        </div>
        )}

      {/* Create New Unit Modal */}
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
            className={`demo-map-modal-overlay ${fullscreenMode ? 'fullscreen-mode' : ''}`}
            onClick={() => {
              if (fullscreenMode) return;
              setShowDemoMapModal(false);
            }}
            style={fullscreenMode ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#0b1220',
              zIndex: 99999,
              padding: 0
            } : undefined}
          >
            <div 
              className="demo-map-modal-content" 
              onClick={(e) => e.stopPropagation()}
              style={fullscreenMode ? {
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: 0
              } : undefined}
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
                  <button
                    className="demo-map-fullscreen-btn"
                    onClick={() => {
                      console.log('WarehouseMapView - Refresh button clicked');
                      void refreshLiveData();
                    }}
                    title="Refresh"
                    type="button"
                    disabled={isRefreshing}
                    style={{ opacity: isRefreshing ? 0.6 : 1 }}
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button 
                    className="demo-map-fullscreen-btn" 
                    onClick={handleOpenFullscreenTab}
                    title="Fullscreen Preview"
                    type="button"
                  >
                    ⛶
                  </button>
                  <button className="demo-map-close-btn" onClick={handleCloseModal} type="button">×</button>
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
                    
                    // For default units, show demo map
                    const demoData = demoMapsData[selectedUnitForDemo];
                    const demoUnit = warehouseUnits.find(u => u.id === selectedUnitForDemo);
                    
                    // If it's a custom layout, render the actual layout
                    console.log('Debug - Unit data:', unit);
                    console.log('Debug - Is custom layout:', unit?.isCustomLayout);
                    console.log('Debug - Layout data:', unit?.layoutData);
                    
                    if (unit && unit.isCustomLayout && unit.layoutData && unit.layoutData.items && Array.isArray(unit.layoutData.items)) {
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
                            name: (unit.layoutData as any).name || (unit as any).name,
                            timestamp: (unit.layoutData as any).timestamp
                          }}
                          width="100%"
                          height="100%"
                          background="transparent"
                          showLabels={false}
                          showMetadata={false}
                          highlightedKeys={filteredItemKeys as any}
                          filteredKeys={filteredItemKeys as any}
                          highlightedCompartmentsMap={highlightedCompartmentsMap}
                          padding={60}
                          allowUpscale={false}
                          fitMode="contain"
                          stageBackground="transparent"
                          stageBorder="none"
                          stageShadow="none"
                          stageBorderRadius="0px"
                          onItemClick={(item: WarehouseItem, index: number) => {
                            console.log('WarehouseMapView - Item clicked:', item);
                            console.log('WarehouseMapView - Item index:', index);
                            setSelectedItem(item);
                            setShowLocationDetails(true);
                          }}
                        />
                      );
                    }

                    // For default units, show demo map
                    if (!demoData) {
                      return (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                          <h3>No map data available</h3>
                          <p>This warehouse unit doesn't have map data configured.</p>
                          <p><strong>Unit ID:</strong> {selectedUnitForDemo}</p>
                          <p><strong>Unit Type:</strong> {demoUnit?.isCustomLayout ? 'Custom Layout' : 'Default Unit'}</p>
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
                        {demoData.zones.map((zone: any, index: number) => {
                          // Generate operational data for demo zones
                          const generateDemoOpData = (zone: any, index: number) => {
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

                          const getStatusColor = (status: string) => {
                            return status === 'operational' ? '#28a745' : '#ffc107';
                          };

                          const getUtilizationColor = (utilization: number) => {
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
                                    width={(zone.width - 10) * ((opData.utilization || 0) / 100)}
                                    height="4"
                                    fill={getUtilizationColor(opData.utilization || 0)}
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
                                    {opData.location ? `${opData.location.zone}-${opData.location.aisle}-${opData.location.position}` : 'N/A'}
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
                                    fill={parseFloat(opData.efficiency || '0') > 90 ? "#28a745" : "#ffc107"}
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
                                  
                                  const prefix = typeLabels[zone.type as keyof typeof typeLabels] || 'ZONE';
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
                    
                    // Show zone info for demo units - COMMENTED OUT (not using demo maps)
                    /*
                    if (unit && !unit.isCustomLayout && demoData) {
                      return (
                        <>
                          <div className="demo-map-info">
                            <h3>Zone Information</h3>
                            <div className="zone-list">
                              {demoData.zones.map((zone: any) => (
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
                              {demoData.equipment.map((equipment: any) => (
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
                    */
                    
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
                    
                    // Show Warehouse Overview Panel by default (no component selected)
                    const currentLayout = savedLayouts.find(layout => layout.id === selectedUnitForDemo);
                    return (
                      <div className="demo-map-info overview-container">
                        <WarehouseOverviewPanel 
                          layoutData={{
                            items: currentLayout?.layoutData?.items || [],
                            name: currentLayout?.name
                          }} 
                        />
                      </div>
                    );
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
    </div>
  );
};

export default WarehouseMapView;

