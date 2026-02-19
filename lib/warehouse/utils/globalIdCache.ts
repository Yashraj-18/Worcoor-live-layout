// @ts-nocheck
/**
 * Global ID Cache for Warehouse Layout Builder
 * 
 * This module provides a centralized cache for tracking all location IDs
 * used across the entire warehouse map to ensure uniqueness.
 * 
 * The cache is initialized when entering the layout builder or editing mode,
 * and is cleared when the layout is saved.
 */

import { normalizeLocationId } from './locationId';

interface LevelLocationMapping {
  locationId?: string;
  locId?: string;
}

interface CompartmentContent {
  locationId?: string;
  uniqueId?: string;
  primaryLocationId?: string;
  locationIds?: string[];
  levelLocationMappings?: LevelLocationMapping[];
}

interface LayoutItem {
  locationId?: string;
  locationCode?: string;
  locationTag?: string;
  primaryLocationId?: string;
  locationData?: {
    location_id?: string;
  };
  properties?: {
    locationId?: string;
  };
  data?: {
    locationId?: string;
  };
  locationIds?: string[];
  levelLocationMappings?: LevelLocationMapping[];
  compartmentContents?: Record<string, CompartmentContent>;
}

class GlobalIdCache {
  private cache: Set<string>;
  private initialized: boolean;

  constructor() {
    this.cache = new Set();
    this.initialized = false;
  }

  /**
   * Initialize the cache with all existing IDs from layout items
   * @param items - Array of layout items
   */
  initialize(items: LayoutItem[]): void {
    this.cache.clear();
    this.initialized = true;

    if (!Array.isArray(items)) {
      console.warn('GlobalIdCache: items is not an array');
      return;
    }

    items.forEach(item => {
      this._extractIdsFromItem(item);
    });

    console.log(`GlobalIdCache initialized with ${this.cache.size} unique IDs`);
  }

  /**
   * Extract all location IDs from an item and add to cache
   * @private
   */
  private _extractIdsFromItem(item: LayoutItem): void {
    if (!item) return;

    // Extract single location IDs
    const singleIds = [
      item.locationId,
      item.locationCode,
      item.locationTag,
      item.primaryLocationId,
      item.locationData?.location_id,
      item.properties?.locationId,
      item.data?.locationId
    ];

    singleIds.forEach(id => {
      if (id) {
        this._addToCache(id);
      }
    });

    // Extract from arrays
    if (Array.isArray(item.locationIds)) {
      item.locationIds.forEach(id => this._addToCache(id));
    }

    // Extract from level-location mappings
    if (Array.isArray(item.levelLocationMappings)) {
      item.levelLocationMappings.forEach(mapping => {
        const id = mapping?.locationId || mapping?.locId;
        if (id) {
          this._addToCache(id);
        }
      });
    }

    // Extract from compartment contents (SKU holders)
    if (item.compartmentContents && typeof item.compartmentContents === 'object') {
      Object.values(item.compartmentContents).forEach(content => {
        if (!content) return;

        // Extract single IDs from compartment
        const compartmentIds = [
          content.locationId,
          content.uniqueId,
          content.primaryLocationId
        ];

        compartmentIds.forEach(id => {
          if (id) {
            this._addToCache(id);
          }
        });

        // Extract from compartment arrays
        if (Array.isArray(content.locationIds)) {
          content.locationIds.forEach(id => this._addToCache(id));
        }

        // Extract from compartment level-location mappings
        if (Array.isArray(content.levelLocationMappings)) {
          content.levelLocationMappings.forEach(mapping => {
            const id = mapping?.locationId || mapping?.locId;
            if (id) {
              this._addToCache(id);
            }
          });
        }
      });
    }
  }

  /**
   * Add an ID to the cache (normalized)
   * @private
   */
  private _addToCache(id: string): void {
    if (!id) return;
    const normalized = normalizeLocationId(id);
    if (normalized) {
      this.cache.add(normalized);
    }
  }

  /**
   * Check if an ID is already in use
   * @param id - The ID to check
   * @returns True if ID is in use
   */
  isIdInUse(id: string): boolean {
    if (!id) return false;
    const normalized = normalizeLocationId(id);
    return this.cache.has(normalized);
  }

  /**
   * Add an ID to the cache (when creating new items)
   * @param id - The ID to add
   */
  addId(id: string): void {
    if (!this.initialized) {
      console.warn('GlobalIdCache: Attempting to add ID before initialization');
    }
    this._addToCache(id);
  }

  /**
   * Remove an ID from the cache (when deleting items or updating IDs)
   * @param id - The ID to remove
   */
  removeId(id: string): void {
    if (!id) return;
    const normalized = normalizeLocationId(id);
    this.cache.delete(normalized);
  }

  /**
   * Update an ID in the cache (when changing an existing ID)
   * @param oldId - The old ID to remove
   * @param newId - The new ID to add
   * @returns True if update was successful, false if new ID already exists
   */
  updateId(oldId: string, newId: string): boolean {
    if (!newId) return false;
    
    const normalizedNew = normalizeLocationId(newId);
    
    // Check if new ID is already in use (and it's not the same as old ID)
    if (oldId) {
      const normalizedOld = normalizeLocationId(oldId);
      if (normalizedNew === normalizedOld) {
        return true; // Same ID, no change needed
      }
    }
    
    if (this.cache.has(normalizedNew)) {
      return false; // New ID already in use
    }
    
    // Remove old ID and add new ID
    if (oldId) {
      this.removeId(oldId);
    }
    this.addId(newId);
    
    return true;
  }

  /**
   * Clear the cache (called when saving the layout)
   */
  clear(): void {
    this.cache.clear();
    this.initialized = false;
    console.log('GlobalIdCache cleared');
  }

  /**
   * Get the current cache size
   * @returns Cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if cache is initialized
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get all IDs in the cache (for debugging)
   * @returns Array of all cached IDs
   */
  getAllIds(): string[] {
    return Array.from(this.cache);
  }
}

// Create a singleton instance
const globalIdCache = new GlobalIdCache();

export default globalIdCache;
