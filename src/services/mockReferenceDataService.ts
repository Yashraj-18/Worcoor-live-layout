// Mock Reference Data Service for dropdown options
interface ReferenceDataItem {
  id: string;
  detail: {
    name: string;
    typeId?: string;
  };
}

interface ReferenceDataResponse {
  data: ReferenceDataItem[];
}

// Mock data for dropdown options
const mockUnits: ReferenceDataItem[] = [
  { id: "unit-001", detail: { name: "Warehouse A" } },
  { id: "unit-002", detail: { name: "Warehouse B" } },
  { id: "unit-003", detail: { name: "Production Unit" } },
  { id: "unit-004", detail: { name: "Office Building" } },
];

const mockDepartments: ReferenceDataItem[] = [
  { id: "dept-001", detail: { name: "Operations" } },
  { id: "dept-002", detail: { name: "Maintenance" } },
  { id: "dept-003", detail: { name: "Quality Control" } },
  { id: "dept-004", detail: { name: "Logistics" } },
];

const mockCategories: ReferenceDataItem[] = [
  { id: "cat-001", detail: { name: "Forklift" } },
  { id: "cat-002", detail: { name: "Pallet Jack" } },
  { id: "cat-003", detail: { name: "Scanner" } },
  { id: "cat-004", detail: { name: "Hand Truck" } },
];

const mockLocationTags: ReferenceDataItem[] = [
  { id: "loc-001", detail: { name: "Zone A-1" } },
  { id: "loc-002", detail: { name: "Zone A-2" } },
  { id: "loc-003", detail: { name: "Zone B-1" } },
  { id: "loc-004", detail: { name: "Zone B-2" } },
];

const mockStatuses: ReferenceDataItem[] = [
  { id: "status-001", detail: { name: "Active" } },
  { id: "status-002", detail: { name: "Under Maintenance" } },
  { id: "status-003", detail: { name: "Decommissioned" } },
  { id: "status-004", detail: { name: "In Storage" } },
];

const mockParentResources: ReferenceDataItem[] = [
  { id: "parent-001", detail: { name: "Main Warehouse", typeId: "6863f3d65f3b843029c7941e" } },
  { id: "parent-002", detail: { name: "Secondary Warehouse", typeId: "6863f3d65f3b843029c7941e" } },
  { id: "parent-003", detail: { name: "Distribution Center", typeId: "6863f3d65f3b843029c7941e" } },
];

// Mock API responses based on table ID
const getMockDataByTableId = (tableId: string): ReferenceDataResponse => {
  switch (tableId) {
    case "68565c5df70897486c46852e": // Units
      return { data: mockUnits };
    case "68565ce0f70897486c46852f": // Departments
      return { data: mockDepartments };
    case "68565ef7f70897486c468540": // Categories
      return { data: mockCategories };
    case "68565e75f70897486c46853b": // Location Tags
      return { data: mockLocationTags };
    case "68565f14f70897486c468541": // Statuses
      return { data: mockStatuses };
    case "68565df7f70897486c468538": // Parent Resources
      return { data: mockParentResources };
    default:
      return { data: [] };
  }
};

export const mockReferenceDataService = {
  getTableEntry: async (tableId: string): Promise<ReferenceDataResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockData = getMockDataByTableId(tableId);
    return mockData;
  }
};
