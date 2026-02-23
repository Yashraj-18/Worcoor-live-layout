import { useEffect, useCallback } from 'react';
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
}: UseLocationSocketOptions) => {
  const { on } = useSocket({ unitId });

  useEffect(() => {
    if (!locationTagId) return;

    // Listen for location:updated and filter by locationTagId
    const unsubLocation = on<LocationUpdatedPayload>('location:updated', (data) => {
      if (data.location_tag_id === locationTagId) {
        console.log('📨 location:updated received:', data)
        onLocationUpdated(data);
      }
    });

    // Listen for inventory:changed and filter by locationTagId
    const unsubInventory = on<InventoryChangedPayload>('inventory:changed', (data) => {
      if (data.location_tag_id === locationTagId) {
        console.log('📨 inventory:changed received:', data);
        onInventoryChanged(data);
      }
    });

    return () => {
      unsubLocation();
      unsubInventory();
    };
  }, [locationTagId, on, onLocationUpdated, onInventoryChanged]);
};