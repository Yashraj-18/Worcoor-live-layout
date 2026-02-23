import type { Server as SocketIOServer } from 'socket.io';

import { handleConnection, type AuthenticatedSocket } from './connection.js';

export function registerSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    handleConnection(authSocket);

    socket.on('disconnect', () => {
      console.log(`User ${authSocket.userId} disconnected`);
    });
  });
}

export * from './sku-events.js';
export * from './component-events.js';
export * from './actions.js';
export * from './location-tag-events.js';
export type { AuthenticatedSocket } from './connection.js';
