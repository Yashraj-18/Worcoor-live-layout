import type { Socket } from 'socket.io';

import { getUnitRoom, getOrganizationRoom, getLayoutRoom } from '../rooms.js';
import { requireUnitAccess } from '../guards.js';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  organizationId: string;
  role: string;
  currentUnit?: string;
}

export function handleConnection(socket: AuthenticatedSocket) {
  console.log(`User ${socket.userId} connected`);

  socket.on('join-unit', requireUnitAccess(async (socket, { unit_id }) => {
    socket.join(getUnitRoom(unit_id));
    socket.currentUnit = unit_id;
  }));

  socket.on('leave-unit', ({ unit_id }: { unit_id: string }) => {
    if (!unit_id || typeof unit_id !== 'string') {
      socket.emit('error', { message: 'Invalid unit_id' });
      return;
    }

    socket.leave(getUnitRoom(unit_id));
    if (socket.currentUnit === unit_id) {
      socket.currentUnit = undefined;
    }
  });

  socket.on('join:unit', async ({ unitId }: { unitId: string }) => {
    socket.join(getUnitRoom(unitId));
    socket.currentUnit = unitId;
    console.log(`User ${socket.userId} joined unit room: ${unitId}`);
  });

  socket.on('leave:unit', ({ unitId }: { unitId: string }) => {
    socket.leave(getUnitRoom(unitId));
    if (socket.currentUnit === unitId) {
      socket.currentUnit = undefined;
    }
    console.log(`User ${socket.userId} left unit room: ${unitId}`);
  });

  socket.on('join:layout', async ({ layoutId }: { layoutId: string }) => {
    socket.join(getLayoutRoom(layoutId));
    console.log(`User ${socket.userId} joined layout room: ${layoutId}`);
  });

  socket.on('leave:layout', ({ layoutId }: { layoutId: string }) => {
    socket.leave(getLayoutRoom(layoutId));
    console.log(`User ${socket.userId} left layout room: ${layoutId}`);
  });

  socket.on('join-organization', ({ organization_id }: { organization_id: string }) => {
    if (socket.organizationId === organization_id) {
      socket.join(getOrganizationRoom(organization_id));
    }
  });

  socket.on('leave-organization', ({ organization_id }: { organization_id: string }) => {
    socket.leave(getOrganizationRoom(organization_id));
  });
}
