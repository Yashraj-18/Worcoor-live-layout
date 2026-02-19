// @ts-nocheck
import locationData from '@/lib/warehouse/data/layoutComponentsMock.json';

/**
 * Location data interface
 */
interface LocationData {
  location_id: string;
  sku_name?: string;
  sku_code?: string;
  sku_brand_vendor?: string;
  parent_resource?: string;
  available_quantity?: number;
  [key: string]: any;
}

/**
 * Summary statistics interface
 */
interface SummaryStats {
  totalLocations: number;
  totalSKUs: number;
  totalQuantity: number;
  byResource: Record<string, number>;
  byCategory: Record<string, number>;
}

/**
 * Location data JSON structure
 */
interface LocationDataJSON {
  locations?: LocationData[];
}

/**
 * Service for fetching location and SKU data from layoutComponentsMock.json
 */
class LocationDataService {
  private data: LocationData[];
  private dataMap: Map<string, LocationData>;
  private dataMapLowerCase: Map<string, LocationData>;

  constructor() {
    const jsonData = locationData as LocationDataJSON;
    this.data = jsonData.locations || [];
    this.dataMap = new Map();
    this.dataMapLowerCase = new Map();
    
    // Create maps for quick lookup by location_id (both exact and case-insensitive)
    this.data.forEach(location => {
      if (location.location_id) {
        this.dataMap.set(location.location_id, location);
        this.dataMapLowerCase.set(location.location_id.toLowerCase(), location);
      }
    });
  }

  /**
   * Get location data by location ID (case-insensitive)
   * @param locationId - The location ID (e.g., "Loc-001", "LOC-001", "loc-001")
   * @returns Location data or null if not found
   */
  getLocationById(locationId: string): LocationData | null {
    if (!locationId) return null;
    
    // First try exact match
    let location = this.dataMap.get(locationId);
    
    // If not found, try case-insensitive match
    if (!location) {
      location = this.dataMapLowerCase.get(locationId.toLowerCase());
    }
    
    return location || null;
  }

  /**
   * Get multiple locations by their IDs
   * @param locationIds - Array of location IDs
   * @returns Array of location data objects
   */
  getLocationsByIds(locationIds: string[]): LocationData[] {
    if (!Array.isArray(locationIds)) return [];
    
    return locationIds
      .map(id => this.getLocationById(id))
      .filter((location): location is LocationData => location !== null);
  }

  /**
   * Search locations by SKU name, code, or vendor
   * @param query - Search query
   * @returns Array of matching location data
   */
  searchLocations(query: string): LocationData[] {
    if (!query) return [];
    
    const queryLower = query.toLowerCase();
    
    return this.data.filter(location => 
      (location.sku_name && location.sku_name.toLowerCase().includes(queryLower)) ||
      (location.sku_code && location.sku_code.toLowerCase().includes(queryLower)) ||
      (location.sku_brand_vendor && location.sku_brand_vendor.toLowerCase().includes(queryLower)) ||
      (location.location_id && location.location_id.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Get all locations
   * @returns All location data
   */
  getAllLocations(): LocationData[] {
    return [...this.data];
  }

  /**
   * Get locations by parent resource type
   * @param resourceType - Parent resource (e.g., "Pallets", "Shelving")
   * @returns Array of matching locations
   */
  getLocationsByResource(resourceType: string): LocationData[] {
    if (!resourceType) return [];
    
    const resourceTypeLower = resourceType.toLowerCase();
    return this.data.filter(location => 
      location.parent_resource && 
      location.parent_resource.toLowerCase() === resourceTypeLower
    );
  }

  /**
   * Get summary statistics
   * @returns Summary statistics
   */
  getSummaryStats(): SummaryStats {
    const stats: SummaryStats = {
      totalLocations: this.data.length,
      totalSKUs: 0,
      totalQuantity: 0,
      byResource: {},
      byCategory: {}
    };

    const skuSet = new Set<string>();
    
    this.data.forEach(location => {
      // Count unique SKUs
      if (location.sku_code) {
        skuSet.add(location.sku_code);
      }
      
      // Sum quantities
      if (typeof location.available_quantity === 'number') {
        stats.totalQuantity += location.available_quantity;
      }
      
      // Count by resource
      if (location.parent_resource) {
        stats.byResource[location.parent_resource] = 
          (stats.byResource[location.parent_resource] || 0) + 1;
      }
      
      // Count by category (if available)
      const category = location.sku_brand_vendor || 'Uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    stats.totalSKUs = skuSet.size;
    
    return stats;
  }
}

// Export singleton instance
const locationDataService = new LocationDataService();

// Log initialization for debugging
if (typeof window !== 'undefined') {
  console.log('LocationDataService initialized with', locationDataService.getAllLocations().length, 'locations');
}

export default locationDataService;
