import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import ComponentPanel from './components/ComponentPanel';
import WarehouseCanvas from './components/WarehouseCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';
import TopNavbar from './components/TopNavbar';
import ContextMenu from './components/ContextMenu';
import StackManager from './components/StackManager';
import InfoPopup from './components/InfoPopup';
import SearchPanel from '../components/warehouse/tools/SearchPanel';
import MainDashboard from '../components/dashboard/MainDashboard';
import FacilityManager from './components/FacilityManager';
import MeasurementTools from '../components/warehouse/tools/MeasurementTools';
import ZoneContextMenu from './components/ZoneContextMenu';
import WarehouseDesigner from './components/WarehouseDesigner';
import FullscreenMap from '../components/warehouse/views/FullscreenView';
import SkuIdSelector from '../components/warehouse/SkuIdSelector';
import MultiLocationSelector from '../components/warehouse/forms/MultiLocationSelector';
import OrgUnitSelector from './components/OrgUnitSelector';
import { STACK_MODES, STACKABLE_COMPONENTS, OCCUPANCY_STATUS, STORAGE_ORIENTATION, COMPONENT_TYPES } from '../lib/warehouse/constants/warehouseComponents';
import { getComponentColor, forceRefreshStorageUnitColors } from '../lib/warehouse/utils/componentColors';
import { generateStorageUnitLabel, generateStorageComponentLabel, applyEnhancedLabeling } from '../lib/warehouse/utils/componentLabeling';
import { generateLocationCode, generateMockInventoryData } from '../lib/warehouse/utils/locationUtils';
import { simulateDataRefresh, DataCache } from '../lib/warehouse/utils/dataRefresh';
import { facilityHierarchy } from '../lib/warehouse/utils/facilityHierarchy';
import { measurementSystem, gridSystem } from '../lib/warehouse/utils/measurementTools';
import { shapeCreator } from '../lib/warehouse/utils/shapeCreator';
import { layoutExporter } from '../lib/warehouse/utils/exportUtils';
import { LayoutCropper } from '../lib/warehouse/utils/layoutCropper';
import { 
  constrainToBoundary, 
  autoAdjustFloorPlan, 
  validateItemPlacement,
  validateItemResize,
  getFloorPlan 
} from '../lib/warehouse/utils/boundaryManager';
import showMessage from '../lib/warehouse/utils/showMessage';
function App() {
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [stackMode, setStackMode] = useState(STACK_MODES.DISABLED);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [stackManager, setStackManager] = useState({ visible: false, item: null });
  const [infoPopup, setInfoPopup] = useState({ visible: false, x: 0, y: 0, item: null });
  const [zoneContextMenu, setZoneContextMenu] = useState({ visible: false, x: 0, y: 0, zone: null });
  const [searchPanelVisible, setSearchPanel] = useState(false);
  const [dataCache] = useState(() => new DataCache(30000)); // 30 second refresh
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [centerCanvasTrigger, setCenterCanvasTrigger] = useState(0);
  
  // New state for enhanced features
  const [facilityManagerVisible, setFacilityManagerVisible] = useState(false);
  const [measurementToolsVisible, setMeasurementToolsVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showMainDashboard, setShowMainDashboard] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [layoutName, setLayoutName] = useState('Warehouse Management System');
  const [layoutNameSet, setLayoutNameSet] = useState(false);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState(null);
  const [selectedOrgMap, setSelectedOrgMap] = useState(null);
  const [skuIdSelectorVisible, setSkuIdSelectorVisible] = useState(false);
  const [multiLocationSelectorVisible, setMultiLocationSelectorVisible] = useState(false);
  const [pendingSkuRequest, setPendingSkuRequest] = useState(null);
  const [mapTypeSelectorVisible, setMapTypeSelectorVisible] = useState(false);

  const selectedItem = warehouseItems.find(item => item.id === selectedItemId);

  // Real-time data refresh effect
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setWarehouseItems(prev => {
        const refreshed = simulateDataRefresh(prev);
        setLastRefresh(Date.now());
        return refreshed;
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Color correction effect - ensure all items have fixed colors
  useEffect(() => {
    setWarehouseItems(prev => {
      // First apply general color correction
      const generalCorrectedItems = prev.map(item => {
        if (item.type === COMPONENT_TYPES.SPARE_UNIT) {
          const baseColor = item.customColor || item.color || item.paletteColor || '#8D6E63';
          return {
            ...item,
            color: baseColor,
            customColor: baseColor
          };
        }

        const fixedColor = getComponentColor(item.type, item.category);

        // Debug log for vertical storage racks
        if (item.type === 'vertical_sku_holder') {
          console.log(`Correcting vertical storage rack ${item.id}: ${item.color} -> ${fixedColor}`);
        }

        return {
          ...item,
          color: fixedColor
        };
      });

      // Then force refresh storage unit colors specifically
      const finalCorrectedItems = forceRefreshStorageUnitColors(generalCorrectedItems);

      return finalCorrectedItems;
    });
  }, []); // Run once on mount to fix any existing items

  // Load layout from localStorage if available (for editing saved layouts)
  useEffect(() => {
    const loadLayoutData = localStorage.getItem('loadLayoutData');
    if (loadLayoutData) {
      try {
        const layoutData = JSON.parse(loadLayoutData);
        if (layoutData.items && Array.isArray(layoutData.items)) {
          setWarehouseItems(layoutData.items);
          setLayoutName(layoutData.name || 'Loaded Layout');
          setLayoutNameSet(true);
          
          // Clear the temporary load data
          localStorage.removeItem('loadLayoutData');
          
          // Show confirmation
          showMessage.success(`Layout "${layoutData.name || 'Loaded Layout'}" loaded successfully!\n\nThis layout has been optimized to remove white space and focus on operational content.`);
        }
      } catch (error) {
        console.error('Error loading layout:', error);
        localStorage.removeItem('loadLayoutData');
      }
    }
  }, []);

  // Clear context menu when no warehouse items exist
  useEffect(() => {
    if (warehouseItems.length === 0) {
      setContextMenu(null);
      setZoneContextMenu({ visible: false, x: 0, y: 0, zone: null });
    }
  }, [warehouseItems.length]);

  // Global context menu prevention when no items exist
  useEffect(() => {
    const handleGlobalContextMenu = (e) => {
      if (warehouseItems.length === 0) {
        // Check if the right-click is on the canvas area
        const canvasElement = e.target.closest('.warehouse-canvas, .canvas-container, .main-content');
        if (canvasElement) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Global context menu blocked: No warehouse items');
        }
      }
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu, true);
    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu, true);
    };
  }, [warehouseItems.length]);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    setWarehouseItems(prev => simulateDataRefresh(prev));
    setLastRefresh(Date.now());
  }, []);

  // Undo/Redo functionality - Define these first
  const saveToUndoStack = useCallback((items) => {
    setUndoStack(prev => {
      const newStack = [...prev, items];
      return newStack.slice(-20); // Keep last 20 states
    });
    setRedoStack([]); // Clear redo stack when new action is performed
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [warehouseItems, ...prev]);
      setUndoStack(prev => prev.slice(0, -1));
      setWarehouseItems(previousState);
    }
  }, [undoStack, warehouseItems]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, warehouseItems]);
      setRedoStack(prev => prev.slice(1));
      setWarehouseItems(nextState);
    }
  }, [redoStack, warehouseItems]);

  const handleAddItem = useCallback((newItem) => {
    const isSpareUnit = newItem.type === COMPONENT_TYPES.SPARE_UNIT;
    // If no org unit is selected, user needs to select one from the navbar dropdown first
    if (!selectedOrgUnit) {
      showMessage.warning('Please select an organizational unit from the dropdown in the top navigation bar before adding components.');
      return;
    }
    
    saveToUndoStack(warehouseItems);
    
    setWarehouseItems(prev => {
      // Generate location code with facility context if available
      const facilityContext = selectedFacility ? {
        zoneId: selectedFacility.id,
        dimensions: { width: newItem.width, height: newItem.height }
      } : null;
      
      const locationCode = generateLocationCode(
        newItem.type, 
        prev, 
        newItem.x, 
        newItem.y, 
        facilityContext
      );
      const inventoryData = generateMockInventoryData(locationCode, newItem.type);
      
      // Assign random occupancy status and storage orientation
      const occupancyStatuses = Object.values(OCCUPANCY_STATUS);
      const storageOrientations = Object.values(STORAGE_ORIENTATION);
      
      // Generate proper label for all storage components
      let autoGeneratedLabel = null;
      if (newItem.type === 'storage_unit' || newItem.type === 'sku_holder' || newItem.type === 'vertical_sku_holder') {
        const sameTypeCount = prev.filter(item => item.type === newItem.type).length + 1;
        autoGeneratedLabel = generateStorageComponentLabel(newItem.type, sameTypeCount, newItem.category);
      }

      const baseColor = isSpareUnit
        ? (newItem.customColor || newItem.color || '#8D6E63')
        : getComponentColor(newItem.type, newItem.category);

      const enhancedItem = {
        ...newItem,
        locationCode,
        inventoryData,
        occupancyStatus: occupancyStatuses[Math.floor(Math.random() * occupancyStatuses.length)],
        storageOrientation: storageOrientations[Math.floor(Math.random() * storageOrientations.length)],
        facilityId: selectedFacility?.id,
        // Ensure color respects component behaviour
        color: baseColor,
        ...(isSpareUnit ? { customColor: baseColor } : {}),
        // Only set label if user provides one, don't use auto-generated as default
        label: newItem.label || newItem.name,
        autoLabel: autoGeneratedLabel
      };
      
      return [...prev, enhancedItem];
    });
    setSelectedItemId(newItem.id);
  }, [warehouseItems, selectedFacility, saveToUndoStack, layoutNameSet, selectedOrgUnit]);

  const handleMoveItem = useCallback((itemId, x, y) => {
    setWarehouseItems(prev => {
      const floorPlan = getFloorPlan(prev);
      
      return prev.map(item => {
        if (item.id !== itemId) return item;
        
        let finalX = Math.max(0, x);
        let finalY = Math.max(0, y);
        
        // Constrain to floor plan boundary if not the floor plan itself
        if (floorPlan && item.containerLevel !== 1) {
          const constrained = constrainToBoundary({ ...item, x: finalX, y: finalY }, floorPlan);
          finalX = constrained.x;
          finalY = constrained.y;
        }
        
        return { ...item, x: finalX, y: finalY };
      });
    });
    
    // Auto-adjust floor plan after move
    setTimeout(() => {
      setWarehouseItems(prev => {
        autoAdjustFloorPlan(prev, handleUpdateItem);
        return prev;
      });
    }, 100);
  }, []);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
  }, []);

  const handleUpdateItem = useCallback((itemId, updates) => {
    setWarehouseItems(prev => {
      const floorPlan = getFloorPlan(prev);
      
      return prev.map(item => {
        if (item.id !== itemId) return item;
        
        let finalUpdates = { ...updates };
        
        // Validate resize if width or height is being updated
        if ((updates.width || updates.height) && floorPlan && item.containerLevel !== 1) {
          const newWidth = updates.width || item.width;
          const newHeight = updates.height || item.height;
          
          const validation = validateItemResize(item, newWidth, newHeight, prev);
          finalUpdates.width = validation.constrainedWidth;
          finalUpdates.height = validation.constrainedHeight;
          
          // Auto-adjust floor plan if resize would exceed boundary
          if (validation.needsBoundaryExpansion) {
            setTimeout(() => {
              autoAdjustFloorPlan(prev, handleUpdateItem);
            }, 100);
          }
        }
        
        const isSpareUnit = item.type === COMPONENT_TYPES.SPARE_UNIT;
        const baseColor = isSpareUnit
          ? (finalUpdates.customColor || finalUpdates.color || item.customColor || item.color || '#8D6E63')
          : getComponentColor(item.type, item.category) || item.color;

        const appliedUpdates = {
          ...item,
          ...finalUpdates,
          color: baseColor
        };

        if (isSpareUnit) {
          appliedUpdates.customColor = baseColor;
        }

        return appliedUpdates;
      });
    });
  }, []);

  const handleDeleteItem = useCallback((itemId) => {
    setWarehouseItems(prev => prev.filter(item => item.id !== itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  }, [selectedItemId]);

  const handleCanvasClick = useCallback(() => {
    setSelectedItemId(null);
    setContextMenu(null);
    setInfoPopup(null);
    setZoneContextMenu(null);
  }, []);

  const handleInfoClick = useCallback((e, item) => {
    setInfoPopup({
      item,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const handleCloseInfoPopup = useCallback(() => {
    setInfoPopup(null);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchPanel(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchPanel(false);
  }, []);

  const handleSearchSelect = useCallback((item) => {
    setSelectedItemId(item.id);
    // Optionally scroll to item or highlight it
  }, []);


  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.25, 5)); // Max zoom 5x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.25, 0.1)); // Min zoom 0.1x
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setCenterCanvasTrigger(prev => prev + 1);
  }, []);

  const isZoomFitEnabled = false;

  const handleZoomFit = useCallback(() => {
    if (!isZoomFitEnabled) {
      console.log('Fit to View is temporarily disabled');
      return;
    }
    if (warehouseItems.length === 0) return;
    
    // Calculate bounding box of all items
    const bounds = warehouseItems.reduce((acc, item) => ({
      minX: Math.min(acc.minX, item.x),
      minY: Math.min(acc.minY, item.y),
      maxX: Math.max(acc.maxX, item.x + item.width),
      maxY: Math.max(acc.maxY, item.y + item.height)
    }), {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });

    const canvas = document.querySelector('.warehouse-canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const padding = 50;
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const availableWidth = canvasRect.width - padding * 2;
    const availableHeight = canvasRect.height - padding * 2;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
    
    setZoomLevel(scale);
    setPanOffset({
      x: (availableWidth - contentWidth * scale) / 2 - bounds.minX * scale + padding,
      y: (availableHeight - contentHeight * scale) / 2 - bounds.minY * scale + padding
    });
  }, [warehouseItems, isZoomFitEnabled]);

  const handlePanChange = useCallback((newPanOffset, newZoomLevel) => {
    setPanOffset(newPanOffset);
    if (newZoomLevel !== undefined) {
      setZoomLevel(newZoomLevel);
    }
  }, []);

  const handleToggleStackMode = useCallback(() => {
    setStackMode(prev => prev === STACK_MODES.ENABLED ? STACK_MODES.DISABLED : STACK_MODES.ENABLED);
  }, []);

  const handleRightClick = useCallback((e, item) => {
    // Always prevent default context menu
    e.preventDefault();
    e.stopPropagation();

    // Completely disable context menu when there are no warehouse items
    if (warehouseItems.length === 0) {
      console.log('Context menu blocked: No warehouse items');
      return;
    }

    // Prevent context menu if no item or if item has no valid type
    if (!item || !item.type || !item.id) {
      console.log('Context menu blocked: Invalid item', item);
      return;
    }

    // Check if this is a zone that can be filled with units
    if (item.containerLevel === 2 && item.isContainer) {
      setZoneContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        zone: item
      });
      return;
    }

    // Only show context menu for items that actually exist in warehouseItems
    const itemExists = warehouseItems.some(warehouseItem => warehouseItem.id === item.id);
    if (!itemExists) {
      console.log('Context menu blocked: Item does not exist in warehouse items', item);
      return;
    }

    const canStack = STACKABLE_COMPONENTS.includes(item.type);
    const hasStack = item.stack && item.stack.layers && item.stack.layers.length > 1;

    console.log('Showing context menu for valid item:', item);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      canStack,
      hasStack
    });
  }, [warehouseItems]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCloseZoneContextMenu = useCallback(() => {
    setZoneContextMenu({ visible: false, x: 0, y: 0, zone: null });
  }, []);

  const handleLockToggle = useCallback((itemId, lockType, isLocked) => {
    setWarehouseItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              [lockType === 'position' ? 'isPositionLocked' : 'isSizeLocked']: isLocked 
            }
          : item
      )
    );
  }, []);

  const handleAddUnitsToZone = useCallback((units) => {
    setWarehouseItems(prev => [...prev, ...units]);
  }, []);

  const handleClearZone = useCallback((zoneId) => {
    setWarehouseItems(prev => prev.filter(item => item.containerId !== zoneId));
  }, []);

  const handleCreateStack = useCallback((baseItemId, draggedItemId, newItem) => {
    setWarehouseItems(prev => {
      const items = [...prev];
      const baseItemIndex = items.findIndex(item => item.id === baseItemId);

      if (baseItemIndex === -1) return prev;

      const baseItem = items[baseItemIndex];

      // Initialize stack if it doesn't exist
      if (!baseItem.stack) {
        baseItem.stack = {
          layers: [{
            id: uuidv4(),
            name: baseItem.name + ' (Base)',
            skus: []
          }]
        };
      }

      // Add new layer
      const newLayerItem = newItem || items.find(item => item.id === draggedItemId);
      if (newLayerItem) {
        baseItem.stack.layers.push({
          id: uuidv4(),
          name: newLayerItem.name,
          skus: [],
          originalItem: newLayerItem
        });

        // Remove the dragged item if it was an existing item
        if (draggedItemId) {
          const draggedIndex = items.findIndex(item => item.id === draggedItemId);
          if (draggedIndex !== -1) {
            items.splice(draggedIndex, 1);
          }
        }
      }

      return items;
    });

    setSelectedItemId(baseItemId);
  }, []);

  const handleAddLayerAbove = useCallback((item) => {
    const newLayerName = prompt('Enter name for new layer:', item.name + ' Layer');
    if (newLayerName) {
      setWarehouseItems(prev => 
        prev.map(warehouseItem => {
          if (warehouseItem.id === item.id) {
            const updatedItem = { ...warehouseItem };
            if (!updatedItem.stack) {
              updatedItem.stack = {
                layers: [{
                  id: uuidv4(),
                  name: updatedItem.name + ' (Base)',
                  skus: []
                }]
              };
            }
            updatedItem.stack.layers.push({
              id: uuidv4(),
              name: newLayerName,
              skus: []
            });
            return updatedItem;
          }
          return warehouseItem;
        })
      );
    }
  }, []);

  const handleAddLayerBelow = useCallback((item) => {
    const newLayerName = prompt('Enter name for new layer:', item.name + ' Base Layer');
    if (newLayerName) {
      setWarehouseItems(prev => 
        prev.map(warehouseItem => {
          if (warehouseItem.id === item.id) {
            const updatedItem = { ...warehouseItem };
            if (!updatedItem.stack) {
              updatedItem.stack = {
                layers: [{
                  id: uuidv4(),
                  name: updatedItem.name + ' (Base)',
                  skus: []
                }]
              };
            }
            updatedItem.stack.layers.unshift({
              id: uuidv4(),
              name: newLayerName,
              skus: []
            });
            return updatedItem;
          }
          return warehouseItem;
        })
      );
    }
  }, []);

  const handleManageStack = useCallback((item) => {
    setStackManager(item);
  }, []);

  const handleCloseStackManager = useCallback(() => {
    setStackManager(null);
  }, []);

  const handleUpdateStack = useCallback((updatedStack) => {
    setWarehouseItems(prev => 
      prev.map(item => 
        item.id === updatedStack.id 
          ? { ...item, stack: updatedStack.stack }
          : item
      )
    );
  }, []);

  const handleDeleteLayer = useCallback((layerIndex) => {
    if (stackManager && window.confirm('Are you sure you want to delete this layer?')) {
      const updatedStack = { ...stackManager };
      updatedStack.stack.layers.splice(layerIndex, 1);

      // If only one layer remains, remove the stack
      if (updatedStack.stack.layers.length <= 1) {
        delete updatedStack.stack;
      }

      handleUpdateStack(updatedStack);
      setStackManager(updatedStack);
    }
  }, [stackManager, handleUpdateStack]);

  // Handle org unit selection
  const handleOrgUnitSelect = useCallback((selection) => {
    const { orgUnit, status } = selection;
    const layoutName = `${orgUnit.name} Layout`;
    
    setSelectedOrgUnit(orgUnit);
    setSelectedOrgMap(null); // Reset map selection when org unit changes
    setLayoutName(layoutName);
    setLayoutNameSet(true);
  }, []);

  // Handle organization mapping selection
  const handleOrgMapSelect = useCallback((orgMap) => {
    if (!selectedOrgUnit) return;
    
    const layoutName = `${selectedOrgUnit.name} - ${orgMap.name}`;
    
    setSelectedOrgMap(orgMap);
    setLayoutName(layoutName);
    setLayoutNameSet(true);
  }, [selectedOrgUnit]);

  // Handle Location ID request from WarehouseItem
  const handleLocationIdRequest = useCallback((itemId, compartmentId, row, col) => {
    const item = warehouseItems.find(item => item.id === itemId);
    setPendingSkuRequest({ itemId, compartmentId, row, col });
    
    console.log('Location ID request for item:', item); // Debug log
    
    // Check if this component supports multiple location IDs
    if (item && item.type === 'vertical_sku_holder') {
      console.log('Detected vertical storage rack, opening MultiLocationSelector'); // Debug log
      setMultiLocationSelectorVisible(true);
    } else {
      console.log('Opening regular SkuIdSelector for item type:', item?.type); // Debug log
      setSkuIdSelectorVisible(true);
    }
  }, [warehouseItems]);

  // Get existing Location IDs for a specific item
  const getExistingLocationIds = useCallback((itemId) => {
    const item = warehouseItems.find(item => item.id === itemId);
    if (!item) return [];
    
    const locationIds = [];
    
    // Get Location IDs from compartmentalized items (Storage Racks)
    if (item.compartmentContents) {
      const compartmentLocationIds = Object.values(item.compartmentContents)
        .flatMap(content => {
          // Handle multiple location IDs (vertical storage racks and storage units)
          if (content.isMultiLocation && content.locationIds) {
            return content.locationIds;
          }
          // Handle single location ID (horizontal storage racks)
          return content.locationId || content.uniqueId;
        })
        .filter(Boolean);
      locationIds.push(...compartmentLocationIds);
    }
    
    // Get Location IDs from single location items (Storage Units)
    if (item.locationId) {
      locationIds.push(item.locationId);
    }
    
    // Get multiple location IDs from storage units with multi-location support
    if (item.locationData && item.locationData.isMultiLocation && item.locationData.locationIds) {
      locationIds.push(...item.locationData.locationIds);
    }
    
    return locationIds;
  }, [warehouseItems]);

  // Handle Location ID selection
  const handleLocationIdSelect = useCallback((data) => {
    if (!pendingSkuRequest) return;
    
    const { itemId, compartmentId, row, col } = pendingSkuRequest;
    const item = warehouseItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Handle multiple location IDs for vertical storage racks
    if (data.isMultiple && item.type === 'vertical_sku_holder') {
      const {
        locationIds = [],
        tags = [],
        category: multiCategory,
        levelLocationMappings = [],
        levelIds = [],
        primaryLocationId
      } = data;

      const resolvedMappings = levelLocationMappings.length > 0
        ? levelLocationMappings
        : locationIds.map((locId, index) => ({
            levelId: levelIds[index] || `L${index + 1}`,
            locationId: locId
          }));

      const resolvedLevelIds = levelIds.length > 0
        ? levelIds
        : resolvedMappings.map((mapping) => mapping.levelId);

      const resolvedLocationIds = resolvedMappings.map((mapping) => mapping.locationId);

      const resolvedTags = Array.isArray(tags) && tags.length > 0
        ? tags
        : resolvedLevelIds;

      const resolvedPrimary = primaryLocationId || resolvedLocationIds[0] || '';

      const newContents = {
        ...item.compartmentContents,
        [compartmentId]: {
          isMultiLocation: true,
          levelLocationMappings: resolvedMappings,
          levelIds: resolvedLevelIds,
          locationIds: resolvedLocationIds,
          tags: resolvedTags,
          primaryLocationId: resolvedPrimary,
          uniqueId: resolvedPrimary || resolvedLocationIds[0],
          sku: resolvedLocationIds.join(','),
          quantity: 1,
          status: 'planned',
          category: multiCategory,
          storageSpace: `${Math.floor(item.width / 60)}x${Math.floor(item.height / 60)}`,
          availability: 'available',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          position: {
            row: row + 1,
            col: col + 1,
            compartment: compartmentId
          },
          metadata: {
            weight: null,
            dimensions: null,
            temperature: null,
            hazardous: false,
            priority: 'normal',
            isMultiLocation: true
          }
        }
      };

      handleUpdateItem(itemId, { compartmentContents: newContents });
      setMultiLocationSelectorVisible(false);
      setPendingSkuRequest(null);
      return;
    }

    // Handle both string (legacy) and object (new with category) formats
    const locationId = typeof data === 'string' ? data : data.locationId;
    const singleCategory = typeof data === 'string' ? '' : data.category;

    // Handle multiple location IDs for storage units
    if (data.locationIds && Array.isArray(data.locationIds)) {
      const primaryLocationId = data.locationIds[0] || '';
      handleUpdateItem(itemId, { 
        locationId: primaryLocationId, // Primary location ID for display
        category: data.category || singleCategory, // Add category for color determination
        locationData: {
          isMultiLocation: true,
          locationIds: data.locationIds,
          primaryLocationId: primaryLocationId,
          uniqueId: primaryLocationId,
          sku: data.locationIds.join(','),
          quantity: data.locationIds.length,
          status: 'planned',
          category: data.category || singleCategory,
          availability: 'available',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          metadata: {
            weight: null,
            dimensions: null,
            temperature: null,
            hazardous: false,
            priority: 'normal',
            isMultiLocation: true
          }
        }
      });
      setSkuIdSelectorVisible(false);
      setPendingSkuRequest(null);
      return;
    }

    // Handle single location units (Storage Unit)
    if (compartmentId === 'single-sku') {
      handleUpdateItem(itemId, { 
        locationId: locationId,
        category: singleCategory, // Add category for color determination
        locationData: {
          locationId: locationId,
          uniqueId: locationId,
          sku: locationId,
          quantity: 1,
          status: 'planned',
          category: singleCategory,
          availability: 'available',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          metadata: {
            weight: null,
            dimensions: null,
            temperature: null,
            hazardous: false,
            priority: 'normal'
          }
        }
      });
    } else {
      // Handle compartmentalized units (Horizontal Storage Racks)
      const newContents = { 
        ...item.compartmentContents, 
        [compartmentId]: { 
          locationId: locationId,
          uniqueId: locationId, // Keep for backward compatibility
          sku: locationId, // Use the selected Location ID as the SKU
          quantity: 1,
          status: 'planned',
          category: '',
          storageSpace: `${Math.floor(item.width / 60)}x${Math.floor(item.height / 60)}`,
          availability: 'available',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          position: {
            row: row + 1,
            col: col + 1,
            compartment: compartmentId
          },
          metadata: {
            weight: null,
            dimensions: null,
            temperature: null,
            hazardous: false,
            priority: 'normal'
          }
        }
      };
      
      handleUpdateItem(itemId, { compartmentContents: newContents });
    }
    
    setSkuIdSelectorVisible(false);
    setPendingSkuRequest(null);
  }, [pendingSkuRequest, warehouseItems, handleUpdateItem]);

  // Handle Location ID selector close
  const handleLocationIdSelectorClose = useCallback(() => {
    setSkuIdSelectorVisible(false);
    setPendingSkuRequest(null);
  }, []);

  // Handle Multi Location selector close
  const handleMultiLocationSelectorClose = useCallback(() => {
    setMultiLocationSelectorVisible(false);
    setPendingSkuRequest(null);
  }, []);

  const handleSave = useCallback(() => {
    // If no org unit selected, prompt user to select one
    if (!selectedOrgUnit) {
      showMessage.warning('Please select an organizational unit from the dropdown in the top navigation bar before saving.');
      return;
    }
    
    // Show map type selector modal before saving
    setMapTypeSelectorVisible(true);
  }, [selectedOrgUnit]);

  const handleMapTypeSelected = useCallback((selection) => {
    const { status } = selection;
    const operationalStatus = status.id; // Use selected status from modal
    
    // Use ultra-tight cropping to eliminate ALL white space
    const croppedLayout = LayoutCropper.createUltraTightCrop(warehouseItems);
    
    // Add operational metadata
    const operationalMetadata = {
      totalComponents: croppedLayout.croppedItems.length,
      croppedDimensions: {
        width: Math.round(croppedLayout.bounds.width),
        height: Math.round(croppedLayout.bounds.height)
      },
      whitespaceRemoved: {
        x: Math.round(croppedLayout.offset.x),
        y: Math.round(croppedLayout.offset.y)
      }
    };
    
    const layoutData = {
      name: layoutName,
      items: croppedLayout.croppedItems, // Use cropped items instead of original
      operationalStatus: operationalStatus,
      timestamp: new Date().toISOString(),
      version: '1.0',
      orgUnit: selectedOrgUnit,
      orgMap: selectedOrgMap,
      metadata: {
        totalItems: warehouseItems.length,
        croppedItems: croppedLayout.croppedItems.length,
        createdBy: 'Layout Designer',
        lastModified: new Date().toISOString(),
        cropping: operationalMetadata,
        orgUnit: selectedOrgUnit,
        orgMap: selectedOrgMap,
        originalDimensions: {
          width: Math.max(...warehouseItems.map(item => item.x + item.width), 800),
          height: Math.max(...warehouseItems.map(item => item.y + item.height), 600)
        },
        croppedDimensions: operationalMetadata.croppedDimensions
      }
    };
    
    // Save to localStorage for warehouse maps integration
    const savedLayouts = JSON.parse(localStorage.getItem('warehouseLayouts') || '[]');
    const layoutForMaps = {
      id: `layout-${Date.now()}`,
      name: layoutName,
      status: operationalStatus,
      location: selectedOrgUnit.location,
      orgUnit: selectedOrgUnit.name,
      size: `${operationalMetadata.croppedDimensions.width}x${operationalMetadata.croppedDimensions.height}`,
      items: warehouseItems.length,
      zones: warehouseItems.filter(item => item.type && (item.type.includes('zone') || item.type.includes('storage'))).length,
      utilization: Math.floor(Math.random() * 40) + 60, // Random utilization 60-100%
      lastActivity: new Date().toISOString(),
      layoutData: layoutData
    };
    
    savedLayouts.push(layoutForMaps);
    localStorage.setItem('warehouseLayouts', JSON.stringify(savedLayouts));
    
    // Trigger custom event to update warehouse maps
    window.dispatchEvent(new CustomEvent('layoutSaved'));
    
    const dataStr = JSON.stringify(layoutData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${layoutName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    // Show confirmation with status
    const statusLabels = {
      'operational': 'Operational (Ready for live operations)',
      'offline': 'Offline (Not currently in use)',
      'maintenance': 'Maintenance (Under maintenance/construction)', 
      'planning': 'Planning (Still in planning phase)'
    };
    
    // Show confirmation with ultra-tight cropping info
    const croppingInfo = operationalMetadata.whitespaceRemoved.x > 0 || operationalMetadata.whitespaceRemoved.y > 0 
      ? `\n\nUltra-tight optimization: Removed ${operationalMetadata.whitespaceRemoved.x}px × ${operationalMetadata.whitespaceRemoved.y}px of white space\nFinal size: ${operationalMetadata.croppedDimensions.width}px × ${operationalMetadata.croppedDimensions.height}px\nZero padding applied for maximum focus`
      : '';
    
    showMessage.success(`Layout "${layoutName}" saved successfully!\n\nOrganizational Unit: ${selectedOrgUnit.name} (${selectedOrgUnit.location})\nStatus: ${statusLabels[operationalStatus]}${croppingInfo}\n\nThis layout is now available in the Live Warehouse Maps section.`);
    
    // Close the map type selector modal
    setMapTypeSelectorVisible(false);
  }, [warehouseItems, layoutName, layoutNameSet, selectedOrgUnit, selectedOrgMap]);

  const handleLoad = useCallback((data) => {
    if (data.items && Array.isArray(data.items)) {
      setWarehouseItems(data.items);
      setSelectedItemId(null);
    } else {
      showMessage.error('Invalid file format');
    }
  }, []);

  const handleClear = useCallback(() => {
    setWarehouseItems([]);
    setSelectedItemId(null);
    setLayoutName('Warehouse Management System');
    setLayoutNameSet(false);
    setSelectedOrgUnit(null);
  }, []);

  // Enhanced facility management handlers
  const handleFacilityManager = useCallback(() => {
    setFacilityManagerVisible(true);
  }, []);

  const handleCloseFacilityManager = useCallback(() => {
    setFacilityManagerVisible(false);
  }, []);

  const handleFacilitySelect = useCallback((facility) => {
    setSelectedFacility(facility);
    setFacilityManagerVisible(false);
  }, []);

  // Measurement tools handlers
  const handleMeasurementTools = useCallback(() => {
    setMeasurementToolsVisible(true);
  }, []);

  const handleCloseMeasurementTools = useCallback(() => {
    setMeasurementToolsVisible(false);
  }, []);


  // Grid and snap handlers
  const handleToggleGrid = useCallback(() => {
    setGridVisible(prev => {
      gridSystem.setVisible(!prev);
      return !prev;
    });
  }, []);

  const handleToggleSnap = useCallback(() => {
    setSnapEnabled(prev => {
      gridSystem.setSnapEnabled(!prev);
      return !prev;
    });
  }, []);

  // Auto-generate boundary
  const handleAutoGenerateBoundary = useCallback(() => {
    const existingBoundary = warehouseItems.find(item => item.type === 'square_boundary');
    if (existingBoundary) {
      const confirm = window.confirm('A boundary already exists. Replace it?');
      if (!confirm) return;
      setWarehouseItems(prev => prev.filter(item => item.type !== 'square_boundary'));
    }

    const components = warehouseItems.filter(item => item.type !== 'square_boundary');
    if (components.length === 0) {
      showMessage.warning('Please add components first.');
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    components.forEach(item => {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + (item.width || 100));
      maxY = Math.max(maxY, item.y + (item.height || 80));
    });

    const padding = 60;
    const boundary = {
      id: uuidv4(),
      type: 'square_boundary',
      name: 'Warehouse Boundary',
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.ceil((maxX - minX + padding * 2) / 60) * 60,
      height: Math.ceil((maxY - minY + padding * 2) / 60) * 60,
      color: getComponentColor('square_boundary'),
      containerLevel: 1,
      isContainer: true,
      containerPadding: 20,
      resizable: true
    };

    setWarehouseItems(prev => [...prev, boundary]);
    showMessage.success(`Boundary generated! ${boundary.width}×${boundary.height}px, ${components.length} components`);
  }, [warehouseItems]);


  // CAD Import handler
  const handleImportCAD = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.svg,.dxf,.dwg';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // CAD import functionality would be implemented here
          showMessage.info('CAD import feature is not yet implemented');
        } catch (error) {
          showMessage.error(`Failed to import CAD file: ${error.message}`);
        }
      }
    };
    
    input.click();
  }, [warehouseItems, saveToUndoStack]);

  // Enhanced export handler
  const handleExportLayout = useCallback(async (format) => {
    try {
      await layoutExporter.exportLayout(warehouseItems, format, {
        includeGrid: gridVisible,
        includeMeasurements: true,
        includeLabels: true
      });
    } catch (error) {
      showMessage.error(`Export failed: ${error.message}`);
    }
  }, [warehouseItems, gridVisible]);

  // Navigation handlers
  const handleNavigateToBuilder = useCallback(() => {
    setShowMainDashboard(false);
  }, []);

  const handleNavigateToDashboard = useCallback(() => {
    setShowMainDashboard(true);
  }, []);

  // Check if we're in fullscreen map mode
  const isFullscreenMap = window.location.hash.startsWith('#fullscreen-map=');
  
  // If fullscreen map, render only the fullscreen component
  if (isFullscreenMap) {
    return <FullscreenMap />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        {showMainDashboard ? (
          <MainDashboard onNavigateToBuilder={handleNavigateToBuilder} />
        ) : (
          <>
            <TopNavbar
              layoutName={layoutName}
              selectedOrgUnit={selectedOrgUnit}
              onOrgUnitSelect={handleOrgUnitSelect}
              selectedOrgMap={selectedOrgMap}
              onOrgMapSelect={handleOrgMapSelect}
              onFacilityManager={handleFacilityManager}
              onMeasurementTools={handleMeasurementTools}
              onSave={handleSave}
              onLoad={handleLoad}
              onClear={handleClear}
              onImportCAD={handleImportCAD}
              onExportLayout={handleExportLayout}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onZoomFit={handleZoomFit}
              gridVisible={gridVisible}
              onToggleGrid={handleToggleGrid}
              snapEnabled={snapEnabled}
              onToggleSnap={handleToggleSnap}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onSearch={handleSearch}
              onAutoGenerateBoundary={handleAutoGenerateBoundary}
              itemCount={warehouseItems.length}
              onNavigateToDashboard={handleNavigateToDashboard}
              showMainDashboard={showMainDashboard}
            />
            
            <div className="main-content">
              <ComponentPanel />
              
              <WarehouseCanvas
                  items={warehouseItems}
                  onAddItem={handleAddItem}
                  onMoveItem={handleMoveItem}
                  onSelectItem={handleSelectItem}
                  selectedItemId={selectedItemId}
                  onUpdateItem={handleUpdateItem}
                  onCanvasClick={handleCanvasClick}
                  stackMode={stackMode}
                  onRightClick={handleRightClick}
                  onCreateStack={handleCreateStack}
                  onInfoClick={handleInfoClick}
                  zoomLevel={zoomLevel}
                  panOffset={panOffset}
                  onPanChange={handlePanChange}
                  onRequestSkuId={handleLocationIdRequest}
                  centerCanvasTrigger={centerCanvasTrigger}
                />
                
                <PropertiesPanel
                  selectedItem={selectedItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                />
              </div>


            {/* Context Menu - Only show if there are warehouse items */}
            {contextMenu && warehouseItems.length > 0 && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={handleCloseContextMenu}
                onAddLayerAbove={() => handleAddLayerAbove(contextMenu.item)}
                onAddLayerBelow={() => handleAddLayerBelow(contextMenu.item)}
                onManageStack={() => handleManageStack(contextMenu.item)}
                hasStack={contextMenu.hasStack}
                canStack={contextMenu.canStack}
                item={contextMenu.item}
                onLockToggle={handleLockToggle}
                onDelete={() => handleDeleteItem(contextMenu.item.id)}
              />
            )}

            {/* Stack Manager Modal */}
            {stackManager && (
              <StackManager
                stack={stackManager}
                onClose={handleCloseStackManager}
                onUpdateStack={handleUpdateStack}
                onDeleteLayer={handleDeleteLayer}
              />
            )}

            {/* Info Popup */}
            {infoPopup && (
              <InfoPopup
                item={infoPopup.item}
                x={infoPopup.x}
                y={infoPopup.y}
                onClose={handleCloseInfoPopup}
              />
            )}

            {/* Search Panel */}
            {searchPanelVisible && (
              <SearchPanel
                items={warehouseItems}
                onSelectItem={handleSearchSelect}
                onClose={handleCloseSearch}
              />
            )}


            {/* Facility Manager */}
            {facilityManagerVisible && (
              <FacilityManager
                isVisible={facilityManagerVisible}
                onClose={handleCloseFacilityManager}
                onFacilitySelect={handleFacilitySelect}
              />
            )}

            {/* Measurement Tools */}
            {measurementToolsVisible && (
              <MeasurementTools
                isVisible={measurementToolsVisible}
                onClose={handleCloseMeasurementTools}
                canvasRef={null}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
              />
            )}

            {/* Zone Context Menu */}
            <ZoneContextMenu
              isVisible={zoneContextMenu.visible}
              x={zoneContextMenu.x}
              y={zoneContextMenu.y}
              zone={zoneContextMenu.zone}
              onClose={handleCloseZoneContextMenu}
              onAddUnits={handleAddUnitsToZone}
              onClearZone={handleClearZone}
            />

            {/* Selected Facility Indicator */}
            {selectedFacility && (
              <div className="selected-facility-indicator">
                <span>Active Facility: {selectedFacility.name} ({selectedFacility.locationCode})</span>
                <button onClick={() => setSelectedFacility(null)}>×</button>
              </div>
            )}

          </>
        )}

        {/* Location ID Selector Modal */}
        <SkuIdSelector
          isVisible={skuIdSelectorVisible}
          onClose={handleLocationIdSelectorClose}
          onSave={handleLocationIdSelect}
          existingLocationIds={pendingSkuRequest ? getExistingLocationIds(pendingSkuRequest.itemId) : []}
          showCategories={pendingSkuRequest && pendingSkuRequest.compartmentId === 'single-sku'}
          allowCustomIds={pendingSkuRequest && pendingSkuRequest.compartmentId === 'single-sku'}
          allowMultipleIds={pendingSkuRequest ? (() => {
            const item = warehouseItems.find(i => i.id === pendingSkuRequest.itemId);
            const allowMultiple = item && item.type === 'storage_unit' && item.supportsMultipleLocationIds;
            console.log('allowMultipleIds check:', { itemId: pendingSkuRequest.itemId, itemType: item?.type, supportsMultipleLocationIds: item?.supportsMultipleLocationIds, allowMultiple }); // Debug log
            return allowMultiple;
          })() : false}
        />

        {/* Multi Location ID Selector Modal for Vertical Storage Racks */}
        <MultiLocationSelector
          isVisible={multiLocationSelectorVisible}
          onClose={handleMultiLocationSelectorClose}
          onSave={handleLocationIdSelect}
          existingLocationIds={pendingSkuRequest ? getExistingLocationIds(pendingSkuRequest.itemId) : []}
          itemType={pendingSkuRequest ? warehouseItems.find(item => item.id === pendingSkuRequest.itemId)?.type : ''}
          initialLevelIds={pendingSkuRequest ? (() => {
            const item = warehouseItems.find(i => i.id === pendingSkuRequest.itemId);
            if (!item || !item.compartmentContents) return [];
            const content = item.compartmentContents[pendingSkuRequest.compartmentId];
            if (content && content.isMultiLocation && Array.isArray(content.locationIds)) {
              return content.locationIds;
            }
            return [];
          })() : []}
        />

        {/* Map Type Selector Modal - Select operational status before saving */}
        <OrgUnitSelector
          isVisible={mapTypeSelectorVisible}
          onClose={() => setMapTypeSelectorVisible(false)}
          onSave={handleMapTypeSelected}
        />
      </div>
    </DndProvider>
  );
}

export default App;
