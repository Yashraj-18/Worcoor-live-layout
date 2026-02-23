import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

const getSocket = (): Socket => {
  if (!globalSocket || !globalSocket.connected) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/', '') ?? '';
    globalSocket = io(apiUrl, {
      withCredentials: true,
      transports: ['websocket'],
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

export const useSocket = (options: UseSocketOptions = {}) => {
  const { unitId } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const joinRoom = () => {
      if (unitId) {
        socket.emit('join-unit', { unit_id: unitId });
        console.log('📡 Joined unit room:', unitId);
      }
    };

    // Join immediately if already connected
    if (socket.connected) {
      joinRoom();
    }

    // Re-join on reconnect (socket drops and comes back)
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      if (unitId) {
        socket.emit('leave-unit', { unit_id: unitId });
        console.log('📡 Left unit room:', unitId);
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