import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs so they never trigger socket reconnection
  const callbackRefs = useRef({
    onLocationTagStatsUpdate,
    onLocationTagCreated,
    onLocationTagDeleted,
    onLocationTagUpdated,
    onComponentCreated,
    onComponentDeleted,
    onComponentUpdated,
  });

  // Keep callback refs up to date on every render without reconnecting
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

  // Socket connection — only re-runs if unitId or layoutId actually changes
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      if (unitId) socket.emit('join:unit', { unitId });
      if (layoutId) socket.emit('join:layout', { layoutId });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('locationTag:statsUpdated', (data: LocationTagStatsPayload) => {
      callbackRefs.current.onLocationTagStatsUpdate?.(data);
    });

    socket.on('locationTag:created', (data: any) => {
      callbackRefs.current.onLocationTagCreated?.(data);
    });

    socket.on('locationTag:deleted', (data: any) => {
      callbackRefs.current.onLocationTagDeleted?.(data);
    });

    socket.on('locationTag:updated', (data: any) => {
      callbackRefs.current.onLocationTagUpdated?.(data);
    });

    socket.on('component:created', (data: any) => {
      callbackRefs.current.onComponentCreated?.(data);
    });

    socket.on('component:deleted', (data: any) => {
      callbackRefs.current.onComponentDeleted?.(data);
    });

    socket.on('component:updated', (data: any) => {
      callbackRefs.current.onComponentUpdated?.(data);
    });

    return () => {
      if (unitId) socket.emit('leave:unit', { unitId });
      if (layoutId) socket.emit('leave:layout', { layoutId });
      socket.disconnect();
    };
  }, [unitId, layoutId]); // ← Only these two — callbacks never cause reconnection

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
}