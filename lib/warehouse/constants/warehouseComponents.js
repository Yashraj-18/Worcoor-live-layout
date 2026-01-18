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
  PATHWAYS_ARROWS: 'pathways_arrows'
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
  GRID: 'grid'
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
  
  // Common Areas
  [COMPONENT_TYPES.FIRE_EXIT_MARKING]: '#F44336', // Red - Fire safety
  [COMPONENT_TYPES.SECURITY_AREA]: '#9C27B0', // Purple - Security
  [COMPONENT_TYPES.RESTROOMS_AREA]: '#607D8B', // Blue Gray - Facilities
  [COMPONENT_TYPES.PATHWAYS_ARROWS]: '#FF9800', // Orange - Directional guidance
  
  // Zone Components
  [COMPONENT_TYPES.WAREHOUSE_BLOCK]: '#FF9800', // Orange - Warehouse blocks
  [COMPONENT_TYPES.STORAGE_ZONE]: '#9C27B0', // Purple - Storage zones
  [COMPONENT_TYPES.PROCESSING_AREA]: '#F44336', // Red - Processing areas
  [COMPONENT_TYPES.CONTAINER_UNIT]: '#00BCD4', // Cyan - Container units
  [COMPONENT_TYPES.ZONE_DIVIDER]: '#795548', // Brown - Zone dividers
  [COMPONENT_TYPES.AREA_BOUNDARY]: '#607D8B' // Blue Gray - Area boundaries
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
        icon: "🚪",
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
        icon: "🔒",
        color: "#9C27B0", // Purple for security
        defaultSize: { width: 180, height: 120 }, // 3×2 grid blocks
        description: "Security monitoring and access control area",
        priority: "high",
        snapToGrid: true,
        gridAligned: true,
        gridStep: 60,
        resizable: true,
        minSize: { width: 120, height: 120 }, // Minimum 2×2 grid blocks
        maxSize: { width: 300, height: 240 }, // Maximum 5×4 grid blocks
        isRestricted: true,
        isContainer: true,
        containerLevel: 2,
        containerPadding: 8
      },
      {
        type: COMPONENT_TYPES.RESTROOMS_AREA,
        name: "Restrooms Area",
        icon: "🚻",
        color: "#607D8B", // Blue Gray for facilities
        defaultSize: { width: 120, height: 120 }, // 2×2 grid blocks
        description: "Restroom facilities area for warehouse personnel",
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
  }
];
