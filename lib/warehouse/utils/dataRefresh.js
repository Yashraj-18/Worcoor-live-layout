// Simulate real-time data updates
export const simulateDataRefresh = (items) => {
  return items.map(item => {
    if (!item.inventoryData) return item;

    // Randomly update some items (10% chance per refresh)
    if (Math.random() < 0.1) {
      const updatedInventoryData = { ...item.inventoryData };
      
      // Update utilization slightly
      const utilizationChange = (Math.random() - 0.5) * 0.1; // ±5% change
      updatedInventoryData.utilization = Math.max(0, Math.min(1, 
        updatedInventoryData.utilization + utilizationChange
      ));
      
      // Update occupancy status based on utilization (simplified)
      let newStatus = item.occupancyStatus;
      if (updatedInventoryData.utilization < 0.1) {
        newStatus = 'empty';
      } else if (updatedInventoryData.utilization < 0.7) {
        newStatus = 'partial';
      } else if (updatedInventoryData.utilization >= 0.9) {
        newStatus = 'full';
      }
      
      // Occasionally set maintenance status (1% chance)
      if (Math.random() < 0.01) {
        newStatus = 'maintenance';
      }
      
      // Update last activity for active changes
      if (utilizationChange !== 0) {
        updatedInventoryData.lastActivity = new Date().toISOString();
      }
      
      // Randomly update inventory quantities
      if (updatedInventoryData.inventory) {
        updatedInventoryData.inventory = updatedInventoryData.inventory.map(inv => ({
          ...inv,
          quantity: Math.max(0, inv.quantity + Math.floor((Math.random() - 0.5) * 10)),
          reserved: Math.max(0, inv.reserved + Math.floor((Math.random() - 0.5) * 5))
        }));
      }
      
      return {
        ...item,
        inventoryData: updatedInventoryData,
        occupancyStatus: newStatus
      };
    }
    
    return item;
  });
};

// Cache management
export class DataCache {
  constructor(refreshInterval = 30000) { // 30 seconds default
    this.cache = new Map();
    this.refreshInterval = refreshInterval;
    this.lastRefresh = Date.now();
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.refreshInterval) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  shouldRefresh() {
    return Date.now() - this.lastRefresh > this.refreshInterval;
  }
  
  markRefreshed() {
    this.lastRefresh = Date.now();
  }
}

// Performance metrics calculation
export const calculatePerformanceMetrics = (items) => {
  const metrics = {
    totalLocations: items.length,
    activeLocations: 0,
    utilizationRate: 0,
    fulfillmentRate: 0,
    spaceEfficiency: 0,
    lastUpdated: new Date().toISOString()
  };
  
  if (items.length === 0) return metrics;
  
  let totalUtilization = 0;
  let totalCapacity = 0;
  let totalUsed = 0;
  let activeCount = 0;
  
  items.forEach(item => {
    if (item.inventoryData) {
      const { utilization = 0, capacity = 0 } = item.inventoryData;
      totalUtilization += utilization;
      totalCapacity += capacity;
      totalUsed += capacity * utilization;
      
      if (utilization > 0.1) activeCount++;
    }
  });
  
  metrics.activeLocations = activeCount;
  metrics.utilizationRate = totalUtilization / items.length;
  metrics.fulfillmentRate = totalCapacity > 0 ? totalUsed / totalCapacity : 0;
  metrics.spaceEfficiency = metrics.utilizationRate * 0.8 + (activeCount / items.length) * 0.2;
  
  return metrics;
};

// Generate activity log
export const generateActivityLog = (items, limit = 10) => {
  const activities = [];
  
  items.forEach(item => {
    if (item.inventoryData?.lastActivity) {
      const activityTime = new Date(item.inventoryData.lastActivity);
      const now = new Date();
      const hoursSince = (now - activityTime) / (1000 * 60 * 60);
      
      if (hoursSince < 24) { // Only activities from last 24 hours
        activities.push({
          id: item.id,
          locationCode: item.locationCode,
          name: item.name,
          activity: 'Inventory Updated',
          timestamp: item.inventoryData.lastActivity,
          utilization: item.inventoryData.utilization
        });
      }
    }
  });
  
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};
