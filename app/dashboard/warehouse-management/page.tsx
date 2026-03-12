'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/utils/AuthContext';
import { Map, LayoutDashboard, Warehouse, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageTitle } from '@/components/page-title';
import WarehouseMapView from '@/components/warehouse/WarehouseMapView';
import { warehouseService } from '@/src/services/warehouseService';
import { orgUnitService, type OrgUnit } from '@/src/services/orgUnits';
import { locationTagService, type LocationTag } from '@/src/services/locationTags';
import { notification } from '@/src/services/notificationService';
import type { Layout } from '@/types/warehouse';
import '@/styles/warehouse.css';

export default function WarehouseManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [locationTagsMap, setLocationTagsMap] = useState<Record<string, LocationTag[]>>({});
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

  const fetchAllLayouts = async () => {
    setIsLoadingLayouts(true);
    setError(null);
    try {
      const units = await orgUnitService.list();
      setOrgUnits(units);

      const layoutResponses = await Promise.all(
        units.map(async (unit) => {
          try {
            const layouts = await warehouseService.getLayouts(unit.id);
            return layouts;
          } catch (layoutsError) {
            console.error(`❌ Failed to fetch layouts for unit ${unit.unitName}:`, layoutsError);
            return [] as Layout[];
          }
        })
      );

      const allLayouts = layoutResponses.flat();
      if (allLayouts.length > 0) {
      }
      setLayouts(allLayouts);

      // Fetch location tags from Reference Data for each unit
      const tagsMap: Record<string, LocationTag[]> = {};
      await Promise.all(
        units.map(async (unit) => {
          try {
            const tags = await locationTagService.listByUnit(unit.id);
            tagsMap[unit.id] = tags;
          } catch {
            tagsMap[unit.id] = [];
          }
        })
      );
      setLocationTagsMap(tagsMap);
    } catch (err) {
      console.error('Failed to load layouts', err);
      setLayouts([]);
      setError('Failed to load layouts.');
      notification.error('Unable to load layouts');
    } finally {
      setIsLoadingLayouts(false);
    }
  };

  const handleHardRefresh = async () => {
    // Clear all state first (hard refresh)
    setLayouts([]);
    setOrgUnits([]);
    setLocationTagsMap({});
    setError(null);
    setShowMapModal(false);
    setSelectedLayoutId(null);

    // Show notification
    notification.success('Refreshing all layouts...');

    // Fetch fresh data
    await fetchAllLayouts();
  };

  useEffect(() => {
    fetchAllLayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDeleteLayout = async (layoutId: string) => {
    if (!layoutId) return;
    const confirmed = window.confirm('Delete this layout permanently? This action cannot be undone.');
    if (!confirmed) return;
    try {
      await warehouseService.deleteLayout(layoutId);
      notification.success('Layout deleted');
      fetchAllLayouts();
    } catch (err) {
      console.error('Failed to delete layout', err);
      notification.error('Failed to delete layout');
    }
  };

  const handleViewLive = (layoutId: string) => {
    // Use local modal state instead of navigation
    setSelectedLayoutId(layoutId);
    setShowMapModal(true);

    // Update URL to include the layout ID and name
    const layout = layouts.find((l) => l.id === layoutId);
    if (layout) {
      const layoutName = layout.layoutName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      const newUrl = `${window.location.pathname}?map=${layoutId}&name=${layoutName}`;
      window.history.pushState({ mapId: layoutId, mapName: layout.layoutName }, '', newUrl);
    }
  };

  const totalLayouts = layouts.length;
  const activeWarehouses = layouts.filter((layout) => layout.status === 'operational').length;
 
  // Avg Tag Utilization = (total occupied tags / total tags) across all units
  const avgTagUtilization = useMemo(() => {
    const allTags = Object.values(locationTagsMap).flat();
    if (allTags.length === 0) return null;
    const occupiedTags = allTags.filter(t => (t.currentItems ?? 0) > 0).length;
    return Math.round((occupiedTags / allTags.length) * 1000) / 10;
  }, [locationTagsMap]);

  const isEmptyState = !isLoadingLayouts && layouts.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageTitle
          title="Warehouse Management"
          description="Manage your warehouse layouts and operational maps"
          icon={Warehouse}
        />
        <Button onClick={handleHardRefresh} disabled={isLoadingLayouts} className="shrink-0">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          {isLoadingLayouts ? 'Refreshing...' : 'Refresh All Layouts'}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

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
                <p className="text-sm font-medium text-purple-100">Avg Tag Utilization</p>
                <p className="text-3xl font-bold text-white">{avgTagUtilization !== null ? `${avgTagUtilization}%` : '—'}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Map className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoadingLayouts ? (
        <Card className="border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft">
          <CardContent className="p-12 text-center text-muted-foreground">Loading layouts…</CardContent>
        </Card>
      ) : isEmptyState ? (
        <Card className="border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-slate-100 p-6">
                <Map className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">No Layouts Available</h3>
              <p className="text-slate-600 dark:text-slate-200 max-w-md">
                No warehouse layouts have been created yet. Create your first layout to get started.
              </p>
              <Link href="/warehouse-management/layout-builder">
                <Button className="mt-4">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Create Layout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => {
            const meta = layout.metadata ?? {};
            const orgUnit = orgUnits.find(u => u.id === layout.unitId);
            const unitLabel = typeof meta.orgUnit === 'string' ? meta.orgUnit : meta.orgUnit?.name ?? orgUnit?.unitName ?? 'Unit';
            const locationLabel = typeof meta.location === 'string' ? meta.location : meta.orgUnit?.location ?? '—';
            const sizeLabel = orgUnit?.area
              ? orgUnit.area
              : meta.croppedDimensions
                ? `${meta.croppedDimensions.width ?? '-'}×${meta.croppedDimensions.height ?? '-'}`
                : meta.size ?? '—';
            const itemsLabel = meta.totalItems ?? meta.items ?? meta.croppedItems ?? 0;
            const lastActivity = layout.updatedAt ?? layout.createdAt;
 
            const unitTags = locationTagsMap[layout.unitId] ?? [];
            const totalTags = unitTags.length;
            const occupiedTags = unitTags.filter(t => (t.currentItems ?? 0) > 0).length;
            const locTagUtil = totalTags > 0 ? Math.round((occupiedTags / totalTags) * 1000) / 10 : 0;
 
            return (
              <Card key={layout.id} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full min-w-[320px] max-w-[380px]">
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight">{layout.layoutName}</CardTitle>
                    <Badge
                      className="shrink-0"
                      style={{ backgroundColor: getStatusColor(layout.status), color: '#fff' }}
                    >
                      {layout.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-200 text-sm">
                    {unitLabel} • {locationLabel} • {sizeLabel}
                  </CardDescription>
                </CardHeader>
 
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Last updated: {new Date(lastActivity).toLocaleDateString()} • {itemsLabel} items
                  </p>
 
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Location Tag Utilization</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {totalTags > 0 ? `${occupiedTags}/${totalTags} (${locTagUtil}%)` : '—'}
                        </p>
                      </div>
                      <Progress value={locTagUtil} className="h-2" />
                    </div>
 
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-4 pb-6 px-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleViewLive(layout.id)}
                  >
                    View Live <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      router.push(`/warehouse-management/edit/${layout.id}`);
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
            );
          })}
        </div>
      )}

      {/* Warehouse Map Modal */}
      {showMapModal && selectedLayoutId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <WarehouseMapView
            facilityData={{}}
            initialSelectedLayoutId={selectedLayoutId}
            prefetchedLayouts={layouts}
            onModalClose={() => {
              setShowMapModal(false);
              setSelectedLayoutId(null);

              // Restore original URL when modal closes
              const originalUrl = window.location.pathname;
              window.history.pushState({}, '', originalUrl);
            }}
          />
        </div>
      )}
    </div>
  );
}
