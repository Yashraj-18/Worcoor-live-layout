import { useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';

interface LocationTagStatsPayload {
  unitId: string;
  layoutId: string;
  totalLocationTags: number;
  totalSkus: number;
  totalComponents: number;
  totalAssets: number;
  timestamp: string;
}

interface UseWarehouseSocketOptions {
  unitId: string;
  layoutId?: string;
  onLocationTagStatsUpdate?: (stats: LocationTagStatsPayload) => void;
  onLocationTagCreated?: (data: any) => void;
  onLocationTagDeleted?: (data: any) => void;
  onLocationTagUpdated?: (data: any) => void;
  onComponentCreated?: (data: any) => void;
  onComponentDeleted?: (data: any) => void;
  onComponentUpdated?: (data: any) => void;
}

export function useWarehouseSocket(options: UseWarehouseSocketOptions) {
  const {
    unitId,
    layoutId,
    onLocationTagStatsUpdate,
    onLocationTagCreated,
    onLocationTagDeleted,
    onLocationTagUpdated,
    onComponentCreated,
    onComponentDeleted,
    onComponentUpdated,
  } = options;

  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs so they never trigger event re-registration
  const callbackRefs = useRef({
    onLocationTagStatsUpdate,
    onLocationTagCreated,
    onLocationTagDeleted,
    onLocationTagUpdated,
    onComponentCreated,
    onComponentDeleted,
    onComponentUpdated,
  });

  // Keep callback refs up to date on every render without re-registering listeners
  useEffect(() => {
    callbackRefs.current = {
      onLocationTagStatsUpdate,
      onLocationTagCreated,
      onLocationTagDeleted,
      onLocationTagUpdated,
      onComponentCreated,
      onComponentDeleted,
      onComponentUpdated,
    };
  });

  // Use the shared singleton socket — no new io() connection created per caller.
  // useSocket handles join-unit room via its own effect.
  const { on, emit } = useSocket({ unitId });

  // Join/leave layout room only — unit room is already joined by useSocket({ unitId })
  // via the legacy join-unit event. Emitting join:unit here would cause a double
  // room-join and an extra DB query through requireUnitAccess on every mount.
  useEffect(() => {
    if (layoutId) emit('join:layout', { layoutId });

    return () => {
      if (layoutId) emit('leave:layout', { layoutId });
    };
  }, [layoutId, emit]);

  // Register all event listeners once. Callbacks are always read from the ref
  // so they never need to be in the dependency array.
  useEffect(() => {
    const unsubs = [
      on('connect', () => setIsConnected(true)),
      on('disconnect', () => setIsConnected(false)),
      on<LocationTagStatsPayload>('locationTag:statsUpdated', (data) => {
        callbackRefs.current.onLocationTagStatsUpdate?.(data);
      }),
      on('locationTag:created', (data) => {
        callbackRefs.current.onLocationTagCreated?.(data);
      }),
      on('locationTag:deleted', (data) => {
        callbackRefs.current.onLocationTagDeleted?.(data);
      }),
      on('locationTag:updated', (data) => {
        callbackRefs.current.onLocationTagUpdated?.(data);
      }),
      on('component:created', (data) => {
        callbackRefs.current.onComponentCreated?.(data);
      }),
      on('component:deleted', (data) => {
        callbackRefs.current.onComponentDeleted?.(data);
      }),
      on('component:updated', (data) => {
        callbackRefs.current.onComponentUpdated?.(data);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [on]); // `on` is stable (useCallback([]) in useSocket) — registers once

  return {
    isConnected,
  };
}