'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/page-title';
import WarehouseMapView from '@/components/warehouse/WarehouseMapView';
import WarehouseMapDashboard from '@/components/warehouse/WarehouseMapDashboard';
import { orgUnitService, type OrgUnit } from '@/src/services/orgUnits';
import { warehouseService } from '@/src/services/warehouseService';
import type { Layout } from '@/types/warehouse';
import '@/styles/warehouse.css';

function WarehouseMapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [cameFromDashboard, setCameFromDashboard] = useState(false);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial layout ID from URL params
  const layoutId = searchParams.get('layoutId');

  useEffect(() => {
    setMounted(true);
    // Reset transition state when layoutId changes
    setIsTransitioning(false);
    
    // Check if user came from main dashboard (has layoutId in URL)
    if (layoutId) {
      setCameFromDashboard(true);
    }
  }, [layoutId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const units = await orgUnitService.list();
        if (isCancelled) return;
        setOrgUnits(units);

        const layoutResponses = await Promise.all(
          units.map(async (unit) => {
            try {
              return await warehouseService.getLayouts(unit.id);
            } catch (layoutsError) {
              console.warn(`Failed to fetch layouts for unit ${unit.unitName}`, layoutsError);
              return [] as Layout[];
            }
          })
        );

        if (isCancelled) return;
        setLayouts(layoutResponses.flat());
      } catch (fetchError) {
        console.error('Failed to load warehouse layouts', fetchError);
        if (!isCancelled) {
          setError('Unable to load warehouse layouts. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleMapSelect = useCallback(
    (selectedLayoutId: string) => {
      router.push(`/warehouse-management/warehouse-map?layoutId=${selectedLayoutId}`);
    },
    [router]
  );

  const handleEditLayout = useCallback(
    (selectedLayoutId: string) => {
      router.push(`/warehouse-management/edit/${selectedLayoutId}`);
    },
    [router]
  );

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
          router.push('/warehouse-management');
        } else {
          // User is on warehouse-map page, stay here
          router.push('/warehouse-management/warehouse-map');
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
      <div className="flex items-center justify-between">
        <div>
          <PageTitle title="Warehouse Maps" />
          <p className="text-gray-600 mt-1">View, edit, and monitor layouts directly from the live backend.</p>
        </div>
        <Link href="/warehouse-management/layout-builder">
          <Button>Create New Layout</Button>
        </Link>
      </div>

      <WarehouseMapDashboard
        orgUnits={orgUnits}
        layouts={layouts}
        isLoading={isLoading}
        onMapSelect={handleMapSelect}
        onEditLayout={handleEditLayout}
      />
    </div>
  );
}

function WarehouseMapPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Warehouse Maps...</p>
        </div>
      </div>
    }>
      <WarehouseMapPageContent />
    </Suspense>
  );
}

export default WarehouseMapPage;
