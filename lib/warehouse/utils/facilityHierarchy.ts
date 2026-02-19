// @ts-nocheck
/**
 * Facility Hierarchy Management System
 * Supports multi-level organizational structures: Organization → Building → Floor → Zone → Location
 */

export const FACILITY_LEVELS = {
  ORGANIZATION: 'organization',
  BUILDING: 'building', 
  FLOOR: 'floor',
  ZONE: 'zone',
  LOCATION: 'location'
};

export const FACILITY_TYPES = {
  // Building Types
  WAREHOUSE: 'warehouse',
  MANUFACTURING: 'manufacturing',
  OFFICE: 'office',
  DISTRIBUTION_CENTER: 'distribution_center',
  MIXED_USE: 'mixed_use',
  
  // Zone Types
  STORAGE: 'storage',
  PRODUCTION: 'production',
  SHIPPING: 'shipping',
  RECEIVING: 'receiving',
  OFFICE_SPACE: 'office_space',
  UTILITIES: 'utilities',
  SAFETY: 'safety',
  TRAFFIC: 'traffic'
};

export class FacilityHierarchy {
  constructor() {
    this.facilities = new Map();
    this.hierarchy = new Map();
    this.locationCodes = new Set();
  }

  /**
   * Create a new facility node
   */
  createFacility(config) {
    const {
      id = this.generateId(),
      name,
      type,
      level,
      parentId = null,
      properties = {},
      coordinates = null,
      dimensions = null
    } = config;

    const facility = {
      id,
      name,
      type,
      level,
      parentId,
      properties: {
        ...properties,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      coordinates,
      dimensions,
      children: new Set(),
      locationCode: this.generateLocationCode(level, type, parentId)
    };

    this.facilities.set(id, facility);
    
    // Update hierarchy
    if (parentId) {
      const parent = this.facilities.get(parentId);
      if (parent) {
        parent.children.add(id);
      }
    }

    return facility;
  }

  /**
   * Generate hierarchical location code (e.g., WH-01-A-001)
   */
  generateLocationCode(level, type, parentId) {
    let code = '';
    
    switch (level) {
      case FACILITY_LEVELS.BUILDING:
        code = this.generateBuildingCode(type);
        break;
      case FACILITY_LEVELS.FLOOR:
        code = this.generateFloorCode(parentId);
        break;
      case FACILITY_LEVELS.ZONE:
        code = this.generateZoneCode(parentId, type);
        break;
      case FACILITY_LEVELS.LOCATION:
        code = this.generateLocationCodeForItem(parentId);
        break;
      default:
        code = this.generateGenericCode();
    }

    // Ensure uniqueness
    let counter = 1;
    let finalCode = code;
    while (this.locationCodes.has(finalCode)) {
      finalCode = `${code}-${counter.toString().padStart(2, '0')}`;
      counter++;
    }

    this.locationCodes.add(finalCode);
    return finalCode;
  }

  generateBuildingCode(type) {
    const typePrefix = {
      [FACILITY_TYPES.WAREHOUSE]: 'WH',
      [FACILITY_TYPES.MANUFACTURING]: 'MF',
      [FACILITY_TYPES.OFFICE]: 'OF',
      [FACILITY_TYPES.DISTRIBUTION_CENTER]: 'DC',
      [FACILITY_TYPES.MIXED_USE]: 'MX'
    };

    const prefix = typePrefix[type] || 'BL';
    const buildingNumber = this.getNextSequenceNumber(prefix);
    return `${prefix}-${buildingNumber.toString().padStart(2, '0')}`;
  }

  generateFloorCode(parentId) {
    const parent = this.facilities.get(parentId);
    if (!parent) return 'F-01';
    
    const floorNumber = parent.children.size + 1;
    return `${parent.locationCode}-F${floorNumber.toString().padStart(2, '0')}`;
  }

  generateZoneCode(parentId, type) {
    const parent = this.facilities.get(parentId);
    if (!parent) return 'Z-A';

    const zonePrefix = {
      [FACILITY_TYPES.STORAGE]: 'S',
      [FACILITY_TYPES.PRODUCTION]: 'P',
      [FACILITY_TYPES.SHIPPING]: 'SH',
      [FACILITY_TYPES.RECEIVING]: 'R',
      [FACILITY_TYPES.OFFICE_SPACE]: 'O',
      [FACILITY_TYPES.UTILITIES]: 'U',
      [FACILITY_TYPES.SAFETY]: 'SF',
      [FACILITY_TYPES.TRAFFIC]: 'T'
    };

    const prefix = zonePrefix[type] || 'Z';
    const zoneNumber = this.getZoneSequence(parent.id, prefix);
    return `${parent.locationCode}-${prefix}${zoneNumber}`;
  }

  generateLocationCodeForItem(parentId) {
    const parent = this.facilities.get(parentId);
    if (!parent) return 'L-001';

    const locationNumber = parent.children.size + 1;
    return `${parent.locationCode}-${locationNumber.toString().padStart(3, '0')}`;
  }

  getNextSequenceNumber(prefix) {
    const existing = Array.from(this.locationCodes)
      .filter(code => code.startsWith(prefix))
      .map(code => {
        const match = code.match(new RegExp(`${prefix}-(\\d+)`));
        return match ? parseInt(match[1]) : 0;
      });
    
    return existing.length > 0 ? Math.max(...existing) + 1 : 1;
  }

  getZoneSequence(parentId, prefix) {
    const parent = this.facilities.get(parentId);
    if (!parent) return 'A';

    const existingZones = Array.from(parent.children)
      .map(childId => this.facilities.get(childId))
      .filter(child => child && child.level === FACILITY_LEVELS.ZONE)
      .filter(zone => zone.locationCode.includes(`-${prefix}`))
      .length;

    return String.fromCharCode(65 + existingZones); // A, B, C, etc.
  }

  generateGenericCode() {
    return `GEN-${Date.now().toString().slice(-6)}`;
  }

  generateId() {
    return `facility_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get facility by ID
   */
  getFacility(id) {
    return this.facilities.get(id);
  }

  /**
   * Get all children of a facility
   */
  getChildren(parentId) {
    const parent = this.facilities.get(parentId);
    if (!parent) return [];

    return Array.from(parent.children)
      .map(childId => this.facilities.get(childId))
      .filter(Boolean);
  }

  /**
   * Get full hierarchy path for a facility
   */
  getHierarchyPath(facilityId) {
    const path = [];
    let current = this.facilities.get(facilityId);

    while (current) {
      path.unshift(current);
      current = current.parentId ? this.facilities.get(current.parentId) : null;
    }

    return path;
  }

  /**
   * Get all facilities of a specific level
   */
  getFacilitiesByLevel(level) {
    return Array.from(this.facilities.values())
      .filter(facility => facility.level === level);
  }

  /**
   * Get all facilities of a specific type
   */
  getFacilitiesByType(type) {
    return Array.from(this.facilities.values())
      .filter(facility => facility.type === type);
  }

  /**
   * Update facility properties
   */
  updateFacility(id, updates) {
    const facility = this.facilities.get(id);
    if (!facility) return null;

    const updated = {
      ...facility,
      ...updates,
      properties: {
        ...facility.properties,
        ...updates.properties,
        updatedAt: new Date().toISOString()
      }
    };

    this.facilities.set(id, updated);
    return updated;
  }

  /**
   * Delete facility and all its children
   */
  deleteFacility(id) {
    const facility = this.facilities.get(id);
    if (!facility) return false;

    // Delete all children recursively
    Array.from(facility.children).forEach(childId => {
      this.deleteFacility(childId);
    });

    // Remove from parent's children
    if (facility.parentId) {
      const parent = this.facilities.get(facility.parentId);
      if (parent) {
        parent.children.delete(id);
      }
    }

    // Remove location code from set
    this.locationCodes.delete(facility.locationCode);

    // Delete the facility
    this.facilities.delete(id);
    return true;
  }

  /**
   * Search facilities by name or location code
   */
  searchFacilities(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.facilities.values())
      .filter(facility => 
        facility.name.toLowerCase().includes(lowerQuery) ||
        facility.locationCode.toLowerCase().includes(lowerQuery)
      );
  }

  /**
   * Get facility statistics
   */
  getStatistics() {
    const facilities = Array.from(this.facilities.values());
    
    return {
      total: facilities.length,
      byLevel: Object.values(FACILITY_LEVELS).reduce((acc, level) => {
        acc[level] = facilities.filter(f => f.level === level).length;
        return acc;
      }, {}),
      byType: Object.values(FACILITY_TYPES).reduce((acc, type) => {
        acc[type] = facilities.filter(f => f.type === type).length;
        return acc;
      }, {})
    };
  }

  /**
   * Export facility data
   */
  exportData() {
    return {
      facilities: Array.from(this.facilities.entries()),
      locationCodes: Array.from(this.locationCodes),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import facility data
   */
  importData(data) {
    this.facilities.clear();
    this.locationCodes.clear();

    if (data.facilities) {
      data.facilities.forEach(([id, facility]) => {
        this.facilities.set(id, {
          ...facility,
          children: new Set(facility.children)
        });
      });
    }

    if (data.locationCodes) {
      data.locationCodes.forEach(code => {
        this.locationCodes.add(code);
      });
    }
  }
}

// Default facility hierarchy instance
export const facilityHierarchy = new FacilityHierarchy();

// Helper functions for common operations
export const createBuilding = (name, type, properties = {}) => {
  return facilityHierarchy.createFacility({
    name,
    type,
    level: FACILITY_LEVELS.BUILDING,
    properties
  });
};

export const createFloor = (name, buildingId, properties = {}) => {
  return facilityHierarchy.createFacility({
    name,
    type: FACILITY_TYPES.MIXED_USE,
    level: FACILITY_LEVELS.FLOOR,
    parentId: buildingId,
    properties
  });
};

export const createZone = (name, type, floorId, properties = {}) => {
  return facilityHierarchy.createFacility({
    name,
    type,
    level: FACILITY_LEVELS.ZONE,
    parentId: floorId,
    properties
  });
};

export const createLocation = (name, zoneId, coordinates, dimensions, properties = {}) => {
  return facilityHierarchy.createFacility({
    name,
    type: FACILITY_TYPES.STORAGE,
    level: FACILITY_LEVELS.LOCATION,
    parentId: zoneId,
    coordinates,
    dimensions,
    properties
  });
};
