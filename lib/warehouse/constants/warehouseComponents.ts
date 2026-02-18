// Import COMPONENT_TYPES from separate file to avoid circular dependencies
import { COMPONENT_TYPES } from './componentTypes';

// Re-export for other files
export { COMPONENT_TYPES };

// Drag and drop types
export const DRAG_TYPES = {
  COMPONENT: 'component',
  WAREHOUSE_ITEM: 'warehouse_item'
};

// Stack modes for component stacking
export const STACK_MODES = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  GRID: 'grid',
  ENABLED: 'enabled',
  DISABLED: 'disabled'
};


// Storage orientation
export const STORAGE_ORIENTATION = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

// Stackable components - Basic stackable types to prevent stacking errors
export const STACKABLE_COMPONENTS = [
  // Basic stackable component types
  COMPONENT_TYPES.STORAGE_ZONE,
  COMPONENT_TYPES.CONTAINER_UNIT,
  COMPONENT_TYPES.WAREHOUSE_BLOCK,
  
  // More stackable components will be added as we build them
];

// Structural elements - Basic structural types to prevent errors
export const STRUCTURAL_ELEMENTS = [
  // Basic structural element types
  COMPONENT_TYPES.ZONE_DIVIDER,
  COMPONENT_TYPES.AREA_BOUNDARY,
  COMPONENT_TYPES.WAREHOUSE_BLOCK,
  COMPONENT_TYPES.SQUARE_BOUNDARY,
  
  // Storage Components
  COMPONENT_TYPES.STORAGE_UNIT,
  COMPONENT_TYPES.SKU_HOLDER,
  COMPONENT_TYPES.VERTICAL_SKU_HOLDER
];

// Location zones (empty for now)
export const LOCATION_ZONES = {
  // Will be populated as we add location zones
};

// Fixed Component Color Coding for Consistency - Realistic Colors
// Import component panel colors from centralized configuration
import { getComponentPanelColor } from '../config/componentPanelColors';
// Import storage component status colors
import { getStorageComponentStatusColor } from '../config/componentStatusColor';

// Legacy export for backward compatibility - now uses centralized color config
export const COMPONENT_COLORS = {
  // All components set to transparent for no color display
  // This object is kept for backward compatibility but should not be modified directly
  
  // Floor Plan Components
  [COMPONENT_TYPES.SQUARE_BOUNDARY]: 'transparent',
  
  // Storage Components
  [COMPONENT_TYPES.STORAGE_UNIT]: 'transparent',
  [COMPONENT_TYPES.SKU_HOLDER]: 'transparent',
  [COMPONENT_TYPES.VERTICAL_SKU_HOLDER]: 'transparent',
  
  // Zone Components
  [COMPONENT_TYPES.WAREHOUSE_BLOCK]: 'transparent',
  [COMPONENT_TYPES.STORAGE_ZONE]: 'transparent',
  [COMPONENT_TYPES.CONTAINER_UNIT]: 'transparent',
  [COMPONENT_TYPES.ZONE_DIVIDER]: 'transparent',
  [COMPONENT_TYPES.AREA_BOUNDARY]: 'transparent',
  
  // Common Areas
  [COMPONENT_TYPES.FIRE_EXIT_MARKING]: 'transparent',
  [COMPONENT_TYPES.SECURITY_AREA]: 'transparent',
  [COMPONENT_TYPES.RESTROOMS_AREA]: 'transparent',
  [COMPONENT_TYPES.PATHWAYS_ARROWS]: 'transparent',
  
  // Office Spaces
  [COMPONENT_TYPES.CONFERENCE_ROOM]: 'transparent',
  [COMPONENT_TYPES.MEETING_ROOMS]: 'transparent',
  [COMPONENT_TYPES.PANTRY_AREA]: 'transparent',
  [COMPONENT_TYPES.OPEN_STAGE]: 'transparent',
  [COMPONENT_TYPES.SEATING_AREA]: 'transparent',
  [COMPONENT_TYPES.BOOTHS]: 'transparent',
  [COMPONENT_TYPES.GENERAL_AREA]: 'transparent',
  
  // Primary Warehouse Operations
  [COMPONENT_TYPES.DISPATCH_GATES]: 'transparent',
  [COMPONENT_TYPES.INBOUND_GATES]: 'transparent'
};



// Warehouse Components - organized by categories
export const WAREHOUSE_COMPONENTS = [
  {
    category: "Primary Components",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.SKU_HOLDER,
        name: "Horizontal Storage Rack",
        color: getComponentPanelColor(COMPONENT_TYPES.SKU_HOLDER),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block = 1 SKU compartment
        description: "Horizontal storage rack system where each 60×60px grid block holds 1 SKU unit",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block = 1 compartment
        isContainer: true,
        containerLevel: 3,
        containerPadding: 4,
        skuGrid: true, // Special property to indicate this has SKU compartments
        showCompartments: true, // Show visual compartment grid
        allowEmpty: true, // Compartments can be vacant
        maxSKUsPerCompartment: 1 // One SKU unit per compartment
      },
      {
        type: COMPONENT_TYPES.VERTICAL_SKU_HOLDER,
        name: "Vertical Storage Rack",
        color: getComponentPanelColor(COMPONENT_TYPES.VERTICAL_SKU_HOLDER),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block = 1 SKU compartment
        description: "Vertical storage rack system where each 60×60px grid block holds 1 SKU unit",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block = 1 compartment
        isContainer: true,
        containerLevel: 3,
        containerPadding: 4,
        skuGrid: true, // Special property to indicate this has SKU compartments
        showCompartments: true, // Show visual compartment grid
        allowEmpty: true, // Compartments can be vacant
        maxSKUsPerCompartment: 1, // One SKU unit per compartment
        supportsMultipleLocationIds: true, // Support multiple location IDs (L1, L2, L3)
        supportsMultipleLevels: true // Support multiple levels per location
      },
    ]
  },
  {
    category: "Gates",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.DISPATCH_GATES,
        name: "Dispatch Gates",
        icon: "/assets/images/icons/dispatch-gate1.png",
        color: getComponentPanelColor(COMPONENT_TYPES.DISPATCH_GATES),
        defaultSize: { width: 120, height: 60 }, // 2×1 grid blocks
        description: "Dispatch gates for loading and shipping operations",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 240, height: 120 }, // Maximum 4×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 6
      },
      {
        type: COMPONENT_TYPES.INBOUND_GATES,
        name: "Inbound Gates",
        icon: "/assets/images/icons/inbound-gate1.png",
        color: getComponentPanelColor(COMPONENT_TYPES.INBOUND_GATES),
        defaultSize: { width: 120, height: 60 }, // 2×1 grid blocks
        description: "Inbound gates for receiving and unloading operations",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 240, height: 120 }, // Maximum 4×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 6
      }
    ]
  },
  {
    category: "Storage Components",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Storage Unit",
        color: getStorageComponentStatusColor("Storage Unit"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Individual storage unit with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Open Storage Space",
        color: getStorageComponentStatusColor("Open Storage Space"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Open storage space with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Dispatch Staging Area",
        color: getStorageComponentStatusColor("Dispatch Staging Area"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Dispatch staging area with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Grading Area",
        color: getStorageComponentStatusColor("Grading Area"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Grading area with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Processing Area",
        color: getStorageComponentStatusColor("Processing Area"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Processing area with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Production Area",
        color: getStorageComponentStatusColor("Production Area"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Production area with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Packaging Area",
        color: getStorageComponentStatusColor("Packaging Area"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Packaging area with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      },
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Cold Storage",
        color: getStorageComponentStatusColor("Cold Storage"),
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Temperature-controlled cold storage unit for perishable goods",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        supportsMultipleLocationIds: true // Support multiple location IDs
      }
    ]
  },
  {
    category: "Common Areas",
    priority: "medium",
    expanded: false,
    components: [
      {
        type: COMPONENT_TYPES.FIRE_EXIT_MARKING,
        name: "Fire Exit Marking",
        icon: "/assets/images/icons/Fire Exit marking.png",
        color: getComponentPanelColor(COMPONENT_TYPES.FIRE_EXIT_MARKING),
        defaultSize: { width: 120, height: 30 }, // 2×0.5 grid blocks
        description: "Fire exit safety marking for emergency evacuation routes",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 60, height: 30 }, // Minimum 1×0.5 grid block
        maxSize: { width: 240, height: 120 }, // Maximum 4×2 grid blocks
        isSafetyFeature: true,
        isPathway: true
      },
      {
        type: COMPONENT_TYPES.SECURITY_AREA,
        name: "Security Area",
        icon: "/assets/images/icons/security.png",
        color: getComponentPanelColor(COMPONENT_TYPES.SECURITY_AREA),
        defaultSize: { width: 180, height: 30 }, // 3×0.5 grid blocks
        description: "Security monitoring and access control area",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 120, height: 30 }, // Minimum 2×0.5 grid blocks
        maxSize: { width: 300, height: 120 }, // Maximum 5×2 grid blocks
        isRestricted: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.RESTROOMS_AREA,
        name: "Restrooms Area",
        icon: "/assets/images/icons/rest room area.png",
        color: getComponentPanelColor(COMPONENT_TYPES.RESTROOMS_AREA),
        defaultSize: { width: 120, height: 30 }, // 2×0.5 grid blocks
        description: "Restroom facilities area for warehouse personnel",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 120, height: 30 }, // Minimum 2×0.5 grid blocks
        maxSize: { width: 240, height: 120 }, // Maximum 4×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.PATHWAYS_ARROWS,
        name: "Pathways Arrows",
        icon: "/assets/images/icons/Pathways arrows.png",
        color: getComponentPanelColor(COMPONENT_TYPES.PATHWAYS_ARROWS),
        defaultSize: { width: 180, height: 30 }, // 3×0.5 grid blocks
        description: "Directional arrows for pathway and traffic flow guidance",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 60, height: 30 }, // Minimum 1×0.5 grid block
        maxSize: { width: 360, height: 120 }, // Maximum 6×2 grid blocks
        isDirectional: true,
        isPathway: true,
        rotatable: true
      }
    ]
  },
  {
    category: "Office Spaces",
    priority: "medium",
    expanded: false,
    components: [
      {
        type: COMPONENT_TYPES.CONFERENCE_ROOM,
        name: "Conference Room",
        icon: "/assets/images/icons/Conference room.png",
        color: getComponentPanelColor(COMPONENT_TYPES.CONFERENCE_ROOM),
        defaultSize: { width: 300, height: 30 }, // 5×0.5 grid blocks
        description: "Large conference room for meetings and presentations",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 180, height: 30 }, // Minimum 3×0.5 grid blocks
        maxSize: { width: 480, height: 360 }, // Maximum 8×6 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 12
      },
      {
        type: COMPONENT_TYPES.MEETING_ROOMS,
        name: "Meeting Rooms",
        icon: "/assets/images/icons/Meeting Room.png",
        color: getComponentPanelColor(COMPONENT_TYPES.MEETING_ROOMS),
        defaultSize: { width: 180, height: 30 }, // 3×0.5 grid blocks
        description: "Small meeting rooms for team discussions",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 120, height: 30 }, // Minimum 2×0.5 grid blocks
        maxSize: { width: 240, height: 240 }, // Maximum 4×4 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.PANTRY_AREA,
        name: "Pantry Area",
        icon: "/assets/images/icons/Pantry Area .png",
        color: getComponentPanelColor(COMPONENT_TYPES.PANTRY_AREA),
        defaultSize: { width: 120, height: 30 }, // 2×0.5 grid blocks
        description: "Kitchen and refreshment area for staff",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 60, height: 30 }, // Minimum 1×0.5 grid block
        maxSize: { width: 180, height: 180 }, // Maximum 3×3 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 6
      },
      {
        type: COMPONENT_TYPES.OPEN_STAGE,
        name: "Open Stage",
        icon: "/assets/images/icons/Open Stage.png",
        color: getComponentPanelColor(COMPONENT_TYPES.OPEN_STAGE),
        defaultSize: { width: 360, height: 30 }, // 6×0.5 grid blocks
        description: "Open stage area for presentations and performances",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 180, height: 30 }, // Minimum 3×0.5 grid blocks
        maxSize: { width: 600, height: 360 }, // Maximum 10×6 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 16
      },
      {
        type: COMPONENT_TYPES.SEATING_AREA,
        name: "Seating Area",
        icon: "/assets/images/icons/Seating Area.png",
        color: getComponentPanelColor(COMPONENT_TYPES.SEATING_AREA),
        defaultSize: { width: 240, height: 30 }, // 4×0.5 grid blocks
        description: "General seating area for informal gatherings",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 120, height: 30 }, // Minimum 2×0.5 grid blocks
        maxSize: { width: 360, height: 120 }, // Maximum 6×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 10
      },
      {
        type: COMPONENT_TYPES.BOOTHS,
        name: "Booths",
        icon: "/assets/images/icons/Booths.png",
        color: getComponentPanelColor(COMPONENT_TYPES.BOOTHS),
        defaultSize: { width: 120, height: 30 }, // 2×0.5 grid blocks
        description: "Private work booths for focused work",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 60, height: 30 }, // Minimum 1×0.5 grid block
        maxSize: { width: 180, height: 180 }, // Maximum 3×3 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 6
      },
      {
        type: COMPONENT_TYPES.GENERAL_AREA,
        name: "General Area",
        icon: "/assets/images/icons/General Area.png",
        color: getComponentPanelColor(COMPONENT_TYPES.GENERAL_AREA),
        defaultSize: { width: 180, height: 30 }, // 3×0.5 grid blocks
        description: "Multipurpose area for various activities",
        priority: "low",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 30,
        resizable: true,
        minSize: { width: 60, height: 30 }, // Minimum 1×0.5 grid block
        maxSize: { width: 360, height: 360 }, // Maximum 6×6 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      }
    ]
  }
];
