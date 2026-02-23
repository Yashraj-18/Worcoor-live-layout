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

  useEffect(() => {
    // Get the backend URL from environment or default to localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Create socket connection with credentials (cookies)
    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);

      // Join the unit room to receive updates for this specific unit
      if (unitId) {
        socket.emit('join:unit', { unitId });
      }

      // Join the layout room if layoutId is provided
      if (layoutId) {
        socket.emit('join:layout', { layoutId });
      }
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

    // Location tag statistics updates
    if (onLocationTagStatsUpdate) {
      socket.on('locationTag:statsUpdated', (data: LocationTagStatsPayload) => {
        console.log('Location tag stats updated:', data);
        onLocationTagStatsUpdate(data);
      });
    }

    // Location tag events
    if (onLocationTagCreated) {
      socket.on('locationTag:created', onLocationTagCreated);
    }

    if (onLocationTagDeleted) {
      socket.on('locationTag:deleted', onLocationTagDeleted);
    }

    if (onLocationTagUpdated) {
      socket.on('locationTag:updated', onLocationTagUpdated);
    }

    // Component events
    if (onComponentCreated) {
      socket.on('component:created', onComponentCreated);
    }

    if (onComponentDeleted) {
      socket.on('component:deleted', onComponentDeleted);
    }

    if (onComponentUpdated) {
      socket.on('component:updated', onComponentUpdated);
    }

    // Cleanup on unmount
    return () => {
      if (unitId) {
        socket.emit('leave:unit', { unitId });
      }
      if (layoutId) {
        socket.emit('leave:layout', { layoutId });
      }
      socket.disconnect();
    };
  }, [
    unitId,
    layoutId,
    onLocationTagStatsUpdate,
    onLocationTagCreated,
    onLocationTagDeleted,
    onLocationTagUpdated,
    onComponentCreated,
    onComponentDeleted,
    onComponentUpdated,
  ]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
}
