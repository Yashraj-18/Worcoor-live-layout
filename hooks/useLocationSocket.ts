import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export interface LocationUpdatedPayload {
  location_tag_id: string;
  current_items: number;
  utilization_percentage: number;
}

export interface InventoryChangedPayload {
  unit_id: string;
  location_tag_id: string;
  current_items: number;
  utilization_percentage: number;
}

interface UseLocationSocketOptions {
  unitId: string | null | undefined;
  locationTagId: string | null | undefined;
  onLocationUpdated: (data: LocationUpdatedPayload) => void;
  onInventoryChanged: (data: InventoryChangedPayload) => void;
  onSkuChange?: () => void
  onComponentChange?: () => void  
  onCapacityWarning?: (data: {
    location_tag_id: string
    location_tag_name: string
    current: number
    capacity: number
    percentage: number
  }) => void
}

/**
 * Subscribes to real-time socket events for a specific location tag.
 * Filters events so only updates for the currently open panel fire the callbacks.
 */
export const useLocationSocket = ({
  unitId,
  locationTagId,
  onLocationUpdated,
  onInventoryChanged,
  onSkuChange,
  onComponentChange,
  onCapacityWarning,
}: UseLocationSocketOptions) => {
  const { on } = useSocket({ unitId });

  // Stabilize callback props with refs to prevent unnecessary re-runs
  const onLocationUpdatedRef = useRef(onLocationUpdated);
  const onInventoryChangedRef = useRef(onInventoryChanged);
  const onSkuChangeRef = useRef(onSkuChange);
  const onComponentChangeRef = useRef(onComponentChange);
  const onCapacityWarningRef = useRef(onCapacityWarning);

  useEffect(() => {
    onLocationUpdatedRef.current = onLocationUpdated;
  }, [onLocationUpdated]);

  useEffect(() => {
    onInventoryChangedRef.current = onInventoryChanged;
  }, [onInventoryChanged]);

  useEffect(() => {
    onSkuChangeRef.current = onSkuChange;
  }, [onSkuChange]);

  useEffect(() => {
    onComponentChangeRef.current = onComponentChange;
  }, [onComponentChange]);

  useEffect(() => {
    onCapacityWarningRef.current = onCapacityWarning;
  }, [onCapacityWarning]);

  useEffect(() => {
    if (!locationTagId) return;

    // Listen for location:updated and filter by locationTagId
    const unsubLocation = on<LocationUpdatedPayload>('location:updated', (data) => {
      if (data.location_tag_id === locationTagId) {
        onLocationUpdatedRef.current?.(data);
      }
    });

    // Listen for inventory:changed and filter by locationTagId
    const unsubInventory = on<InventoryChangedPayload>('inventory:changed', (data) => {
      if (data.location_tag_id === locationTagId) {
        onInventoryChangedRef.current?.(data);
      }
    });

    // Listen for SKU events
    const unsubSkuMoved = on('sku:moved', () => onSkuChangeRef.current?.());
    const unsubSkuUpdated = on('sku:updated', () => onSkuChangeRef.current?.());
    const unsubSkuCreated = on('sku:created', () => onSkuChangeRef.current?.());
    const unsubSkuDeleted = on('sku:deleted', () => onSkuChangeRef.current?.());

    // Listen for capacity warning
    const unsubCapacityWarning = on<{
      location_tag_id: string;
      location_tag_name: string;
      current: number;
      capacity: number;
      percentage: number;
    }>('location:capacity-warning', (data) => {
      onCapacityWarningRef.current?.(data);
    });

    // Listen for component events only if onComponentChange callback is provided
    // This prevents duplicate refreshes when useWarehouseSocket already handles component events
    let unsubComponentUpdated: () => void;
    let unsubComponentCreated: () => void;
    let unsubComponentDeleted: () => void;
    let unsubComponentLocationTagAttached: () => void;

    if (onComponentChange) {
      unsubComponentUpdated = on('component:updated', () => onComponentChangeRef.current?.());
      unsubComponentCreated = on('component:created', () => onComponentChangeRef.current?.());
      unsubComponentDeleted = on('component:deleted', () => onComponentChangeRef.current?.());
      unsubComponentLocationTagAttached = on('component:locationTagAttached', () => onComponentChangeRef.current?.());
    } else {
      // Create no-op functions to avoid undefined references
      unsubComponentUpdated = () => {};
      unsubComponentCreated = () => {};
      unsubComponentDeleted = () => {};
      unsubComponentLocationTagAttached = () => {};
    }

    return () => {
      unsubLocation();
      unsubInventory();
      unsubSkuMoved();
      unsubSkuUpdated();
      unsubSkuCreated();
      unsubSkuDeleted();
      unsubCapacityWarning();
      unsubComponentUpdated();
      unsubComponentCreated();
      unsubComponentDeleted();
      unsubComponentLocationTagAttached();
    };
  }, [locationTagId, on]);
};