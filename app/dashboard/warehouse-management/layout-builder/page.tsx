'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import '@/styles/warehouse.css';

const WarehouseLayoutBuilder = dynamic(() => import('@/components/warehouse/WarehouseLayoutBuilder'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <p>Loading Layout Builder...</p>
    </div>
  ),
});

export default function LayoutBuilderPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><p>Loading Layout Builder...</p></div>}>
      <WarehouseLayoutBuilder />
    </Suspense>
  );
}
