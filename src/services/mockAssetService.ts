// Mock Asset Service for asset management operations
interface Asset {
  id: string;
  asset_id?: string;
  asset_name: string;
  asset_type: "forklift" | "pallet_jack" | "scanner";
  location_tag_id?: string;
  departmentId?: string;
  unitId?: string;
  categoryId?: string;
  statusId?: string;
  name?: string;
  type?: string;
  locationId?: string;
  instanceName?: string;
  // Dimensions for volume calculation
  length?: number;
  breadth?: number;
  height?: number;
  volume?: number;
  unit_of_measurement?: "meters" | "feet" | "inches" | "centimeters";
}

interface AssetListResponse {
  data: {
    status: string;
    data?: {
      list: Asset[];
      total: number;
    };
    message?: string;
  };
}

interface AssetResponse {
  data: {
    status: string;
    message: string;
  };
}

// Mock assets data
const mockAssets: Asset[] = [
  {
    id: "asset-001",
    asset_id: "AST-001",
    asset_name: "Forklift 001",
    asset_type: "forklift",
    location_tag_id: "loc-001",
    departmentId: "dept-001",
    unitId: "unit-001",
    categoryId: "cat-001",
    statusId: "status-001",
    name: "Forklift 001",
    type: "forklift",
    locationId: "loc-001",
    instanceName: "FLT-001",
    length: 2.5,
    breadth: 1.2,
    height: 3.0,
    volume: 9.0, // 2.5 x 1.2 x 3.0
    unit_of_measurement: "meters",
  },
  {
    id: "asset-002",
    asset_name: "Pallet Jack 002",
    asset_type: "pallet_jack",
    location_tag_id: "loc-002",
    departmentId: "dept-002",
    unitId: "unit-001",
    categoryId: "cat-002",
    statusId: "status-001",
    name: "Pallet Jack 002",
    type: "pallet_jack",
    locationId: "loc-002",
    instanceName: "PJ-002",
    length: 1.5,
    breadth: 0.8,
    height: 1.2,
    volume: 1.44, // 1.5 x 0.8 x 1.2
    unit_of_measurement: "meters",
  },
  {
    id: "asset-003",
    asset_name: "Scanner 003",
    asset_type: "scanner",
    location_tag_id: "loc-003",
    departmentId: "dept-003",
    unitId: "unit-002",
    categoryId: "cat-003",
    statusId: "status-002",
    name: "Scanner 003",
    type: "scanner",
    locationId: "loc-003",
    instanceName: "SCN-003",
    length: 0.3,
    breadth: 0.2,
    height: 0.15,
    volume: 0.009, // 0.3 x 0.2 x 0.15
    unit_of_measurement: "meters",
  },
  {
    id: "asset-004",
    asset_name: "Forklift 004",
    asset_type: "forklift",
    location_tag_id: "loc-004",
    departmentId: "dept-001",
    unitId: "unit-002",
    categoryId: "cat-001",
    statusId: "status-001",
    name: "Forklift 004",
    type: "forklift",
    locationId: "loc-004",
    instanceName: "FLT-004",
    length: 3.0,
    breadth: 1.5,
    height: 3.5,
    volume: 15.75, // 3.0 x 1.5 x 3.5
    unit_of_measurement: "meters",
  },
  {
    id: "asset-005",
    asset_name: "Hand Truck 005",
    asset_type: "pallet_jack",
    location_tag_id: "loc-001",
    departmentId: "dept-004",
    unitId: "unit-003",
    categoryId: "cat-004",
    statusId: "status-003",
    name: "Hand Truck 005",
    type: "pallet_jack",
    locationId: "loc-001",
    instanceName: "HT-005",
    length: 1.2,
    breadth: 0.6,
    height: 1.0,
    volume: 0.72, // 1.2 x 0.6 x 1.0
    unit_of_measurement: "meters",
  },
];

export const mockAssetService = {
  // Mock asset list with pagination and filtering
  getAssetList: async (requestData: any): Promise<AssetListResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredAssets = [...mockAssets];
    
    // Apply search filter
    if (requestData.searchText) {
      const searchTerm = requestData.searchText.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        asset.asset_name.toLowerCase().includes(searchTerm) ||
        asset.name?.toLowerCase().includes(searchTerm) ||
        asset.instanceName?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply reference filters
    if (requestData.refFilter) {
      const filters = requestData.refFilter;
      
      if (filters.statusId) {
        filteredAssets = filteredAssets.filter(asset => asset.statusId === filters.statusId);
      }
      if (filters.categoryId) {
        filteredAssets = filteredAssets.filter(asset => asset.categoryId === filters.categoryId);
      }
      if (filters.locationId) {
        filteredAssets = filteredAssets.filter(asset => asset.location_tag_id === filters.locationId);
      }
      if (filters.unitId) {
        filteredAssets = filteredAssets.filter(asset => asset.unitId === filters.unitId);
      }
      if (filters.departmentId) {
        filteredAssets = filteredAssets.filter(asset => asset.departmentId === filters.departmentId);
      }
    }
    
    // Apply pagination
    const page = requestData.page || 0;
    const pageSize = requestData.pageSize || 10;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAssets = filteredAssets.slice(startIndex, endIndex);
    
    return {
      data: {
        status: "OK",
        data: {
          list: paginatedAssets,
          total: filteredAssets.length
        }
      }
    };
  },

  // Mock add asset
  addAsset: async (assetData: any): Promise<AssetResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      ...assetData,
      name: assetData.asset_name,
      type: assetData.asset_type,
      locationId: assetData.location_tag_id,
      instanceName: `${assetData.asset_type.toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    };
    
    mockAssets.push(newAsset);
    
    return {
      data: {
        status: "OK",
        message: "Asset added successfully"
      }
    };
  },

  // Mock update asset
  updateAsset: async (assetData: any): Promise<AssetResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockAssets.findIndex(asset => asset.id === assetData.id);
    if (index !== -1) {
      mockAssets[index] = {
        ...mockAssets[index],
        ...assetData,
        name: assetData.asset_name || assetData.name,
        type: assetData.asset_type || assetData.type,
        locationId: assetData.location_tag_id || assetData.locationId
      };
    }
    
    return {
      data: {
        status: "OK",
        message: "Asset updated successfully"
      }
    };
  },

  // Mock delete asset
  deleteAsset: async (assetId: string): Promise<AssetResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockAssets.findIndex(asset => asset.id === assetId);
    if (index !== -1) {
      mockAssets.splice(index, 1);
    }
    
    return {
      data: {
        status: "OK",
        message: "Asset deleted successfully"
      }
    };
  }
};
