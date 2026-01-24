'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageTitle } from '@/components/page-title';
import { ArrowRight, Map, LayoutDashboard, Search, Filter, X, Eye, Edit, Trash2, Grid, List, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import WarehouseMapView from '@/components/warehouse/WarehouseMapView';
import '@/styles/warehouse.css';

// TypeScript interfaces
interface WarehouseLayout {
  id: string;
  name: string;
  location: string;
  size: string;
  status: string;
  utilization: number;
  zones: number;
  items: number;
  lastActivity: string;
  layoutData: {
    items: any[];
  };
}

interface WarehouseUnit {
  id: string;
  name: string;
  subtitle: string;
  status: string;
  statusColor: string;
  utilization: number;
  zones: number;
  temperature?: number;
  details: string;
  isCustomLayout?: boolean;
  layoutData?: {
    items: any[];
  };
}

export default function WarehouseMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<WarehouseLayout[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameFromDashboard, setCameFromDashboard] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get initial layout ID from URL params
  const layoutId = searchParams.get('layoutId');

  useEffect(() => {
    setMounted(true);
    loadSavedLayouts();
    // Reset transition state when layoutId changes
    setIsTransitioning(false);
    
    // Check if user came from main dashboard (has layoutId in URL)
    if (layoutId) {
      setCameFromDashboard(true);
    }
  }, [layoutId]);

  const loadSavedLayouts = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedLayouts = localStorage.getItem('warehouseLayouts');
        if (storedLayouts) {
          const parsedLayouts = JSON.parse(storedLayouts);
          setSavedLayouts(parsedLayouts);
        }
      } catch (error) {
        console.error('Error loading layouts:', error);
        setSavedLayouts([]);
      }
    }
  };

  // Filter and search functionality
  const filteredLayouts = useMemo(() => {
    return savedLayouts.filter(layout => {
      const matchesSearch = searchQuery === '' || 
        layout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        layout.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || layout.status === selectedStatus;
      const matchesLocation = selectedLocation === 'all' || layout.location === selectedLocation;
      
      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [savedLayouts, searchQuery, selectedStatus, selectedLocation]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = savedLayouts.map(layout => layout.location);
    return ['all', ...Array.from(new Set(locations))];
  }, [savedLayouts]);

  const handleLayoutClick = (layout: WarehouseLayout) => {
    // Navigate to the same page with layoutId parameter to trigger WarehouseMapView's modal
    router.push(`/dashboard/warehouse-management/warehouse-map?layoutId=${layout.id}`);
  };

  const handleDeleteLayout = (layoutId: string) => {
    if (confirm('Are you sure you want to delete this layout?')) {
      const updatedLayouts = savedLayouts.filter(layout => layout.id !== layoutId);
      setSavedLayouts(updatedLayouts);
      localStorage.setItem('warehouseLayouts', JSON.stringify(updatedLayouts));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedLocation('all');
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Warehouse Maps...</p>
        </div>
      </div>
    );
  }

  // If layoutId is provided, show the WarehouseMapView directly
  if (layoutId) {
    const handleModalClose = () => {
      // Start transition
      setIsTransitioning(true);
      
      // Navigate back after a short delay to allow smooth transition
      setTimeout(() => {
        if (cameFromDashboard) {
          // User came from main dashboard, go back there
          router.push('/dashboard/warehouse-management');
        } else {
          // User is on warehouse-map page, stay here
          router.push('/dashboard/warehouse-management/warehouse-map');
        }
      }, 150);
    };

    return (
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <WarehouseMapView 
          facilityData={{}} 
          initialSelectedLayoutId={layoutId}
          onModalClose={handleModalClose}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <PageTitle title="Warehouse Maps" />
          <p className="text-gray-600 mt-1">View and manage your warehouse layouts with advanced search and filtering</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/warehouse-management/layout-builder">
            <Button className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Create New Layout
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search layouts by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(selectedStatus !== 'all' || selectedLocation !== 'all') && (
                  <Badge variant="secondary" className="ml-1">
                    {[selectedStatus, selectedLocation].filter(f => f !== 'all').length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center gap-2"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>

              {(searchQuery || selectedStatus !== 'all' || selectedLocation !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-red-600"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="offline">Offline</option>
                    <option value="planning">Planning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {uniqueLocations.map(location => (
                      <option key={location} value={location}>
                        {location === 'all' ? 'All Locations' : location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredLayouts.length} of {savedLayouts.length} layouts
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Map className="h-4 w-4" />
          <span>Warehouse Management System</span>
        </div>
      </div>

      {/* Warehouse Layouts */}
      {filteredLayouts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-gray-100 p-6">
                <Map className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {savedLayouts.length === 0 ? 'No Warehouse Layouts Yet' : 'No Matching Layouts Found'}
              </h3>
              <p className="text-gray-600 max-w-md">
                {savedLayouts.length === 0 
                  ? 'Get started by creating your first warehouse layout using the Layout Builder.'
                  : 'Try adjusting your search or filters to find the layouts you\'re looking for.'
                }
              </p>
              {savedLayouts.length === 0 && (
                <Link href="/dashboard/warehouse-management/layout-builder">
                  <Button className="mt-4">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Create First Layout
                  </Button>
                </Link>
              )}
              {savedLayouts.length > 0 && filteredLayouts.length === 0 && (
                <Button onClick={clearFilters} variant="outline" className="mt-4">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
          : "space-y-4"
        }>
          {filteredLayouts.map((layout) => (
            <Card 
              key={layout.id} 
              className={`group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 ${
                viewMode === 'list' ? 'flex' : 'h-full min-w-[320px] max-w-[380px]'
              }`}
            >
              <div className={viewMode === 'list' ? 'flex-1 flex' : ''}>
                <CardHeader className={viewMode === 'list' ? 'flex-1' : 'space-y-1'}>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-gray-900 text-lg font-bold leading-tight flex-1">
                      {layout.name}
                    </CardTitle>
                    <Badge className={getStatusColor(layout.status)}>
                      {layout.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600 text-sm">
                    {layout.location} • {layout.size}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Created: {new Date(layout.lastActivity).toLocaleDateString()} • {layout.items} items
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">Utilization</p>
                        <p className="text-sm font-semibold text-gray-900">{layout.utilization}%</p>
                      </div>
                      <Progress value={layout.utilization} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-sm font-medium text-gray-900">Zones</p>
                      <p className="text-sm font-semibold text-gray-900">{layout.zones}</p>
                    </div>
                  </div>
                </CardContent>
              </div>
              
              <CardFooter className={`flex flex-col gap-2 pt-4 pb-6 px-6 ${
                viewMode === 'list' ? 'border-l pl-6' : ''
              }`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-center"
                  onClick={() => handleLayoutClick(layout)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Live Map
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 justify-center"
                    onClick={() => router.push(`/dashboard/warehouse-management/edit/${layout.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteLayout(layout.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
