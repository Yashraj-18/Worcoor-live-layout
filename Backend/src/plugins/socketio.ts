import { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';

import { AppEnv } from '../config/env.js';
import { registerSocketHandlers } from '../realtime/handlers/index.js';
import type { AuthenticatedSocket } from '../realtime/handlers/connection.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

export async function registerSocketIO(app: FastifyInstance, env: AppEnv) {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const token = cookieHeader
        ?.split('; ')
        .find((c) => c.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication failed: No token'));
      }

      const decoded = app.jwt.verify<{
        userId: string;
        organizationId: string;
        role: string;
      }>(token);

      (socket as AuthenticatedSocket).userId = decoded.userId;
      (socket as AuthenticatedSocket).organizationId = decoded.organizationId;
      (socket as AuthenticatedSocket).role = decoded.role;

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  registerSocketHandlers(io);

  app.decorate('io', io);

  app.addHook('onClose', async () => {
    await io.close();
  });
}