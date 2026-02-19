// @ts-nocheck
import { LOCATION_ZONES, COMPONENT_TYPES, STRUCTURAL_ELEMENTS } from '../constants/warehouseComponents';
import { facilityHierarchy, FACILITY_LEVELS, FACILITY_TYPES } from './facilityHierarchy';

// Generate hierarchical location code based on component type and position
export const generateLocationCode = (componentType, existingItems, x, y, facilityContext = null) => {
  // Skip location codes for structural elements
  if (STRUCTURAL_ELEMENTS.includes(componentType)) {
    return null;
  }

  // If facility context is provided, use hierarchical system
  if (facilityContext && facilityContext.zoneId) {
    const zone = facilityHierarchy.getFacility(facilityContext.zoneId);
    if (zone) {
      return facilityHierarchy.createFacility({
        name: `${componentType}_location`,
        type: mapComponentToFacilityType(componentType),
        level: FACILITY_LEVELS.LOCATION,
        parentId: facilityContext.zoneId,
        coordinates: { x, y },
        dimensions: facilityContext.dimensions
      }).locationCode;
    }
  }

  // Fallback to legacy system for backward compatibility
  return generateLegacyLocationCode(componentType, existingItems, x, y);
};

// Legacy location code generation for backward compatibility
export const generateLegacyLocationCode = (componentType, existingItems, x, y) => {
  let zonePrefix = 'A'; // Default to storage
  
  // Determine zone prefix based on component type
  switch (componentType) {
    case COMPONENT_TYPES.PRODUCTION_UNIT:
    case COMPONENT_TYPES.WORKSTATION:
      zonePrefix = 'P';
      break;
    case COMPONENT_TYPES.RECEIVING_DOCK:
      zonePrefix = 'R';
      break;
    case COMPONENT_TYPES.DISPATCH_AREA:
      zonePrefix = 'D';
      break;
    case COMPONENT_TYPES.OFFICE:
      zonePrefix = 'O';
      break;
    case COMPONENT_TYPES.STORAGE_AREA:
    case COMPONENT_TYPES.RACK:
    case COMPONENT_TYPES.PALLET:
    case COMPONENT_TYPES.SKU_SMALL:
    case COMPONENT_TYPES.SKU_MEDIUM:
    case COMPONENT_TYPES.SKU_LARGE:
    case COMPONENT_TYPES.SHELF:
    case COMPONENT_TYPES.STORAGE_ZONE:
      // Use position-based zone assignment for storage
      zonePrefix = getStorageZone(x, y);
      break;
    case COMPONENT_TYPES.WAREHOUSE_BLOCK:
      zonePrefix = 'W'; // Warehouse block
      break;
    case COMPONENT_TYPES.PROCESSING_AREA:
      zonePrefix = 'P'; // Processing
      break;
    case COMPONENT_TYPES.CONTAINER_UNIT:
      zonePrefix = 'C'; // Container
      break;
    default:
      zonePrefix = 'S'; // Special/misc
  }
  
  // Find next available number in the zone
  const existingCodes = existingItems
    .filter(item => item.locationCode && item.locationCode.startsWith(zonePrefix))
    .map(item => item.locationCode);
  
  let number = 1;
  let locationCode = `${zonePrefix}${number}`;
  
  while (existingCodes.includes(locationCode)) {
    number++;
    locationCode = `${zonePrefix}${number}`;
  }
  
  return locationCode;
};

// Map component types to facility types
const mapComponentToFacilityType = (componentType) => {
  const mapping = {
    [COMPONENT_TYPES.STORAGE_AREA]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.RACK]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.PALLET]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.SKU_SMALL]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.SKU_MEDIUM]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.SKU_LARGE]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.SHELF]: FACILITY_TYPES.STORAGE,
    [COMPONENT_TYPES.PRODUCTION_UNIT]: FACILITY_TYPES.PRODUCTION,
    [COMPONENT_TYPES.WORKSTATION]: FACILITY_TYPES.PRODUCTION,
    [COMPONENT_TYPES.RECEIVING_DOCK]: FACILITY_TYPES.RECEIVING,
    [COMPONENT_TYPES.DISPATCH_AREA]: FACILITY_TYPES.SHIPPING,
    [COMPONENT_TYPES.OFFICE]: FACILITY_TYPES.OFFICE_SPACE
  };
  
  return mapping[componentType] || FACILITY_TYPES.STORAGE;
};

// Determine storage zone based on position
const getStorageZone = (x, y) => {
  const zones = LOCATION_ZONES.STORAGE;
  
  // Simple grid-based zone assignment
  const gridX = Math.floor(x / 200); // 200px per zone
  const gridY = Math.floor(y / 150); // 150px per zone
  
  const zoneIndex = (gridY * 4 + gridX) % zones.length;
  return zones[zoneIndex];
};

// Validate location code format (supports both legacy and hierarchical formats)
export const validateLocationCode = (code) => {
  // Legacy format: A1, P2, etc.
  const legacyPattern = /^[A-Z]\d+$/;
  // Hierarchical format: WH-01-F01-SA-001
  const hierarchicalPattern = /^[A-Z]{2,3}-\d{2}(-[A-Z0-9]+)*$/;
  
  return legacyPattern.test(code) || hierarchicalPattern.test(code);
};

// Enhanced location code parsing for hierarchical codes
export const parseHierarchicalLocationCode = (code) => {
  if (!validateLocationCode(code)) return null;
  
  // Check if it's a hierarchical code
  if (code.includes('-')) {
    const parts = code.split('-');
    return {
      buildingCode: parts[0] + '-' + parts[1],
      floorCode: parts[2] || null,
      zoneCode: parts[3] || null,
      locationCode: parts[4] || null,
      fullPath: parts,
      isHierarchical: true
    };
  }
  
  // Legacy format
  const zone = code.charAt(0);
  const number = parseInt(code.slice(1));
  
  return { 
    zone, 
    number, 
    isHierarchical: false 
  };
};

// Parse location code to get zone and number
export const parseLocationCode = (code) => {
  if (!validateLocationCode(code)) return null;
  
  const zone = code.charAt(0);
  const number = parseInt(code.slice(1));
  
  return { zone, number };
};

// Get zone description
export const getZoneDescription = (zone) => {
  const zoneMap = {
    A: 'Storage Zone A', B: 'Storage Zone B', C: 'Storage Zone C', D: 'Storage Zone D',
    E: 'Storage Zone E', F: 'Storage Zone F', G: 'Storage Zone G', H: 'Storage Zone H',
    P: 'Production Area', M: 'Manufacturing Area',
    R: 'Receiving Area', D: 'Dispatch Area',
    O: 'Office Area', L: 'L-Shaped Area', S: 'Special Area', T: 'Temporary Area'
  };
  
  return zoneMap[zone] || 'Unknown Zone';
};

// Generate mock inventory data for demonstration
export const generateMockInventoryData = (locationCode, componentType) => {
  // Skip inventory data for structural elements
  if (STRUCTURAL_ELEMENTS.includes(componentType) || !locationCode) {
    return null;
  }

  const skuCatalog = [
    {
      skuInstanceId: 'SKU-001',
      parentResource: 'Pallets',
      skuName: 'Oak Wood Panel',
      skuBrand: 'Premium Woods Co.',
      skuCode: 'OWP-001'
    },
    {
      skuInstanceId: 'SKU-002',
      parentResource: 'Packaging Material',
      skuName: 'Steel Brackets',
      skuBrand: 'MetalWorks Inc.',
      skuCode: 'SB-002'
    },
    {
      skuInstanceId: 'SKU-003',
      parentResource: 'Cold Storage',
      skuName: 'Frozen Peas',
      skuBrand: 'Fresh Harvest',
      skuCode: 'FH-003'
    },
    {
      skuInstanceId: 'SKU-004',
      parentResource: 'Chemicals',
      skuName: 'Industrial Solvent',
      skuBrand: 'ChemCo Labs',
      skuCode: 'ICS-004'
    },
    {
      skuInstanceId: 'SKU-005',
      parentResource: 'Consumables',
      skuName: 'Nitrile Gloves',
      skuBrand: 'SafeHands',
      skuCode: 'NG-005'
    },
    {
      skuInstanceId: 'SKU-006',
      parentResource: 'Finished Goods',
      skuName: 'Smart Hub Device',
      skuBrand: 'ConnectIQ',
      skuCode: 'CIQ-006'
    },
    {
      skuInstanceId: 'SKU-007',
      parentResource: 'Bulk Material',
      skuName: 'Recycled Cardboard',
      skuBrand: 'EcoPack',
      skuCode: 'ECP-007'
    },
    {
      skuInstanceId: 'SKU-008',
      parentResource: 'Spare Parts',
      skuName: 'Servo Motor',
      skuBrand: 'MotionWorks',
      skuCode: 'MW-008'
    },
    {
      skuInstanceId: 'PROD-A1',
      parentResource: 'Production Line A',
      skuName: 'Aluminium Casing',
      skuBrand: 'Precision Metals',
      skuCode: 'PM-A1'
    },
    {
      skuInstanceId: 'MAT-X1',
      parentResource: 'Raw Materials',
      skuName: 'Polymer Resin',
      skuBrand: 'PolyChem',
      skuCode: 'PC-X1'
    }
  ];

  const shuffledCatalog = [...skuCatalog].sort(() => 0.5 - Math.random());
  const skuCount = Math.max(1, Math.min(4, Math.floor(Math.random() * 4) + 1));
  const selectedSkus = shuffledCatalog.slice(0, skuCount);

  const randomDateWithinMonths = (monthsBack = 6) => {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - monthsBack);
    const timestamp = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(timestamp).toISOString();
  };
  
  return {
    locationCode,
    inventory: selectedSkus.map((entry) => {
      const availableQuantity = Math.floor(Math.random() * 180) + 20;
      const reservedQuantity = Math.floor(Math.random() * Math.min(availableQuantity, 30));
      const procuredDate = randomDateWithinMonths(12);

      return {
        sku: entry.skuInstanceId,
        skuInstanceId: entry.skuInstanceId,
        parentResource: entry.parentResource,
        skuName: entry.skuName,
        skuBrand: entry.skuBrand,
        skuCode: entry.skuCode,
        location: locationCode,
        procuredDate,
        quantity: availableQuantity,
        availableQuantity,
        reserved: reservedQuantity,
        lastUpdated: randomDateWithinMonths(1)
      };
    }),
    capacity: Math.floor(Math.random() * 200) + 50,
    utilization: Math.random(),
    lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    temperature: componentType === COMPONENT_TYPES.STORAGE_AREA ? Math.floor(Math.random() * 30) + 15 : null,
    humidity: componentType === COMPONENT_TYPES.STORAGE_AREA ? Math.floor(Math.random() * 40) + 40 : null
  };
};
