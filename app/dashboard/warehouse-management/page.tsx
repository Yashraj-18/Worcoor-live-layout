'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Map, LayoutDashboard, Warehouse, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageTitle } from '@/components/page-title';
import WarehouseMapView from '@/components/warehouse/WarehouseMapView';

export default function WarehouseManagementPage() {
  const router = useRouter();
  const [totalLayouts, setTotalLayouts] = useState(0);
  const [activeWarehouses, setActiveWarehouses] = useState(0);
  const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
  const [showMapView, setShowMapView] = useState(false);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

  // Load saved layouts from localStorage
  const refreshSavedLayouts = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedLayouts = localStorage.getItem('warehouseLayouts');
        if (storedLayouts) {
          const parsedLayouts = JSON.parse(storedLayouts);
          setSavedLayouts(parsedLayouts);
          setTotalLayouts(parsedLayouts.length);
          setActiveWarehouses(parsedLayouts.filter((l: any) => l.status === 'operational').length);
        } else {
          setSavedLayouts([]);
          setTotalLayouts(0);
          setActiveWarehouses(0);
        }
      } catch (error) {
        console.error('Error loading layouts:', error);
        setSavedLayouts([]);
        setTotalLayouts(0);
        setActiveWarehouses(0);
      }
    }
  };

  useEffect(() => {
    refreshSavedLayouts();

    const handleStorageChange = () => {
      refreshSavedLayouts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('layoutSaved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('layoutSaved', handleStorageChange);
    };
  }, []);

  // Helper function to get status colors
  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      'operational': '#00D4AA',
      'offline': '#FF6B6B',
      'maintenance': '#FFB800',
      'planning': '#4ECDC4'
    };
    return colors[status] || '#6C757D';
  }

  const handleDeleteLayout = (layoutId: string) => {
    if (!layoutId || typeof window === 'undefined') return;

    const confirmed = window.confirm('Delete this layout permanently? This action cannot be undone.');
    if (!confirmed) return;

    setSavedLayouts(prevLayouts => {
      const updatedLayouts = prevLayouts.filter(layout => layout.id !== layoutId);
      window.localStorage.setItem('warehouseLayouts', JSON.stringify(updatedLayouts));
      window.dispatchEvent(new Event('layoutSaved'));
      return updatedLayouts;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Warehouse Management"
        description="Manage your warehouse layouts and operational maps"
        icon={Warehouse}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Warehouse Map Card */}
        <button
          onClick={() => setShowMapView(true)}
          className="text-left w-full"
        >
          <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Map className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">Warehouse Map</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200">
                    View and manage operational warehouse layouts. Access live warehouse maps, 
                    search locations, track inventory, and monitor warehouse operations in real-time.
                  </p>
                  <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    Open Warehouse Map
                    <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Layout Builder Card */}
        <Link href="/dashboard/warehouse-management/layout-builder">
          <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">Layout Builder</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200">
                    Design and create warehouse layouts. Use drag-and-drop tools to build storage zones, 
                    add racks, define boundaries, and create professional warehouse floor plans.
                  </p>
                  <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    Open Layout Builder
                    <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-100">Total Layouts</p>
                <p className="text-3xl font-bold text-white">
                  {totalLayouts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-100">Active Warehouses</p>
                <p className="text-3xl font-bold text-white">
                  {activeWarehouses}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-100">Storage Capacity</p>
                <p className="text-3xl font-bold text-white">-</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Map className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {savedLayouts.length === 0 ? (
        <Card className="border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-slate-100 p-6">
                <Map className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">No Warehouse Layouts Yet</h3>
              <p className="text-slate-600 dark:text-slate-200 max-w-md">
                Get started by creating your first warehouse layout using the Layout Builder.
              </p>
              <Link href="/dashboard/warehouse-management/layout-builder">
                <Button className="mt-4">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Create First Layout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedLayouts.map((layout) => (
            <Card key={layout.id} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full min-w-[320px] max-w-[380px]">
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight">{layout.name}</CardTitle>
                  <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 shrink-0">
                    {layout.status.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-200 text-sm">
                  {layout.location} - {layout.size}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Created: {new Date(layout.lastActivity).toLocaleDateString()} - {layout.items} items
                </p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Utilization</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{layout.utilization}%</p>
                    </div>
                    <Progress value={layout.utilization} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Zones</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{layout.zones}</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-2 pt-4 pb-6 px-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-center"
                  onClick={() => {
                    setSelectedLayoutId(layout.id);
                    setShowMapView(true);
                  }}
                >
                  View Live <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-center"
                  onClick={() => {
                    router.push(`/dashboard/warehouse-management/edit/${layout.id}`);
                  }}
                >
                  Edit Layout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => handleDeleteLayout(layout.id)}
                >
                  Delete Layout
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Warehouse Map View Modal */}
      {showMapView && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowMapView(false);
            setSelectedLayoutId(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Warehouse Maps</h2>
              <button 
                onClick={() => {
                  setShowMapView(false);
                  setSelectedLayoutId(null);
                }}
                className="text-2xl hover:text-red-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="h-[calc(100%-64px)] overflow-auto">
              <WarehouseMapView facilityData={{}} initialSelectedLayoutId={selectedLayoutId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
