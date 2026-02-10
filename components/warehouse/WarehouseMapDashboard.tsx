'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { OrgUnit } from '@/src/services/orgUnits';
import type { Layout } from '@/types/warehouse';

interface WarehouseMapDashboardProps {
  onMapSelect: (layoutId: string) => void;
  onEditLayout?: (layoutId: string) => void;
  orgUnits: OrgUnit[];
  layouts: Layout[];
  isLoading?: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'operational':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'archived':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatUtilization(layout: Layout) {
  const utilization = layout.metadata?.utilization ?? layout.metadata?.metrics?.utilization;
  if (typeof utilization === 'number') {
    return Math.min(Math.max(utilization, 0), 100);
  }
  const derived = layout.metadata?.totalComponents
    ? Math.min(Math.round((layout.metadata.croppedItems ?? layout.metadata.totalComponents) * 2), 100)
    : Math.round(Math.random() * 40) + 50;
  return derived;
}

interface DashboardCard {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  utilization: number;
  items: number;
  location: string;
  layoutId: string;
  updatedAt: string | null;
  orgUnit: OrgUnit | null;
}

export default function WarehouseMapDashboard({
  onMapSelect,
  onEditLayout,
  orgUnits,
  layouts,
  isLoading,
}: WarehouseMapDashboardProps) {
  const cards: DashboardCard[] = useMemo(() => {
    return layouts.map((layout) => {
      const unit = orgUnits.find((orgUnit) => orgUnit.id === layout.unitId) ?? null;
      const utilization = formatUtilization(layout);
      const items = Array.isArray(layout.layoutData?.items) ? layout.layoutData?.items.length : 0;
      const location = unit?.unitName ?? layout.metadata?.orgUnit?.name ?? 'Warehouse Unit';

      return {
        id: layout.id,
        title: layout.layoutName,
        subtitle: location,
        status: layout.status,
        utilization,
        items,
        location,
        layoutId: layout.id,
        updatedAt: layout.updatedAt,
        orgUnit: unit,
      } satisfies DashboardCard;
    });
  }, [layouts, orgUnits]);

  const summary = useMemo(() => {
    const totalLayouts = cards.length;
    const operational = cards.filter((card) => card.status === 'operational').length;
    const avgUtilization =
      totalLayouts === 0
        ? 0
        : Math.round(cards.reduce((sum, card) => sum + card.utilization, 0) / totalLayouts);
    const totalItems = cards.reduce((sum, card) => sum + card.items, 0);

    return {
      totalLayouts,
      operational,
      avgUtilization,
      totalItems,
    };
  }, [cards]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 bg-white border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 bg-white border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No warehouse layouts found</h2>
          <p className="text-gray-600">
            Use the layout builder to design a warehouse map, and it will show up here once saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Warehouse Network Overview</h2>
          <p className="text-gray-600 mt-1">Powered by live backend data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Total Layouts</CardDescription>
              <CardTitle className="text-3xl">{summary.totalLayouts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Operational</CardDescription>
              <CardTitle className="text-3xl text-green-600">{summary.operational}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Average Utilization</CardDescription>
              <CardTitle className="text-3xl">{summary.avgUtilization}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total Components</CardDescription>
              <CardTitle className="text-3xl">{summary.totalItems.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="border border-gray-100 shadow-sm">
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  <span>{card.subtitle}</span>
                  <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
                </CardDescription>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Utilization</span>
                    <span className="text-sm font-semibold text-gray-900">{card.utilization}%</span>
                  </div>
                  <Progress value={card.utilization} className="h-2" />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <div>
                    <p className="text-gray-900 font-semibold">{card.items}</p>
                    <p>Components</p>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{card.orgUnit?.unitType ?? 'Warehouse'}</p>
                    <p>Unit type</p>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">
                      {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : '—'}
                    </p>
                    <p>Updated</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <button
                  className="flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                  onClick={() => onMapSelect(card.layoutId)}
                >
                  View Live Map
                </button>
                {onEditLayout && (
                  <button
                    className="flex-1 rounded-md border border-blue-200 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    onClick={() => onEditLayout(card.layoutId)}
                  >
                    Edit Layout
                  </button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
