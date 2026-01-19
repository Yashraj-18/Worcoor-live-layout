// Component Types - Basic types to prevent errors, will be expanded step by step
export const COMPONENT_TYPES = {
  // Basic structural elements (to prevent import errors)
  WAREHOUSE_BLOCK: 'warehouse_block',
  STORAGE_ZONE: 'storage_zone',
  PROCESSING_AREA: 'processing_area',
  CONTAINER_UNIT: 'container_unit',
  ZONE_DIVIDER: 'zone_divider',
  AREA_BOUNDARY: 'area_boundary',
  
  // Floor Plan Components
  SQUARE_BOUNDARY: 'square_boundary',
  
  // Boundaries
  SOLID_BOUNDARY: 'solid_boundary',
  DOTTED_BOUNDARY: 'dotted_boundary',
  
  // Storage Components (1×1 to 2×2)
  STORAGE_UNIT: 'storage_unit',
  SKU_HOLDER: 'sku_holder',
  VERTICAL_SKU_HOLDER: 'vertical_sku_holder',
  SPARE_UNIT: 'spare_unit',
  
  // Common Areas
  FIRE_EXIT_MARKING: 'fire_exit_marking',
  SECURITY_AREA: 'security_area',
  RESTROOMS_AREA: 'restrooms_area',
  PATHWAYS_ARROWS: 'pathways_arrows',
  
  // Office Spaces
  CONFERENCE_ROOM: 'conference_room',
  MEETING_ROOMS: 'meeting_rooms',
  PANTRY_AREA: 'pantry_area',
  OPEN_STAGE: 'open_stage',
  SEATING_AREA: 'seating_area',
  BOOTHS: 'booths',
  GENERAL_AREA: 'general_area',
  
  // Primary Warehouse Operations
  OPEN_STORAGE_SPACE: 'open_storage_space',
  DISPATCH_STAGING_AREA: 'dispatch_staging_area',
  DISPATCH_GATES: 'dispatch_gates',
  INBOUND_GATES: 'inbound_gates',
  GRADING_AREA: 'grading_area',
  PACKAGING_AREA: 'packaging_area',
  OFFICE_SPACE_AREA: 'office_space_area',
  COLD_STORAGE: 'cold_storage'
};

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

// Occupancy status for warehouse items
export const OCCUPANCY_STATUS = {
  EMPTY: 'empty',
  PARTIAL: 'partial', 
  FULL: 'full',
  MAINTENANCE: 'maintenance',
  RESERVED: 'reserved'
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
  COMPONENT_TYPES.PROCESSING_AREA,
  
  // More stackable components will be added as we build them
];

// Structural elements - Basic structural types to prevent errors
export const STRUCTURAL_ELEMENTS = [
  // Basic structural element types
  COMPONENT_TYPES.ZONE_DIVIDER,
  COMPONENT_TYPES.AREA_BOUNDARY,
  COMPONENT_TYPES.WAREHOUSE_BLOCK,
  COMPONENT_TYPES.SQUARE_BOUNDARY,
  
  // Boundaries
  COMPONENT_TYPES.SOLID_BOUNDARY,
  COMPONENT_TYPES.DOTTED_BOUNDARY,
  
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
export const COMPONENT_COLORS = {
  // Floor Plan Components
  [COMPONENT_TYPES.SQUARE_BOUNDARY]: '#263238', // Dark Gray - Main warehouse boundary
  
  // Boundaries
  [COMPONENT_TYPES.SOLID_BOUNDARY]: '#607D8B', // Blue Gray - Solid divisions
  [COMPONENT_TYPES.DOTTED_BOUNDARY]: '#90A4AE', // Light Blue Gray - Dotted divisions
  
  // Storage Components - Realistic Colors
  [COMPONENT_TYPES.STORAGE_UNIT]: '#4CAF50', // Green - Storage containers/units
  [COMPONENT_TYPES.SKU_HOLDER]: '#2196F3', // Blue - Horizontal storage racks/shelves
  [COMPONENT_TYPES.VERTICAL_SKU_HOLDER]: '#FF9800', // Orange - Vertical storage racks/shelves
  [COMPONENT_TYPES.SPARE_UNIT]: '#8D6E63', // Brown - Spare units (placeholder storage)
  
  // Zone Components
  [COMPONENT_TYPES.WAREHOUSE_BLOCK]: '#FF9800', // Orange - Warehouse blocks
  [COMPONENT_TYPES.STORAGE_ZONE]: '#9C27B0', // Purple - Storage zones
  [COMPONENT_TYPES.PROCESSING_AREA]: '#F44336', // Red - Processing areas
  [COMPONENT_TYPES.CONTAINER_UNIT]: '#00BCD4', // Cyan - Container units
  [COMPONENT_TYPES.ZONE_DIVIDER]: '#795548', // Brown - Zone dividers
  [COMPONENT_TYPES.AREA_BOUNDARY]: '#607D8B', // Blue Gray - Area boundaries
  
  // Office Spaces
  [COMPONENT_TYPES.CONFERENCE_ROOM]: '#3F51B5', // Indigo - Professional meeting space
  [COMPONENT_TYPES.MEETING_ROOMS]: '#009688', // Teal - Collaborative spaces
  [COMPONENT_TYPES.PANTRY_AREA]: '#795548', // Brown - Food/kitchen area
  [COMPONENT_TYPES.OPEN_STAGE]: '#E91E63', // Pink - Presentation/performance area
  [COMPONENT_TYPES.SEATING_AREA]: '#607D8B', // Blue Gray - General seating
  [COMPONENT_TYPES.BOOTHS]: '#FF5722', // Deep Orange - Private work booths
  [COMPONENT_TYPES.GENERAL_AREA]: '#9E9E9E', // Grey - Multipurpose space
  
  // Primary Warehouse Operations
  [COMPONENT_TYPES.OPEN_STORAGE_SPACE]: '#4CAF50', // Green - Open storage area
  [COMPONENT_TYPES.DISPATCH_STAGING_AREA]: '#FF9800', // Orange - Dispatch staging
  [COMPONENT_TYPES.DISPATCH_GATES]: '#2196F3', // Blue - Dispatch gates
  [COMPONENT_TYPES.INBOUND_GATES]: '#00BCD4', // Cyan - Inbound gates
  [COMPONENT_TYPES.GRADING_AREA]: '#9C27B0', // Purple - Quality grading
  [COMPONENT_TYPES.PACKAGING_AREA]: '#FF5722', // Deep Orange - Packaging operations
  [COMPONENT_TYPES.OFFICE_SPACE_AREA]: '#607D8B', // Blue Gray - Office workspace
  [COMPONENT_TYPES.COLD_STORAGE]: '#00BCD4' // Cyan Blue - Cold storage
};

// Storage Category Colors - Based on Storage Type
export const STORAGE_CATEGORY_COLORS = {
  'storage': '#4CAF50',        // Green - General storage
  'dry_storage': '#9E9E9E',    // Grey - Dry storage
  'cold_storage': '#1565C0',   // Dark Blue - Cold storage
  'hazardous': '#F44336',      // Red - Hazardous materials
  'fragile': '#FFEB3B',        // Yellow - Fragile items
  'bulk': '#00BCD4'            // Cyan - Bulk storage
};

// Status color mapping
export const STATUS_COLORS = {
  [OCCUPANCY_STATUS.EMPTY]: '#4CAF50',
  [OCCUPANCY_STATUS.PARTIAL]: '#FF9800', 
  [OCCUPANCY_STATUS.FULL]: '#F44336',
  [OCCUPANCY_STATUS.MAINTENANCE]: '#9C27B0',
  [OCCUPANCY_STATUS.RESERVED]: '#2196F3'
};

// Orientation color mapping
export const ORIENTATION_COLORS = {
  [STORAGE_ORIENTATION.HORIZONTAL]: '#4CAF50',
  [STORAGE_ORIENTATION.VERTICAL]: '#9C27B0'
};

// Warehouse Components - organized by categories
export const WAREHOUSE_COMPONENTS = [
  {
    category: "Primary Components",
    icon: "⭐",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.SKU_HOLDER,
        name: "Horizontal Storage Rack",
        icon: "📋",
        color: "#2196F3", // Fixed Blue - Horizontal storage racks/shelves
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
        icon: "📐",
        color: "#FF9800", // Orange - Vertical storage racks/shelves
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
        supportsMultipleTags: true // Support multiple tags per location
      },
      {
        type: COMPONENT_TYPES.OPEN_STORAGE_SPACE,
        name: "Open Storage Space",
        icon: "📦",
        color: "#4CAF50", // Green - Open storage area
        defaultSize: { width: 60, height: 60 }, // 1×1 grid blocks
        description: "Open storage space for flexible storage arrangements",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid blocks
        maxSize: { width: 120, height: 120 }, // Maximum 2×2 grid blocks
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8,
        storageCategory: 'storage' // General storage category
      },
      {
        type: COMPONENT_TYPES.DISPATCH_STAGING_AREA,
        name: "Dispatch Staging Area",
        icon: "🚚",
        color: "#FF9800", // Orange - Dispatch staging
        defaultSize: { width: 60, height: 60 }, // 1×1 grid blocks
        description: "Staging area for dispatch operations and order fulfillment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid blocks
        maxSize: { width: 120, height: 120 }, // Maximum 2×2 grid blocks
        isContainer: true,
        containerLevel: 2,
        containerPadding: 10,
        storageCategory: 'storage' // General storage category for staging
      },
      {
        type: COMPONENT_TYPES.DISPATCH_GATES,
        name: "Dispatch Gates",
        icon: "/assets/images/icons/dispatch-gate.png",
        color: "#2196F3", // Blue - Dispatch gates
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
        icon: "/assets/images/icons/inbound-gate.png",
        color: "#00BCD4", // Cyan - Inbound gates
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
      },
      {
        type: COMPONENT_TYPES.GRADING_AREA,
        name: "Grading Area",
        icon: "🔍",
        color: "#9C27B0", // Purple - Quality grading
        defaultSize: { width: 60, height: 60 }, // 1×1 grid blocks
        description: "Quality grading and inspection area for products",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid blocks
        maxSize: { width: 120, height: 120 }, // Maximum 2×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8,
        storageCategory: 'storage' // General storage category for grading operations
      },
      {
        type: COMPONENT_TYPES.PACKAGING_AREA,
        name: "Packaging Area",
        icon: "📦",
        color: "#FF5722", // Deep Orange - Packaging operations
        defaultSize: { width: 60, height: 60 }, // 1×1 grid blocks
        description: "Packaging area for product preparation and shipping",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid blocks
        maxSize: { width: 120, height: 120 }, // Maximum 2×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8,
        storageCategory: 'storage' // General storage category for packaging operations
      },
      {
        type: COMPONENT_TYPES.OFFICE_SPACE_AREA,
        name: "Office Space Area",
        icon: "/assets/images/icons/office-space.png",
        color: "#607D8B", // Blue Gray - Office workspace
        defaultSize: { width: 60, height: 60 }, // 1×1 grid blocks
        description: "Office space area for administrative operations",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid blocks
        maxSize: { width: 120, height: 120 }, // Maximum 2×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 3,
        containerPadding: 4,
        skuGrid: true, // Special property to indicate this has compartments
        showCompartments: true, // Show visual compartment grid
        allowEmpty: true, // Compartments can be vacant
        maxSKUsPerCompartment: 1 // One unit per compartment
      },
      {
        type: COMPONENT_TYPES.COLD_STORAGE,
        name: "Cold Storage",
        icon: "❄️",
        color: "#00BCD4", // Cyan Blue - Cold storage
        defaultSize: { width: 60, height: 60 }, // 1×1 grid blocks
        description: "Temperature-controlled storage for perishable goods",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid blocks
        maxSize: { width: 120, height: 120 }, // Maximum 2×2 grid blocks
        isContainer: true,
        containerLevel: 2,
        containerPadding: 10,
        storageCategory: 'cold_storage' // Cold storage category
      }
    ]
  },
  {
    category: "Floor Plan Components",
    icon: "📁",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.SQUARE_BOUNDARY,
        name: "Square Boundary",
        icon: "⬜",
        color: "#263238", // Fixed Dark Gray
        defaultSize: { width: 480, height: 480 }, // 8×8 grid blocks (60px × 8 = 480px)
        description: "Resizable rectangular warehouse boundary with hollow border design",
        priority: "high",
        isBoundary: true,
        isHollow: true,
        borderWidth: 4,
        containerLevel: 1,
        snapToGrid: true,
        gridAligned: true,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 1200, height: 1200 }, // Maximum 20×20 grid blocks
        gridStep: 60 // Resize in 60px increments
      }
    ]
  },
  {
    category: "Boundaries",
    icon: "🔲",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.SOLID_BOUNDARY,
        name: "Solid Boundary",
        icon: "⬜",
        color: "#607D8B", // Fixed Blue Gray
        defaultSize: { width: 180, height: 180 }, // 3×3 grid blocks
        description: "Solid boundary box for zone divisions with normal border",
        priority: "high",
        isBoundary: true,
        isHollow: true,
        borderWidth: 2,
        borderStyle: "solid",
        containerLevel: 2,
        snapToGrid: true,
        gridAligned: true,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 600, height: 600 }, // Maximum 10×10 grid blocks
        gridStep: 60
      },
      {
        type: COMPONENT_TYPES.DOTTED_BOUNDARY,
        name: "Dotted Boundary",
        icon: "⬛",
        color: "#90A4AE", // Fixed Light Blue Gray
        defaultSize: { width: 180, height: 180 }, // 3×3 grid blocks
        description: "Dotted boundary box for zone divisions with dashed border",
        priority: "high",
        isBoundary: true,
        isHollow: true,
        borderWidth: 2,
        borderStyle: "dotted",
        containerLevel: 2,
        snapToGrid: true,
        gridAligned: true,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 600, height: 600 }, // Maximum 10×10 grid blocks
        gridStep: 60
      }
    ]
  },
  {
    category: "Storage Components",
    icon: "🔹",
    priority: "high",
    expanded: true,
    components: [
      {
        type: COMPONENT_TYPES.STORAGE_UNIT,
        name: "Storage Unit",
        icon: "📦",
        color: "#4CAF50", // Fixed Green - Storage containers/units
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block
        description: "Individual storage unit with sequential SKU ID assignment",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        hasSku: true, // Enable SKU functionality
        singleSku: true, // Single SKU per unit (not compartmentalized)
        // Enhanced Labeling Properties
        autoLabel: true, // Enable automatic labeling
        labelPrefix: "SU", // Storage Unit prefix
        labelFormat: "SU-{index:03d}", // Format: SU-001, SU-002, etc.
        showLabel: true, // Display label by default
        labelPosition: "center", // Label position within component
        categoryBasedLabeling: true // Enable category-based label enhancement
      },
      {
        type: COMPONENT_TYPES.SPARE_UNIT,
        name: "Spare Unit",
        icon: "🧱",
        color: "#8D6E63", // Brown tone to distinguish spare units
        defaultSize: { width: 60, height: 60 }, // 1×1 grid block placeholder
        description: "Placeholder spare storage slot reserved for future allocation",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: false,
        isPlaceholder: true,
        allowEmpty: true,
        hasSku: true,
        singleSku: true
      }
    ]
  },
  {
    category: "Common Areas",
    icon: "🏢",
    priority: "medium",
    expanded: false,
    components: [
      {
        type: COMPONENT_TYPES.FIRE_EXIT_MARKING,
        name: "Fire Exit Marking",
        icon: "/assets/images/icons/fire-exit.jpg",
        color: "#F44336", // Red for fire safety
        defaultSize: { width: 120, height: 60 }, // 2×1 grid blocks
        description: "Fire exit safety marking for emergency evacuation routes",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 240, height: 120 }, // Maximum 4×2 grid blocks
        isSafetyFeature: true,
        isPathway: true
      },
      {
        type: COMPONENT_TYPES.SECURITY_AREA,
        name: "Security Area",
        icon: "/assets/images/icons/security-area.png",
        color: "#9C27B0", // Purple for security
        defaultSize: { width: 180, height: 60 }, // 3×1 grid blocks
        description: "Security monitoring and access control area",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 120, height: 60 }, // Minimum 2×1 grid blocks
        maxSize: { width: 300, height: 120 }, // Maximum 5×2 grid blocks
        isRestricted: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.RESTROOMS_AREA,
        name: "Restrooms Area",
        icon: "/assets/images/icons/restroom.png",
        color: "#607D8B", // Blue Gray for facilities
        defaultSize: { width: 120, height: 60 }, // 2×1 grid blocks
        description: "Restroom facilities area for warehouse personnel",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 120, height: 60 }, // Minimum 2×1 grid blocks
        maxSize: { width: 240, height: 120 }, // Maximum 4×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.PATHWAYS_ARROWS,
        name: "Pathways Arrows",
        icon: "➡️",
        color: "#FF9800", // Orange for directional guidance
        defaultSize: { width: 180, height: 60 }, // 3×1 grid blocks
        description: "Directional arrows for pathway and traffic flow guidance",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 360, height: 120 }, // Maximum 6×2 grid blocks
        isDirectional: true,
        isPathway: true,
        rotatable: true
      }
    ]
  },
  {
    category: "Office Spaces",
    icon: "🏢",
    priority: "medium",
    expanded: false,
    components: [
      {
        type: COMPONENT_TYPES.CONFERENCE_ROOM,
        name: "Conference Room",
        icon: "🤝",
        color: "#3F51B5", // Indigo - Professional meeting space
        defaultSize: { width: 300, height: 240 }, // 5×4 grid blocks
        description: "Large conference room for meetings and presentations",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 180, height: 120 }, // Minimum 3×2 grid blocks
        maxSize: { width: 480, height: 360 }, // Maximum 8×6 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 12
      },
      {
        type: COMPONENT_TYPES.MEETING_ROOMS,
        name: "Meeting Rooms",
        icon: "👥",
        color: "#009688", // Teal - Collaborative spaces
        defaultSize: { width: 180, height: 180 }, // 3×3 grid blocks
        description: "Small meeting rooms for team discussions",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 120, height: 120 }, // Minimum 2×2 grid blocks
        maxSize: { width: 240, height: 240 }, // Maximum 4×4 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.PANTRY_AREA,
        name: "Pantry Area",
        icon: "☕",
        color: "#795548", // Brown - Food/kitchen area
        defaultSize: { width: 120, height: 120 }, // 2×2 grid blocks
        description: "Kitchen and refreshment area for staff",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 180, height: 180 }, // Maximum 3×3 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 6
      },
      {
        type: COMPONENT_TYPES.OPEN_STAGE,
        name: "Open Stage",
        icon: "🎭",
        color: "#E91E63", // Pink - Presentation/performance area
        defaultSize: { width: 360, height: 240 }, // 6×4 grid blocks
        description: "Open stage area for presentations and performances",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 180, height: 120 }, // Minimum 3×2 grid blocks
        maxSize: { width: 600, height: 360 }, // Maximum 10×6 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 16
      },
      {
        type: COMPONENT_TYPES.SEATING_AREA,
        name: "Seating Area",
        icon: "/assets/images/icons/seating-area.png",
        color: "#607D8B", // Blue Gray - General seating
        defaultSize: { width: 240, height: 60 }, // 4×1 grid blocks
        description: "General seating area for informal gatherings",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 120, height: 60 }, // Minimum 2×1 grid blocks
        maxSize: { width: 360, height: 120 }, // Maximum 6×2 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 10
      },
      {
        type: COMPONENT_TYPES.BOOTHS,
        name: "Booths",
        icon: "🪟",
        color: "#FF5722", // Deep Orange - Private work booths
        defaultSize: { width: 120, height: 120 }, // 2×2 grid blocks
        description: "Private work booths for focused work",
        priority: "medium",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 180, height: 180 }, // Maximum 3×3 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 6
      },
      {
        type: COMPONENT_TYPES.GENERAL_AREA,
        name: "General Area",
        icon: "🏛️",
        color: "#9E9E9E", // Grey - Multipurpose space
        defaultSize: { width: 180, height: 180 }, // 3×3 grid blocks
        description: "Multipurpose area for various activities",
        priority: "low",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 60, height: 60 }, // Minimum 1×1 grid block
        maxSize: { width: 360, height: 360 }, // Maximum 6×6 grid blocks
        isFacility: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      }
    ]
  }
];
