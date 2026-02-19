'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import '@/styles/warehouse.css';
import { warehouseService } from '@/src/services/warehouseService';
import { orgUnitService, type OrgUnit } from '@/src/services/orgUnits';
import type { Layout } from '@/types/warehouse';

const WarehouseLayoutBuilder = dynamic(() => import('@/components/warehouse/WarehouseLayoutBuilder'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading Layout Builder…</p>
      </div>
    </div>
  ),
});

interface BuilderOrgUnit {
  id: string;
  name: string;
}

interface BuilderLayoutData {
  id?: string;
  name?: string;
  items: any[];
  status?: string;
  metadata?: Record<string, any>;
}

export default function EditLayoutPage() {
  const params = useParams();
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const layoutParam = params?.id;
    const layoutId = Array.isArray(layoutParam) ? layoutParam[0] : layoutParam;

    if (!layoutId) {
      setError('No layout ID provided');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchLayout = async () => {
      try {
        const fetchedLayout = await warehouseService.getLayout(layoutId);
        if (!isMounted) return;
        setLayout(fetchedLayout);

        try {
          const fetchedUnits = await orgUnitService.list();
          if (!isMounted) return;
          setOrgUnits(fetchedUnits);
        } catch (unitsError) {
          console.warn('Warehouse edit: failed to fetch org units', unitsError);
        }
      } catch (fetchError) {
        console.error('Failed to load layout', fetchError);
        if (isMounted) {
          setError('Failed to load layout details. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLayout();

    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  const selectedOrgUnit: BuilderOrgUnit | null = useMemo(() => {
    if (!layout) {
      return null;
    }

    const matchedUnit = orgUnits.find((unit) => unit.id === layout.unitId);
    if (matchedUnit) {
      return { id: matchedUnit.id, name: matchedUnit.unitName };
    }

    const layoutOrgUnit = (layout.layoutData as Record<string, any> | null)?.orgUnit;
    if (layoutOrgUnit?.id || layout.unitId) {
      return {
        id: layoutOrgUnit?.id ?? layout.unitId,
        name: layoutOrgUnit?.name ?? layoutOrgUnit?.unitName ?? 'Warehouse Unit',
      };
    }

    return null;
  }, [layout, orgUnits]);

  const initialLayout: BuilderLayoutData | null = useMemo(() => {
    if (!layout) {
      return null;
    }

    const layoutData = (layout.layoutData as Record<string, any> | null) ?? {};
    return {
      id: layout.id,
      name: layout.layoutName,
      items: Array.isArray(layoutData.items) ? layoutData.items : [],
      status: layout.status,
      metadata: layout.metadata ?? undefined,
    };
  }, [layout]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading layout details…</p>
        </div>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Layout</h2>
            <p className="text-red-600 mb-4">{error || 'Layout not found'}</p>
            <button
              onClick={() => router.push('/dashboard/warehouse-management')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Back to Warehouse Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Layout</h1>
            <p className="text-gray-600 mt-1">
              {layout.layoutName} • {selectedOrgUnit?.name || 'Unknown Unit'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/warehouse-management')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>
            Status:
            <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              {layout.status}
            </span>
          </span>
          <span>Last updated: {layout.updatedAt ? new Date(layout.updatedAt).toLocaleString() : '—'}</span>
          <span>Created: {new Date(layout.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <WarehouseLayoutBuilder
        initialOrgUnit={selectedOrgUnit}
        initialLayout={initialLayout}
        layoutId={layout.id}
      />
    </div>
  );
}
