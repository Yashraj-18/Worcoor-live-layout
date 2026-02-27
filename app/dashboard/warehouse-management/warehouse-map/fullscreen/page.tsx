'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WarehouseMapView from '@/components/warehouse/WarehouseMapView';
import '@/styles/warehouse.css';

function WarehouseMapFullscreenContent() {
  const searchParams = useSearchParams();
  const layoutId = searchParams.get('layoutId');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = async () => {
    setFullscreenError(null);

    const el = containerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) return;
      await el.requestFullscreen();
    } catch (e) {
      setFullscreenError('Fullscreen was blocked by the browser. Click the Fullscreen button again to enter fullscreen.');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    void enterFullscreen();
  }, [layoutId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!layoutId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-xl w-full bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-lg font-semibold text-gray-900">Missing layoutId</div>
          <div className="mt-2 text-gray-600">Open this page with <code>?</code><code>layoutId=...</code>.</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-screen h-screen bg-white">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          className="demo-map-fullscreen-btn"
          onClick={enterFullscreen}
          title="Enter Fullscreen"
          type="button"
        >
          ⛶
        </button>
        {isFullscreen && (
          <button
            className="demo-map-close-btn"
            onClick={() => document.exitFullscreen?.()}
            title="Exit Fullscreen"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {fullscreenError && (
        <div className="absolute top-16 right-4 z-50 max-w-md bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">
          {fullscreenError}
        </div>
      )}

      <div className="w-full h-full">
        <WarehouseMapView
          facilityData={{}}
          initialSelectedLayoutId={layoutId}
          fullscreenMode={true}
          onModalClose={() => {
            try {
              window.close();
            } catch {
              // ignore
            }
          }}
        />
      </div>
    </div>
  );
}

export default function WarehouseMapFullscreenPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <WarehouseMapFullscreenContent />
    </Suspense>
  );
}
