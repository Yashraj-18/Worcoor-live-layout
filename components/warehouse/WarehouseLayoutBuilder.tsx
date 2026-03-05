// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import ComponentPanel from '@/components/warehouse/ComponentPanel';
import WarehouseCanvas from '@/components/warehouse/WarehouseCanvas';
import PropertiesPanel from '@/components/warehouse/PropertiesPanel';
import Toolbar from '@/components/warehouse/Toolbar';
import TopNavbar from '@/components/warehouse/TopNavbar';
import ContextMenu from '@/components/warehouse/ContextMenu';
import StackManager from '@/components/warehouse/StackManager';
import InfoPopup from '@/components/warehouse/InfoPopup';
import MainDashboard from '@/components/dashboard/MainDashboard';
import ZoneContextMenu from '@/components/warehouse/ZoneContextMenu';
import WarehouseDesigner from '@/components/warehouse/WarehouseDesigner';
import FullscreenMap from '@/components/warehouse/FullscreenMap';
import SkuIdSelector from '@/components/warehouse/SkuIdSelector';
import MultiLocationSelector from '@/components/warehouse/MultiLocationSelector';
import OrgUnitSelector from '@/components/warehouse/OrgUnitSelector';
import { locationTagService, type LocationTag } from '@/src/services/locationTags';
import { warehouseService, componentToItem, itemToCreatePayload, itemUpdatesToPayload } from '@/src/services/warehouseService';
import globalIdCache from '@/lib/warehouse/utils/globalIdCache';
import { normalizeLocationId } from '@/lib/warehouse/utils/locationId';
import { STACK_MODES, STACKABLE_COMPONENTS, STORAGE_ORIENTATION, COMPONENT_TYPES } from '@/lib/warehouse/constants/warehouseComponents';
import { getComponentColor, forceRefreshStorageUnitColors } from '@/lib/warehouse/utils/componentColors';
import { generateStorageUnitLabel, generateStorageComponentLabel, applyEnhancedLabeling } from '@/lib/warehouse/utils/componentLabeling';
import { generateLocationCode, generateMockInventoryData } from '@/lib/warehouse/utils/locationUtils';
import { facilityHierarchy } from '@/lib/warehouse/utils/facilityHierarchy';
import { shapeCreator } from '@/lib/warehouse/utils/shapeCreator';
import { LayoutCropper } from '@/lib/warehouse/utils/layoutCropper';
import {
  constrainToBoundary,
  autoAdjustFloorPlan,
  validateItemPlacement,
  validateItemResize,
  getFloorPlan
} from '@/lib/warehouse/utils/boundaryManager';
import showMessage from '@/lib/warehouse/utils/showMessage';

// TypeScript interfaces
interface OrgUnit {
  id: string;
  name: string;
}

interface LayoutData {
  id?: string;
  items: any[];
  name?: string;
  timestamp?: string;
}

interface AppProps {
  initialOrgUnit?: OrgUnit | null;
  initialLayout?: LayoutData | null;
  layoutId?: string | null;
}
const dropdownItemStyle = (color: string): React.CSSProperties => ({
  width: '100%',
  padding: '10px 16px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 13,
  color,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  transition: 'background 0.1s',
  whiteSpace: 'nowrap',
});

function App({ initialOrgUnit = null, initialLayout = null, layoutId: propLayoutId = null }: AppProps) {
  const router = useRouter();
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // STEP 1
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showBoundaryDropdown, setShowBoundaryDropdown] = useState(false);
  const [stackMode, setStackMode] = useState<string>(STACK_MODES.HORIZONTAL);
  const [contextMenu, setContextMenu] = useState<any>({ visible: false, x: 0, y: 0, item: null });
  const [stackManager, setStackManager] = useState<any>({ visible: false, item: null });
  const [infoPopup, setInfoPopup] = useState<any>({ visible: false, x: 0, y: 0, item: null });
  const [zoneContextMenu, setZoneContextMenu] = useState<any>({ visible: false, x: 0, y: 0, zone: null });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [centerCanvasTrigger, setCenterCanvasTrigger] = useState<number>(0);

  // New state for enhanced features
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [showMainDashboard, setShowMainDashboard] = useState<boolean>(false);
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [layoutName, setLayoutName] = useState<string>('Warehouse Management System');
  const [layoutNameSet, setLayoutNameSet] = useState<boolean>(false);
  const [originalLayoutId, setOriginalLayoutId] = useState<string | null>(null); // Track original layout ID for editing
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<OrgUnit | null>(initialOrgUnit);
  const [selectedOrgMap, setSelectedOrgMap] = useState<any>(null);
  const [locationTags, setLocationTags] = useState<LocationTag[]>([]);
  const [isLoadingLocationTags, setIsLoadingLocationTags] = useState(false);
  const [skuIdSelectorVisible, setSkuIdSelectorVisible] = useState<boolean>(false);
  const [multiLocationSelectorVisible, setMultiLocationSelectorVisible] = useState<boolean>(false);
  const [pendingSkuRequest, setPendingSkuRequest] = useState<any>(null);
  const [mapTypeSelectorVisible, setMapTypeSelectorVisible] = useState<boolean>(false);
  const [existingLayoutWarningVisible, setExistingLayoutWarningVisible] = useState<boolean>(false);
  const [existingLayoutForUnit, setExistingLayoutForUnit] = useState<{ id: string; name: string } | null>(null);

  // Backend integration state
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(propLayoutId || initialLayout?.id || null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedItem = warehouseItems.find(item => item.id === selectedItemId);

  // STEP 2 — add right here ↓
  const selectionBoundingBox = React.useMemo(() => {
    if (selectedItemIds.length === 0) return null;
    const BOUNDARY_TYPES = ['square_boundary', 'inner_boundary'];
    const selected = warehouseItems.filter(
      i => selectedItemIds.includes(i.id) && !BOUNDARY_TYPES.includes(i.type)
    );
    if (selected.length === 0) return null;
    return {
      minX: Math.min(...selected.map(i => i.x)),
      minY: Math.min(...selected.map(i => i.y)),
      maxX: Math.max(...selected.map(i => i.x + (i.width || 100))),
      maxY: Math.max(...selected.map(i => i.y + (i.height || 80))),
    };
  }, [selectedItemIds, warehouseItems]);

  const existingInnerBoundaryForSelection = React.useMemo(() => {
    if (selectedItemIds.length === 0) return null;
    return warehouseItems.find(item => {
      if (item.type !== 'inner_boundary') return false;
      return selectedItemIds.every(id => (item.boundedItemIds || []).includes(id));
    }) || null;
  }, [selectedItemIds, warehouseItems]);


  // Fetch location tags for a specific org unit
  // NOTE: must be defined BEFORE handleOrgUnitSelect (used in its deps array)
  const fetchLocationTagsForOrgUnit = useCallback(async (orgUnit: any) => {
    if (!orgUnit) {
      setLocationTags([]);
      setIsLoadingLocationTags(false);
      return;
    }

    try {
      setIsLoadingLocationTags(true);
      console.log(`🏷️ WarehouseLayoutBuilder - Fetching location tags for org unit: ${orgUnit.name} (ID: ${orgUnit.id})`);

      const tags = await locationTagService.listByUnit(orgUnit.id);

      console.log(`✅ WarehouseLayoutBuilder - Successfully fetched ${tags.length} location tags for ${orgUnit.name}:`);
      console.table(tags);

      setLocationTags(tags);

      // Additional detailed logging
      tags.forEach((tag, index) => {
        console.log(`📍 Location Tag ${index + 1}:`, {
          id: tag.id,
          name: tag.locationTagName,
          capacity: tag.capacity,
          currentItems: tag.currentItems,
          utilization: tag.utilizationPercentage,
          dimensions: tag.length && tag.breadth && tag.height
            ? `${tag.length}×${tag.breadth}×${tag.height} ${tag.unitOfMeasurement}`
            : 'N/A'
        });
      });

    } catch (error) {
      console.error(`❌ WarehouseLayoutBuilder - Failed to fetch location tags for org unit ${orgUnit.name}:`, error);
      setLocationTags([]);
    } finally {
      setIsLoadingLocationTags(false);
    }
  }, []);

  // Handle org unit selection
  const handleOrgUnitSelect = useCallback(async (selection: any) => {
    const { orgUnit } = selection;
    const newLayoutName = `${orgUnit.name} Layout`;

    // In create mode (no active layout), check if this org unit already has a layout.
    // Edit mode skips this check — the org unit is already locked to the existing layout.
    if (!activeLayoutId) {
      try {
        const existingLayouts = await warehouseService.getLayouts(orgUnit.id);
        if (existingLayouts && existingLayouts.length > 0) {
          // A layout already exists for this org unit — block and show warning
          setExistingLayoutForUnit({ id: existingLayouts[0].id, name: existingLayouts[0].layoutName || newLayoutName });
          setExistingLayoutWarningVisible(true);
          return; // Do NOT update selectedOrgUnit
        }
      } catch (err) {
        console.warn('⚠️ Could not check existing layouts for org unit:', err);
        // On error, allow the selection to proceed so as not to block the user
      }
    }

    setSelectedOrgUnit(orgUnit);
    setSelectedOrgMap(null);
    setLayoutName(newLayoutName);
    setLayoutNameSet(true);
    fetchLocationTagsForOrgUnit(orgUnit);
  }, [activeLayoutId, fetchLocationTagsForOrgUnit]);

  // -----------------------------------------------------------------------
  // Backend hydration: fetch components for the active layout
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!activeLayoutId) return;
    let cancelled = false;

    const hydrateFromBackend = async () => {
      try {
        console.log('📦 Fetching components from backend for layout:', activeLayoutId);
        const backendComponents = await warehouseService.getComponents(activeLayoutId);

        if (cancelled) return;

        if (backendComponents && backendComponents.length > 0) {
          const items = backendComponents.map(componentToItem);
          console.log(`✅ Hydrated ${items.length} components from backend`);
          setWarehouseItems(items);
          globalIdCache.initialize(items);
          return; // backend data takes precedence
        }

        console.log('ℹ️ No backend components found, falling back to initialLayout');
      } catch (err) {
        if (cancelled) return;
        console.warn('⚠️ Failed to fetch components from backend, using initialLayout fallback:', err);
      }

      // Fallback: use initialLayout items if backend returned nothing
      if (initialLayout?.items?.length) {
        setWarehouseItems(initialLayout.items);
        globalIdCache.initialize(initialLayout.items);
      }
    };

    hydrateFromBackend();

    return () => { cancelled = true; };
  }, [activeLayoutId]);

  // Initialize org unit and layout when editing
  useEffect(() => {
    console.log('WarehouseLayoutBuilder - initialOrgUnit:', initialOrgUnit);
    console.log('WarehouseLayoutBuilder - initialLayout:', initialLayout);

    if (initialOrgUnit) {
      setSelectedOrgUnit(initialOrgUnit);
      const layoutName = initialLayout?.name || `${initialOrgUnit.name} Layout`;
      setLayoutName(layoutName);
      setLayoutNameSet(true);
      // Fetch location tags so findLocationTagUuid can resolve names → UUIDs
      fetchLocationTagsForOrgUnit(initialOrgUnit);
    }

    // Set activeLayoutId from initialLayout if not already set
    if (initialLayout?.id && !activeLayoutId) {
      setActiveLayoutId(initialLayout.id);
      setOriginalLayoutId(initialLayout.id);
    }

    // Only use initialLayout.items as fallback when there is no activeLayoutId
    // (backend hydration effect handles the case when activeLayoutId is set)
    if (!activeLayoutId && initialLayout && initialLayout.items) {
      console.log('Setting warehouse items from initialLayout (no backend layout):', initialLayout.items);

      // Check if this is an existing layout by looking for it in saved layouts
      const savedLayouts = JSON.parse(localStorage.getItem('warehouseLayouts') || '[]');
      const existingLayout = savedLayouts.find((layout: any) =>
        layout.name === initialLayout.name &&
        layout.orgUnit === (initialOrgUnit?.name || 'Unknown')
      );

      if (existingLayout) {
        setOriginalLayoutId(existingLayout.id);
        console.log('📝 Found existing layout ID for editing:', existingLayout.id);
      }

      // Auto-center components in the canvas
      const items = initialLayout.items;
      if (items.length > 0) {
        // Calculate the bounding box of all components
        const minX = Math.min(...items.map(item => item.x || 0));
        const minY = Math.min(...items.map(item => item.y || 0));
        const maxX = Math.max(...items.map(item => (item.x || 0) + (item.width || 0)));
        const maxY = Math.max(...items.map(item => (item.y || 0) + (item.height || 0)));

        // Calculate the current layout dimensions
        const layoutWidth = maxX - minX;
        const layoutHeight = maxY - minY;

        // Calculate actual visible canvas dimensions (based on WarehouseCanvas fixed positioning)
        // Canvas is positioned: top: 60px, left: 320px, right: 320px, bottom: 40px
        const viewportWidth = window.innerWidth - 320 - 320; // Left + Right margins
        const viewportHeight = window.innerHeight - 60 - 40; // Top + Bottom margins

        // Use reasonable defaults if viewport calculation fails
        const canvasWidth = Math.max(viewportWidth, 800);
        const canvasHeight = Math.max(viewportHeight, 500);

        // Calculate center offset in the 5000x5000 scrollable canvas
        const offsetX = 2500 - (layoutWidth / 2) - minX; // Center in 5000px canvas
        const offsetY = 2500 - (layoutHeight / 2) - minY; // Center in 5000px canvas

        console.log('Auto-centering layout:', {
          layoutBounds: { minX, minY, maxX, maxY },
          layoutDimensions: { width: layoutWidth, height: layoutHeight },
          viewportDimensions: { width: viewportWidth, height: viewportHeight },
          canvasDimensions: { width: canvasWidth, height: canvasHeight },
          centerOffset: { x: offsetX, y: offsetY }
        });

        // Apply centering to all items AND force storage_unit to green
        const centeredItems = items.map(item => {
          const finalColor = item.type === 'storage_unit' ? 'transparent' : item.color;

          return {
            ...item,
            x: (item.x || 0) + offsetX,
            y: (item.y || 0) + offsetY,
            // Force storage_unit to always be transparent
            color: finalColor
          };
        });

        setWarehouseItems(centeredItems);

        // Auto-scroll to center the view
        setTimeout(() => {
          const canvasElement = document.querySelector('.warehouse-canvas');
          if (canvasElement) {
            // Scroll to the center of the layout in the 5000x5000 canvas
            const scrollLeft = offsetX - (canvasWidth / 2) + (layoutWidth / 2);
            const scrollTop = offsetY - (canvasHeight / 2) + (layoutHeight / 2);

            console.log('Auto-scrolling to:', { scrollLeft, scrollTop });

            canvasElement.scrollLeft = scrollLeft;
            canvasElement.scrollTop = scrollTop;
          }
        }, 100);
      } else {
        setWarehouseItems(items);
      }
    }
  }, [initialOrgUnit, initialLayout]);

  // Real refresh from backend — re-fetches live components for the active layout
  const refreshFromBackend = useCallback(async () => {
    if (!activeLayoutId) return;
    setIsRefreshing(true);
    try {
      const backendComponents = await warehouseService.getComponents(activeLayoutId);
      if (Array.isArray(backendComponents) && backendComponents.length > 0) {
        const items = backendComponents.map(componentToItem);
        setWarehouseItems(items);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Auto-refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeLayoutId]);

  // Auto-refresh interval effect — only runs when a layout is open and interval is set
  useEffect(() => {
    if (!autoRefreshSeconds || !activeLayoutId) return;
    const id = window.setInterval(() => {
      void refreshFromBackend();
    }, autoRefreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [autoRefreshSeconds, activeLayoutId, refreshFromBackend]);

  // Color correction effect - ensure all items have fixed colors
  useEffect(() => {
    setWarehouseItems(prev => {
      // Safety check: ensure prev is an array
      if (!Array.isArray(prev)) {
        console.warn('warehouseItems is not an array, resetting to empty array');
        return [];
      }

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

        // Force storage racks to be transparent
        if (item.type === COMPONENT_TYPES.SKU_HOLDER || item.type === COMPONENT_TYPES.VERTICAL_SKU_HOLDER) {
          return {
            ...item,
            color: 'transparent'
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

          // Store the original layout ID for editing
          if (layoutData.id) {
            setOriginalLayoutId(layoutData.id);
            console.log('📝 Editing existing layout with ID:', layoutData.id);
          }

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
    const handleGlobalContextMenu = (e: MouseEvent) => {
      if (warehouseItems.length === 0) {
        // Check if the right-click is on the canvas area
        const canvasElement = (e.target as HTMLElement).closest('.warehouse-canvas, .canvas-container, .main-content');
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


  // Create enhanced warehouse item - Reusable function for all component types
  const createEnhancedWarehouseItem = useCallback((
    newItem: any,
    existingItems: any[],
    facilityContext: any
  ) => {
    const isSpareUnit = newItem.type === COMPONENT_TYPES.SPARE_UNIT;
    const isStorageUnit = newItem.type === COMPONENT_TYPES.STORAGE_UNIT;

    // Generate location code
    const locationCode = generateLocationCode(
      newItem.type,
      existingItems,
      newItem.x,
      newItem.y,
      facilityContext
    );

    // Generate inventory data
    const inventoryData = generateMockInventoryData(locationCode, newItem.type);

    // Assign random storage orientation
    const storageOrientations = Object.values(STORAGE_ORIENTATION);

    // Debug logging for Storage Unit
    if (isStorageUnit) {
      console.group('🏷️ STORAGE UNIT DEBUG');
      console.log('📦 Component Type:', newItem.type);
      console.log('📝 Custom Label (if any):', newItem.label || 'none');
      console.log('📛 Component Name:', newItem.name);
      console.log('---');
      console.log('Note: Auto-generated labels (SU-001) have been removed');
      console.log('Only user-provided labels or component names will be used');
      console.groupEnd();
    }

    // Determine base color - force Storage Units and Storage Racks to transparent
    const isStorageRack = newItem.type === COMPONENT_TYPES.SKU_HOLDER || newItem.type === COMPONENT_TYPES.VERTICAL_SKU_HOLDER;
    const baseColor = isStorageUnit || isStorageRack
      ? 'transparent'
      : isSpareUnit
        ? (newItem.customColor || newItem.color || '#8D6E63')
        : (newItem.color || getComponentColor(newItem.type, newItem.category));

    // Create enhanced item
    const enhancedItem = {
      ...newItem,
      locationCode,
      inventoryData,
      storageOrientation: storageOrientations[Math.floor(Math.random() * storageOrientations.length)],
      facilityId: selectedFacility?.id,
      color: baseColor,
      ...(isSpareUnit ? { customColor: baseColor } : {}),
      // Set label based on component type
      label: newItem.label || (isStorageUnit ? (newItem.name === 'Open Storage Space' ? 'Open Storage Space' :
        newItem.name === 'Dispatch Staging Area' ? 'Dispatch Staging Area' :
          newItem.name === 'Grading Area' ? 'Grading Area' :
            newItem.name === 'Processing Area' ? 'Processing Area' :
              newItem.name === 'Production Area' ? 'Production Area' :
                newItem.name === 'Packaging Area' ? 'Packaging Area' :
                  newItem.name === 'Cold Storage' ? 'Cold Storage' : 'Storage Unit-test') : newItem.name)
    };

    // Debug logging for final Storage Unit item
    if (isStorageUnit) {
      console.group('✅ FINAL STORAGE UNIT ITEM');
      console.log('Complete Item Object:', enhancedItem);
      console.log('---');
      console.log('Key Properties:');
      console.log('  • id:', enhancedItem.id);
      console.log('  • type:', enhancedItem.type);
      console.log('  • label:', enhancedItem.label);
      console.log('  • color:', enhancedItem.color);
      console.log('  • locationCode:', enhancedItem.locationCode);
      console.log('---');
      console.log('Note: No autoLabel property - auto-generation removed');
      console.groupEnd();
    }

    return enhancedItem;
  }, [selectedFacility]);

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

  const handleAddItem = useCallback((newItem: any) => {
    // If no org unit is selected, user needs to select one from the navbar dropdown first
    if (!selectedOrgUnit) {
      console.log('No org unit selected, showing warning popup');
      showMessage.warning('Please select an organizational unit from the dropdown in the top navigation bar before adding components.');
      return;
    }
    console.log('Org unit selected:', selectedOrgUnit);

    saveToUndoStack(warehouseItems);

    let createdItem: any = null;
    setWarehouseItems(prev => {
      // Generate facility context if available
      const facilityContext = selectedFacility ? {
        zoneId: selectedFacility.id,
        dimensions: { width: newItem.width, height: newItem.height }
      } : null;

      // Use the reusable function to create enhanced item
      const enhancedItem = createEnhancedWarehouseItem(newItem, prev, facilityContext);
      createdItem = enhancedItem;

      return [...prev, enhancedItem];
    });
    setSelectedItemId(newItem.id);

    // Persist to backend (fire-and-forget, update local item with backend ID)
    if (activeLayoutId && createdItem) {
      const payload = itemToCreatePayload(createdItem);
      console.log('📤 Creating component, layoutId:', activeLayoutId, 'payload:', JSON.stringify(payload));
      warehouseService.createComponent(activeLayoutId, payload)
        .then(backendComponent => {
          const backendId = backendComponent.id;
          console.log('✅ Component persisted to backend:', backendId);
          // Update local item with backend ID so future updates target the right record
          setWarehouseItems(prev => prev.map(item =>
            item.id === createdItem.id
              ? { ...item, _backendId: backendId, id: backendId }
              : item
          ));
          // Keep selection in sync with the new ID
          setSelectedItemId(prev => prev === createdItem.id ? backendId : prev);
        })
        .catch(err => {
          console.error('❌ Failed to persist component to backend:', err?.response?.status, err?.response?.data || err.message);
        });
    }
  }, [warehouseItems, selectedFacility, saveToUndoStack, selectedOrgUnit, createEnhancedWarehouseItem, activeLayoutId]);

  const handleMoveItem = useCallback((itemId: string, x: number, y: number) => {
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

    // Debounced backend sync for position changes
    if (activeLayoutId) {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => {
        const backendId = itemId; // items use backend ID after creation
        warehouseService.updateComponent(backendId, {
          positionX: Math.round(x),
          positionY: Math.round(y),
        }).catch(err => console.warn('⚠️ Failed to sync move to backend:', err?.response?.status, err?.response?.data || err.message));
      }, 500);
    }
  }, [activeLayoutId]);

  // Helper: look up a location tag UUID by its name
  const findLocationTagUuid = useCallback((tagName: string): string | null => {
    if (!tagName) return null;
    const tag = locationTags.find(t => t.locationTagName === tagName);
    return tag?.id ?? null;
  }, [locationTags]);

  // Sync the location_tag_id FK column on the backend component
  const syncLocationTagToBackend = useCallback((componentId: string, tagName: string | null) => {
    if (!activeLayoutId) return;
    const tagUuid = tagName ? findLocationTagUuid(tagName) : null;
    console.log(`🏷️ Syncing location tag for component ${componentId}: name="${tagName}" → uuid="${tagUuid}"`);
    warehouseService.setComponentLocationTag(componentId, tagUuid)
      .then(() => console.log('✅ Location tag synced to backend'))
      .catch(err => console.warn('⚠️ Failed to sync location tag to backend:', err?.response?.status, err?.response?.data || err.message));
  }, [activeLayoutId, findLocationTagUuid]);

  // STEP 3 — replace with this:
  const handleSelectItem = useCallback((itemId: string, isMultiSelect = false) => {
    setSelectedItemId(itemId);       // keeps PropertiesPanel working as before
    setShowBoundaryDropdown(false);

    if (isMultiSelect) {
      // Shift+click → toggle item in/out of multi-selection
      setSelectedItemIds(prev =>
        prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      // Normal click → single select
      setSelectedItemIds([itemId]);
    }
  }, []);

  const handleUpdateItem = useCallback((itemId: string, updates: any) => {
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

    // Sync property changes to backend (debounced)
    if (activeLayoutId) {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
      updateTimerRef.current = setTimeout(() => {
        // Build the full updated item to capture metadata changes
        const currentItem = warehouseItems.find(i => i.id === itemId);
        if (!currentItem) return;
        const merged = { ...currentItem, ...updates };
        const payload = itemUpdatesToPayload(merged);
        // Also include full metadata snapshot so compartmentContents etc. are persisted
        const fullPayload = itemToCreatePayload(merged);
        payload.metadata = fullPayload.metadata;
        warehouseService.updateComponent(itemId, payload)
          .catch(err => console.warn('⚠️ Failed to sync update to backend:', err?.response?.status, err?.response?.data || err.message));
      }, 300);

      // If locationId was explicitly changed (set or cleared), sync the FK column
      if ('locationId' in updates) {
        const newLocName = updates.locationId || null;
        syncLocationTagToBackend(itemId, newLocName);
      }
    }
  }, [activeLayoutId, warehouseItems, syncLocationTagToBackend]);

  const handleDeleteItem = useCallback((itemId: string) => {
    setWarehouseItems(prev => {
      const itemToDelete = prev.find(item => item.id === itemId);
      if (itemToDelete) {
        // Release all location tag IDs from globalIdCache so they become available again
        const idsToRelease: string[] = [];
        if (itemToDelete.locationId) idsToRelease.push(itemToDelete.locationId);
        if (itemToDelete.primaryLocationId) idsToRelease.push(itemToDelete.primaryLocationId);
        if (Array.isArray(itemToDelete.locationIds)) idsToRelease.push(...itemToDelete.locationIds);
        if (itemToDelete.locationData?.locationIds) idsToRelease.push(...itemToDelete.locationData.locationIds);
        // Release IDs from level-location mappings
        if (Array.isArray(itemToDelete.levelLocationMappings)) {
          itemToDelete.levelLocationMappings.forEach((mapping: any) => {
            const id = mapping?.locationId || mapping?.locId;
            if (id) idsToRelease.push(id);
          });
        }
        // Release IDs from compartment contents (SKU holders)
        if (itemToDelete.compartmentContents && typeof itemToDelete.compartmentContents === 'object') {
          Object.values(itemToDelete.compartmentContents).forEach((content: any) => {
            if (!content) return;
            if (content.locationId) idsToRelease.push(content.locationId);
            if (content.uniqueId) idsToRelease.push(content.uniqueId);
            if (content.primaryLocationId) idsToRelease.push(content.primaryLocationId);
            if (Array.isArray(content.locationIds)) idsToRelease.push(...content.locationIds);
            if (Array.isArray(content.levelLocationMappings)) {
              content.levelLocationMappings.forEach((mapping: any) => {
                const id = mapping?.locationId || mapping?.locId;
                if (id) idsToRelease.push(id);
              });
            }
          });
        }
        // Remove all collected IDs from the global cache
        idsToRelease.forEach(id => {
          if (id) globalIdCache.removeId(id);
        });
        if (idsToRelease.length > 0) {
          console.log(`🗑️ Released ${idsToRelease.length} location tag ID(s) from deleted component:`, idsToRelease);
        }
      }
      return prev.filter(item => item.id !== itemId);
    });
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }

    // Delete from backend
    if (activeLayoutId) {
      warehouseService.deleteComponent(itemId)
        .then(() => console.log('✅ Component deleted from backend:', itemId))
        .catch(err => console.warn('⚠️ Failed to delete component from backend:', err?.response?.status, err?.response?.data || err.message));
    }
  }, [selectedItemId, activeLayoutId]);

  // -----------------------------------------------------------------------
  // Bulk-sync all warehouseItems to the components table after layout save
  // -----------------------------------------------------------------------
  // Extract the primary location tag name from a warehouse item regardless of type
  const extractPrimaryLocationTagName = useCallback((item: any): string | null => {
    // 1. Single-location items (storage_unit): item.locationId holds the tag name
    if (item.locationId) return item.locationId;

    // 2. Multi-location via locationData
    if (item.locationData?.locationId) return item.locationData.locationId;

    // 3. Compartmentalized items: use the first compartment's primaryLocationId or locationId
    if (item.compartmentContents) {
      const firstCompartment = Object.values(item.compartmentContents)[0] as any;
      if (firstCompartment) {
        if (firstCompartment.primaryLocationId) return firstCompartment.primaryLocationId;
        if (firstCompartment.locationId) return firstCompartment.locationId;
        if (firstCompartment.locationIds?.[0]) return firstCompartment.locationIds[0];
      }
    }

    return null;
  }, []);

  const syncComponentsToBackend = useCallback(async (layoutId: string) => {
    try {
      // 1. Fetch existing backend components for this layout
      let existingComponents: any[] = [];
      try {
        existingComponents = await warehouseService.getComponents(layoutId);
      } catch {
        // Layout may be brand new with no components yet
        existingComponents = [];
      }

      const existingIds = new Set(existingComponents.map(c => c.id));
      const currentIds = new Set(warehouseItems.map(i => i.id));

      // 2. Create components that don't exist in backend yet
      const toCreate = warehouseItems.filter(item => !existingIds.has(item.id));
      // 3. Update components that exist in both
      const toUpdate = warehouseItems.filter(item => existingIds.has(item.id));
      // 4. Delete components that are in backend but not in current items
      const toDelete = existingComponents.filter(c => !currentIds.has(c.id));

      console.log(`🔄 Component sync: ${toCreate.length} create, ${toUpdate.length} update, ${toDelete.length} delete`);

      // Helper: resolve location tag name → UUID for an item
      const resolveLocationTagUuid = (item: any): string | null => {
        const tagName = extractPrimaryLocationTagName(item);
        console.log(`🔍 resolveLocationTagUuid: item.id=${item.id}, label=${item.label}, locationId=${item.locationId}, tagName=${tagName}, compartmentContents keys=`, item.compartmentContents ? Object.keys(item.compartmentContents) : 'none');
        if (!tagName) return null;
        const uuid = findLocationTagUuid(tagName);
        if (!uuid) {
          console.warn(`⚠️ Location tag "${tagName}" not found in loaded tags (${locationTags.length} tags loaded)`);
        }
        return uuid;
      };

      // Create new components
      const createPromises = toCreate.map(item => {
        const payload = itemToCreatePayload(item);
        // Resolve location tag and inject into payload
        const tagUuid = resolveLocationTagUuid(item);
        if (tagUuid) payload.locationTagId = tagUuid;
        console.log(`📤 Creating component: type=${payload.componentType}, label=${payload.label}, locationTagId=${payload.locationTagId}`);
        return warehouseService.createComponent(layoutId, payload)
          .then(async backendComp => {
            console.log(`✅ Created component ${backendComp.id} (was ${item.id}), locationTagId=${backendComp.locationTagId}`);
            // Update local item ID to match backend
            setWarehouseItems(prev => prev.map(i =>
              i.id === item.id ? { ...i, id: backendComp.id, _backendId: backendComp.id } : i
            ));
            // If locationTagId wasn't set via create payload, try setComponentLocationTag as fallback
            if (tagUuid && !backendComp.locationTagId) {
              try {
                await warehouseService.setComponentLocationTag(backendComp.id, tagUuid);
                console.log(`🏷️ Set location_tag_id via fallback for ${backendComp.id}`);
              } catch (err: any) {
                console.warn(`⚠️ Fallback setComponentLocationTag failed:`, err?.response?.status, err?.response?.data || err.message);
              }
            }
            return backendComp;
          })
          .catch(err => {
            console.error(`❌ Failed to create component for ${item.id}:`, err?.response?.status, err?.response?.data || err.message);
            return null;
          });
      });

      // Update existing components (full snapshot + location tag)
      const updatePromises = toUpdate.map(item => {
        const payload = itemUpdatesToPayload(item);
        const fullPayload = itemToCreatePayload(item);
        payload.metadata = fullPayload.metadata;
        // Resolve location tag and inject into payload
        const tagUuid = resolveLocationTagUuid(item);
        if (tagUuid !== null) payload.locationTagId = tagUuid;
        return warehouseService.updateComponent(item.id, payload)
          .then(async () => {
            console.log(`✅ Updated component ${item.id}, locationTagId=${tagUuid}`);
            // Also call setComponentLocationTag to ensure FK is set
            if (tagUuid !== undefined) {
              try {
                await warehouseService.setComponentLocationTag(item.id, tagUuid);
                console.log(`🏷️ Set location_tag_id for ${item.id}: ${tagUuid ?? 'NULL'}`);
              } catch (err: any) {
                console.warn(`⚠️ Failed to set location tag for ${item.id}:`, err?.response?.status, err?.response?.data || err.message);
              }
            }
          })
          .catch(err => console.warn(`⚠️ Failed to update component ${item.id}:`, err?.response?.status, err?.response?.data || err.message));
      });

      // Delete removed components
      const deletePromises = toDelete.map(comp =>
        warehouseService.deleteComponent(comp.id)
          .then(() => console.log(`✅ Deleted stale component ${comp.id}`))
          .catch(err => console.warn(`⚠️ Failed to delete component ${comp.id}:`, err?.response?.status, err?.response?.data || err.message))
      );

      await Promise.allSettled([...createPromises, ...updatePromises, ...deletePromises]);
      console.log('✅ Component sync complete');
    } catch (err: any) {
      console.error('❌ Component sync failed:', err?.message || err);
    }
  }, [warehouseItems, findLocationTagUuid, extractPrimaryLocationTagName, locationTags]);

  const handleCanvasClick = useCallback(() => {
    setSelectedItemId(null);
    setSelectedItemIds([]);
    setShowBoundaryDropdown(false);
    setContextMenu(null);
    setInfoPopup(null);
    setZoneContextMenu(null);
  }, []);

  const handleInfoClick = useCallback((e: MouseEvent, item: any) => {
    setInfoPopup({
      item,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const handleCloseInfoPopup = useCallback(() => {
    setInfoPopup(null);
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handlePanChange = useCallback((newPanOffset: any, newZoomLevel?: number) => {
    setPanOffset(newPanOffset);
    if (newZoomLevel !== undefined) {
      setZoomLevel(newZoomLevel);
    }
  }, []);

  const handleToggleStackMode = useCallback(() => {
    setStackMode(prev => prev === STACK_MODES.ENABLED ? STACK_MODES.DISABLED : STACK_MODES.ENABLED);
  }, []);

  const handleRightClick = useCallback((e: MouseEvent, item: any) => {
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

  const handleLockToggle = useCallback((itemId: string, lockType: any, isLocked: any) => {
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

  const handleAddUnitsToZone = useCallback((units: any) => {
    setWarehouseItems(prev => [...prev, ...units]);
  }, []);

  const handleClearZone = useCallback((zoneId: string) => {
    setWarehouseItems(prev => prev.filter(item => item.containerId !== zoneId));
  }, []);

  const handleCreateStack = useCallback((baseItemId: string, draggedItemId: string, newItem: any) => {
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

  const handleAddLayerAbove = useCallback((item: any) => {
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

  const handleAddLayerBelow = useCallback((item: any) => {
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

  const handleManageStack = useCallback((item: any) => {
    setStackManager(item);
  }, []);

  const handleCloseStackManager = useCallback(() => {
    setStackManager(null);
  }, []);

  const handleUpdateStack = useCallback((updatedStack: any) => {
    setWarehouseItems(prev =>
      prev.map(item =>
        item.id === updatedStack.id
          ? { ...item, stack: updatedStack.stack }
          : item
      )
    );
  }, []);

  const handleDeleteLayer = useCallback((layerIndex: number) => {
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

  // Handle organization mapping selection
  const handleOrgMapSelect = useCallback((orgMap: any) => {
    if (!selectedOrgUnit) return;

    if (!orgMap) {
      setSelectedOrgMap(null);
      setLayoutName(`${selectedOrgUnit.name} Layout`);
      setLayoutNameSet(true);
      return;
    }

    const layoutName = `${selectedOrgUnit.name} - ${orgMap.name}`;

    setSelectedOrgMap(orgMap);
    setLayoutName(layoutName);
    setLayoutNameSet(true);
  }, [selectedOrgUnit]);

  // Handle Location ID request from WarehouseItem
  const handleLocationIdRequest = useCallback((itemId: string, compartmentId: any, row: any, col: any) => {
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
  const handleLocationIdSelect = useCallback((data: any) => {
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
      // Sync primary location tag to backend component's location_tag_id
      syncLocationTagToBackend(itemId, resolvedPrimary || null);
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
        locationData: {
          isMultiLocation: true,
          locationIds: data.locationIds,
          primaryLocationId: primaryLocationId,
          quantity: data.locationIds.length,
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
      // Sync primary location tag to backend component's location_tag_id
      syncLocationTagToBackend(itemId, primaryLocationId || null);
      setSkuIdSelectorVisible(false);
      setPendingSkuRequest(null);
      return;
    }

    // Handle single location units (Storage Unit)
    if (compartmentId === 'single-sku') {
      handleUpdateItem(itemId, {
        locationId: locationId,
        locationData: {
          locationId: locationId,
          quantity: 1,
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
      // Sync location tag to backend component's location_tag_id
      syncLocationTagToBackend(itemId, locationId || null);
    } else {
      // Handle compartmentalized units (Horizontal Storage Racks)
      const newContents = {
        ...item.compartmentContents,
        [compartmentId]: {
          locationId: locationId,
          quantity: 1,
          storageSpace: `${Math.floor(item.width / 60)}x${Math.floor(item.height / 60)}`,
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
      // Sync the first assigned location tag to backend component's location_tag_id
      syncLocationTagToBackend(itemId, locationId || null);
    }

    setSkuIdSelectorVisible(false);
    setPendingSkuRequest(null);
  }, [pendingSkuRequest, warehouseItems, handleUpdateItem, syncLocationTagToBackend]);

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

  const handleMapTypeSelected = useCallback((selection: any) => {
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

    // -----------------------------------------------------------------------
    // Backend persistence: save/update layout in the database
    // -----------------------------------------------------------------------
    // Ensure layoutData is JSON-safe (strip functions, React refs, etc.)
    let safeLayoutData: Record<string, any> = {};
    try {
      safeLayoutData = JSON.parse(JSON.stringify(layoutData));
    } catch (e) {
      console.warn('⚠️ layoutData contains non-serializable values, filtering:', e);
      safeLayoutData = { name: layoutData.name, operationalStatus: layoutData.operationalStatus, version: layoutData.version };
    }

    const backendPayload = {
      layoutName: layoutName,
      status: operationalStatus,
      layoutData: safeLayoutData,
      metadata: safeLayoutData.metadata || null,
    };

    console.log('📤 Saving layout to backend, activeLayoutId:', activeLayoutId, 'payload keys:', Object.keys(backendPayload));
    if (activeLayoutId) {
      // Update existing backend layout, then sync components
      warehouseService.updateLayout(activeLayoutId, backendPayload)
        .then(updatedLayout => {
          console.log('✅ Layout updated in backend:', updatedLayout.id);
          window.dispatchEvent(new CustomEvent('layoutSaved'));
          return syncComponentsToBackend(updatedLayout.id);
        })
        .catch(err => console.error('❌ Failed to update layout in backend:', err?.response?.status, err?.response?.data || err.message));
    } else if (selectedOrgUnit) {
      // Create new backend layout, then sync components
      warehouseService.createLayout(selectedOrgUnit.id, backendPayload)
        .then(createdLayout => {
          console.log('✅ Layout created in backend:', createdLayout.id);
          setActiveLayoutId(createdLayout.id);
          setOriginalLayoutId(createdLayout.id);
          window.dispatchEvent(new CustomEvent('layoutSaved'));
          return syncComponentsToBackend(createdLayout.id);
        })
        .catch(err => console.error('❌ Failed to create layout in backend:', err?.response?.status, err?.response?.data || err.message));
    }

    // Show confirmation with status
    const statusLabels = {
      'operational': 'Operational (Ready for live operations)',
      'draft': 'Draft (Work in progress - not ready for operations)'
    };

    // Show confirmation with ultra-tight cropping info
    const croppingInfo = operationalMetadata.whitespaceRemoved.x > 0 || operationalMetadata.whitespaceRemoved.y > 0
      ? `\n\nUltra-tight optimization: Removed ${operationalMetadata.whitespaceRemoved.x}px × ${operationalMetadata.whitespaceRemoved.y}px of white space\nFinal size: ${operationalMetadata.croppedDimensions.width}px × ${operationalMetadata.croppedDimensions.height}px\nZero padding applied for maximum focus`
      : '';

    showMessage.success(`Layout "${layoutName}" saved successfully!\n\nOrganizational Unit: ${selectedOrgUnit?.name || 'Unknown'}\nStatus: ${statusLabels[operationalStatus as keyof typeof statusLabels] || 'Unknown'}${croppingInfo}\n\nThis layout is now available in the Live Warehouse Maps section.`);

    // Close the map type selector modal
    setMapTypeSelectorVisible(false);
  }, [warehouseItems, layoutName, layoutNameSet, selectedOrgUnit, selectedOrgMap, activeLayoutId, syncComponentsToBackend]);

  const handleSave = useCallback(() => {
    // If no org unit selected, prompt user to select one
    if (!selectedOrgUnit) {
      showMessage.warning('Please select an organizational unit from the dropdown in the top navigation bar before saving.');
      return;
    }

    if (activeLayoutId) {
      // EDIT MODE: bypass the status picker modal — preserve the existing status and update directly
      const existingStatus = (initialLayout as any)?.status || 'operational';
      handleMapTypeSelected({ status: { id: existingStatus } });
    } else {
      // CREATE MODE: show the status picker modal (Save as Operational / Draft)
      setMapTypeSelectorVisible(true);
    }
  }, [selectedOrgUnit, activeLayoutId, initialLayout, handleMapTypeSelected]);

  const handleLoad = useCallback(() => {
    // Try to load from localStorage
    const savedData = localStorage.getItem('loadLayoutData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.items && Array.isArray(data.items)) {
          setWarehouseItems(data.items);
          setSelectedItemId(null);
        } else {
          showMessage.error('Invalid file format');
        }
      } catch (error) {
        showMessage.error('Failed to load layout');
      }
      // Clear the temporary load data
      localStorage.removeItem('loadLayoutData');
    }
  }, []);

  const handleClear = useCallback(() => {
    setWarehouseItems([]);
    setSelectedItemId(null);
    setLayoutName('Warehouse Management System');
    setLayoutNameSet(false);
    setSelectedOrgUnit(null);
    setLayoutNameSet(false);
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

  // STEP 5 — paste the two new functions right here ↓
  const handleGenerateInnerBoundary = useCallback(() => {
    if (selectedItemIds.length === 0) return;

    const BOUNDARY_TYPES = ['square_boundary', 'inner_boundary'];
    const selectedItems = warehouseItems.filter(
      i => selectedItemIds.includes(i.id) && !BOUNDARY_TYPES.includes(i.type)
    );
    if (selectedItems.length === 0) return;

    const padding = 24;
    const minX = Math.min(...selectedItems.map(i => i.x)) - padding;
    const minY = Math.min(...selectedItems.map(i => i.y)) - padding;
    const maxX = Math.max(...selectedItems.map(i => i.x + (i.width || 100))) + padding;
    const maxY = Math.max(...selectedItems.map(i => i.y + (i.height || 80))) + padding;

    const innerBoundaryCount = warehouseItems.filter(i => i.type === 'inner_boundary').length;

    const newBoundary = {
      id: uuidv4(),
      type: 'inner_boundary',
      name: `Zone ${innerBoundaryCount + 1}`,
      label: `Zone ${innerBoundaryCount + 1}`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      boundedItemIds: selectedItemIds,
      color: getComponentColor('inner_boundary'),
      containerLevel: 1,
    };

    setWarehouseItems(prev => [...prev, newBoundary]);
    setSelectedItemIds([]);
    setSelectedItemId(null);
    setShowBoundaryDropdown(false);
    showMessage.success(`Inner boundary created for ${selectedItems.length} component(s).`);
  }, [selectedItemIds, warehouseItems]);

  const handleRemoveInnerBoundary = useCallback(() => {
    if (!existingInnerBoundaryForSelection) return;
    setWarehouseItems(prev => prev.filter(i => i.id !== existingInnerBoundaryForSelection.id));
    setSelectedItemIds([]);
    setSelectedItemId(null);
    setShowBoundaryDropdown(false);
    showMessage.success('Inner boundary removed.');
  }, [existingInnerBoundaryForSelection]);

  // Navigation handlers
  const handleNavigateToBuilder = useCallback(() => {
    setShowMainDashboard(false);
  }, []);

  const handleNavigateToDashboard = useCallback(() => {
    router.push('/warehouse-management');
  }, [router]);

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
            {/* Debug: Log what's being passed to TopNavbar */}
            {console.log('WarehouseLayoutBuilder - Passing to TopNavbar - selectedOrgUnit:', selectedOrgUnit)}
            <TopNavbar
              layoutName={layoutName}
              selectedOrgUnit={selectedOrgUnit}
              onOrgUnitSelect={handleOrgUnitSelect}
              selectedOrgMap={selectedOrgMap}
              onOrgMapSelect={handleOrgMapSelect}
              locationTags={locationTags}
              isLoadingLocationTags={isLoadingLocationTags}
              onSave={handleSave}
              onLoad={handleLoad}
              onClear={handleClear}
              onZoomReset={handleZoomReset}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onAutoGenerateBoundary={handleAutoGenerateBoundary}
              itemCount={warehouseItems.length}
              onNavigateToDashboard={handleNavigateToDashboard}
              isEditMode={!!activeLayoutId}
              autoRefreshSeconds={autoRefreshSeconds}
              onAutoRefreshChange={setAutoRefreshSeconds}
              onManualRefresh={refreshFromBackend}
              isRefreshing={isRefreshing}
              lastRefresh={lastRefresh}
              hasActiveLayout={!!activeLayoutId}
            />

            <div className="main-content">
              {/* Debug: Log warehouseItems state */}
              {console.log('WarehouseCanvas - warehouseItems:', warehouseItems)}
              {console.log('WarehouseCanvas - warehouseItems length:', warehouseItems.length)}
              {console.log('WarehouseCanvas - warehouseItems sample:', warehouseItems[0])}
              <ComponentPanel />

              <WarehouseCanvas
                items={warehouseItems}
                onAddItem={handleAddItem}
                onMoveItem={handleMoveItem}
                onSelectItem={handleSelectItem}
                selectedItemId={selectedItemId}
                selectedItemIds={selectedItemIds}
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

            {/* Inner Boundary Floating Dropdown */}
            {selectionBoundingBox && selectedItemIds.length > 0 && (
              <div
                style={{
                  position: 'fixed',
                  left: '330px',
                  top: '70px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                {/* ▾ trigger button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBoundaryDropdown(prev => !prev);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    background: existingInnerBoundaryForSelection ? '#E53E3E' : '#4A90E2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 5,
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                    fontWeight: 'bold',
                  }}
                  title="Boundary options"
                >
                  ▾
                </button>

                {/* Dropdown menu */}
                {showBoundaryDropdown && (
                  <div
                    style={{
                      marginTop: 4,
                      background: '#1e2530',
                      border: '1px solid #30363d',
                      borderRadius: 7,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      minWidth: 180,
                    }}
                  >
                    {existingInnerBoundaryForSelection ? (
                      <button
                        onClick={handleRemoveInnerBoundary}
                        style={dropdownItemStyle('#fc8181')}
                      >
                        ✕ &nbsp; Remove Boundary
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateInnerBoundary}
                        style={dropdownItemStyle('#68d391')}
                      >
                        ⬡ &nbsp; Generate Boundary
                      </button>
                    )}
                  </div>
                )}
              </div>
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
          onClose={() => {
            setSkuIdSelectorVisible(false);
            setPendingSkuRequest(null);
          }}
          onSave={handleLocationIdSelect}
          existingLocationIds={warehouseItems.flatMap(item => {
            const ids: string[] = [];
            const addId = (value?: string) => {
              if (!value) return;
              ids.push(value);
            };
            // Compartment contents (storage racks)
            if (item.compartmentContents) {
              Object.values(item.compartmentContents).forEach((content: any) => {
                if (!content) return;
                if (content.isMultiLocation && content.locationIds) {
                  content.locationIds.forEach(addId);
                } else if (content.locationId) {
                  addId(content.locationId);
                } else if (content.uniqueId) {
                  addId(content.uniqueId);
                }
              });
            }
            // Level-location mappings (vertical racks)
            if (Array.isArray(item.levelLocationMappings)) {
              item.levelLocationMappings.forEach((m: any) => {
                const id = m?.locationId || m?.locId;
                addId(id);
              });
            }
            // Single location ID (storage units)
            addId(item.locationId);
            // Multi-location data
            if (item.locationData?.isMultiLocation && item.locationData?.locationIds) {
              item.locationData.locationIds.forEach(addId);
            }
            return ids.filter(Boolean);
          })}
          locationTags={locationTags}
          isLoadingLocationTags={isLoadingLocationTags}
          allowMultipleIds={pendingSkuRequest ? (() => {
            const item = warehouseItems.find(item => item.id === pendingSkuRequest.itemId);
            // Disable multiple IDs for horizontal storage racks (sku_holder)
            return item?.type !== 'sku_holder';
          })() : false}
        />

        {/* Multi Location ID Selector Modal for Vertical Storage Racks */}
        <MultiLocationSelector
          isVisible={multiLocationSelectorVisible}
          onClose={handleMultiLocationSelectorClose}
          onSave={handleLocationIdSelect}
          existingLocationIds={warehouseItems.flatMap(item => {
            const ids: string[] = [];
            const addId = (value?: string) => {
              if (!value) return;
              ids.push(value);
            };
            if (item.compartmentContents) {
              Object.values(item.compartmentContents).forEach((content: any) => {
                if (!content) return;
                if (content.isMultiLocation && content.locationIds) {
                  content.locationIds.forEach(addId);
                } else if (content.locationId) {
                  addId(content.locationId);
                } else if (content.uniqueId) {
                  addId(content.uniqueId);
                }
              });
            }
            if (Array.isArray(item.levelLocationMappings)) {
              item.levelLocationMappings.forEach((m: any) => {
                const id = m?.locationId || m?.locId;
                addId(id);
              });
            }
            addId(item.locationId);
            if (item.locationData?.isMultiLocation && item.locationData?.locationIds) {
              item.locationData.locationIds.forEach(addId);
            }
            return ids.filter(Boolean);
          })}
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
          locationTags={locationTags}
          isLoadingLocationTags={isLoadingLocationTags}
        />

        {/* Map Type Selector Modal - Select operational status before saving (create mode only) */}
        <OrgUnitSelector
          isVisible={mapTypeSelectorVisible}
          onClose={() => setMapTypeSelectorVisible(false)}
          onSave={handleMapTypeSelected}
        />

        {/* Existing Layout Warning Modal - shown when user tries to create a layout for an org unit that already has one */}
        {existingLayoutWarningVisible && existingLayoutForUnit && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
            }}
            onClick={() => setExistingLayoutWarningVisible(false)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,0.98) 100%)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 16, padding: 0, width: 480, maxWidth: '90vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.8) 100%)',
                borderBottom: '1px solid rgba(239,68,68,0.3)',
                padding: '20px 24px', fontSize: '1.0625rem', fontWeight: 700,
                color: '#fff', textAlign: 'center', letterSpacing: '-0.02em'
              }}>
                ⚠️ Layout Already Exists
              </div>
              {/* Body */}
              <div style={{ padding: '24px', color: '#cbd5e1', fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', color: '#f1f5f9', fontWeight: 600 }}>
                  This Org Unit already has a saved layout.
                </p>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Only one map is allowed per Org Unit. To make changes, please edit the existing layout.
                </p>
              </div>
              {/* Footer */}
              <div style={{
                display: 'flex', gap: 12, justifyContent: 'flex-end',
                padding: '16px 24px', borderTop: '1px solid rgba(239,68,68,0.2)',
                background: 'rgba(15,23,42,0.5)'
              }}>
                <button
                  style={{
                    padding: '0.75rem 1.25rem', borderRadius: 8, fontSize: '0.875rem',
                    fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.3)',
                    background: 'rgba(30,41,59,0.6)', color: '#cbd5e1'
                  }}
                  onClick={() => setExistingLayoutWarningVisible(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: 8, fontSize: '0.875rem',
                    fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.5)',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.2)'
                  }}
                  onClick={() => {
                    setExistingLayoutWarningVisible(false);
                    router.push(`/warehouse-management/edit/${existingLayoutForUnit.id}`);
                  }}
                >
                  Edit Existing Layout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default App;
