// @ts-nocheck
'use client';

interface WarehouseMapDashboardProps {
  orgUnits?: any[];
  layouts?: any[];
  isLoading?: boolean;
  onMapSelect: (mapId: string) => void;
  onEditLayout?: (layoutId: string) => void;
}

// Mock data - replace with actual warehouse data from your system
const mockWarehouseMaps = [
  { id: 'warehouse-1', name: 'Main Warehouse', capacity: '85%', items: 1245, status: 'operational' },
  { id: 'warehouse-2', name: 'Cold Storage', capacity: '62%', items: 890, status: 'operational' },
  { id: 'warehouse-3', name: 'Hazardous Materials', capacity: '45%', items: 320, status: 'maintenance' },
  { id: 'warehouse-4', name: 'Returns Processing', capacity: '78%', items: 567, status: 'operational' },
  { id: 'warehouse-5', name: 'Overflow Storage', capacity: '23%', items: 145, status: 'offline' },
  { id: 'warehouse-6', name: 'Distribution Hub', capacity: '91%', items: 2134, status: 'operational' }
];

export default function WarehouseMapDashboard({ onMapSelect }: WarehouseMapDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'maintenance': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCapacityColor = (capacity: string) => {
    const percent = parseInt(capacity);
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouse Maps Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your warehouse operations across all facilities</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{mockWarehouseMaps.length}</div>
            <div className="text-gray-600">Total Warehouses</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {mockWarehouseMaps.filter(w => w.status === 'operational').length}
            </div>
            <div className="text-gray-600">Operational</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">
              {mockWarehouseMaps.reduce((sum, w) => sum + w.items, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total Items</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(mockWarehouseMaps.reduce((sum, w) => sum + parseInt(w.capacity), 0) / mockWarehouseMaps.length)}%
            </div>
            <div className="text-gray-600">Avg Capacity</div>
          </div>
        </div>

        {/* Warehouse Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockWarehouseMaps.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onMapSelect(warehouse.id)}
            >
              {/* Card Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">{warehouse.name}</h2>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(warehouse.status)} bg-opacity-10`}>
                    {warehouse.status.charAt(0).toUpperCase() + warehouse.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">ID: {warehouse.id}</p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className={`text-2xl font-bold ${getCapacityColor(warehouse.capacity)}`}>
                      {warehouse.capacity}
                    </div>
                    <div className="text-gray-600 text-sm">Capacity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {warehouse.items.toLocaleString()}
                    </div>
                    <div className="text-gray-600 text-sm">Items</div>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{warehouse.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        parseInt(warehouse.capacity) >= 90 ? 'bg-red-500' :
                        parseInt(warehouse.capacity) >= 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: warehouse.capacity }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMapSelect(warehouse.id);
                  }}
                >
                  View Live Map
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State for no maps */}
        {mockWarehouseMaps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Warehouse Maps Found</h3>
            <p className="text-gray-600">Create your first warehouse layout to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
