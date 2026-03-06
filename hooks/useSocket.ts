import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

const getSocket = (): Socket => {
  if (!globalSocket) {
    const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    globalSocket = io(apiUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    globalSocket.on('connect', () => {
      console.log('✅ Socket connected:', globalSocket?.id);
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    globalSocket.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err.message);
    });
  }
  return globalSocket;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseSocketOptions {
  unitId?: string | null; // joins the unit room when provided
}

// Track active unit room subscriptions (unitId → ref count).
// Multiple callers with the same unitId share one join-unit/leave-unit lifecycle.
const unitRefCounts = new Map<string, number>();
// One stable joinRoom handler per unitId so socket.off() works correctly.
const unitJoinHandlers = new Map<string, () => void>();

export const useSocket = (options: UseSocketOptions = {}) => {
  const { unitId } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!unitId) return;

    const prev = unitRefCounts.get(unitId) ?? 0;
    unitRefCounts.set(unitId, prev + 1);

    if (prev === 0) {
      // First caller for this unitId — register one join handler
      const joinRoom = () => {
        socket.emit('join-unit', { unit_id: unitId });
        console.log('📡 Joined unit room:', unitId);
      };
      unitJoinHandlers.set(unitId, joinRoom);

      if (socket.connected) {
        joinRoom();
      }
      socket.on('connect', joinRoom);
    }

    return () => {
      const current = unitRefCounts.get(unitId) ?? 1;
      if (current <= 1) {
        // Last caller unmounting — deregister handler and leave room
        unitRefCounts.delete(unitId);
        const handler = unitJoinHandlers.get(unitId);
        if (handler) {
          socket.off('connect', handler);
          unitJoinHandlers.delete(unitId);
        }
        socket.emit('leave-unit', { unit_id: unitId });
        console.log('📡 Left unit room:', unitId);
      } else {
        unitRefCounts.set(unitId, current - 1);
      }
    };
  }, [unitId]);

  /**
   * Subscribe to a socket event.
   * Returns a cleanup function — call it (or use inside useEffect) to unsubscribe.
   */
  const on = useCallback(<T = unknown>(event: string, handler: (data: T) => void) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  /**
   * Unsubscribe from a socket event.
   */
  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    const socket = getSocket();
    if (handler) {
      socket.off(event, handler);
    } else {
      socket.removeAllListeners(event);
    }
  }, []);

  /**
   * Emit an event to the server.
   */
  const emit = useCallback(<T = unknown>(event: string, data?: T) => {
    const socket = getSocket();
    socket.emit(event, data);
  }, []);

  return { on, off, emit, socket: socketRef };
};