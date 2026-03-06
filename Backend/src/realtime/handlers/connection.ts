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

  socket.on('join-unit', (data: any) => requireUnitAccess(async (socket, { unit_id }) => {
    socket.join(getUnitRoom(unit_id));
    socket.currentUnit = unit_id;
  })(socket, data));

  socket.on('leave-unit', (data: any) => {
    const { unit_id } = data ?? {};
    if (!unit_id || typeof unit_id !== 'string') {
      socket.emit('error', { message: 'Invalid unit_id' });
      return;
    }

    socket.leave(getUnitRoom(unit_id));
    if (socket.currentUnit === unit_id) {
      socket.currentUnit = undefined;
    }
  });

  socket.on('join:unit', async (data: any) => {
    const { unitId } = data ?? {};
    if (!unitId || typeof unitId !== 'string') return;
    socket.join(getUnitRoom(unitId));
    socket.currentUnit = unitId;
    console.log(`User ${socket.userId} joined unit room: ${unitId}`);
  });

  socket.on('leave:unit', (data: any) => {
    const { unitId } = data ?? {};
    if (!unitId || typeof unitId !== 'string') return;
    socket.leave(getUnitRoom(unitId));
    if (socket.currentUnit === unitId) {
      socket.currentUnit = undefined;
    }
    console.log(`User ${socket.userId} left unit room: ${unitId}`);
  });

  socket.on('join:layout', async (data: any) => {
    const { layoutId } = data ?? {};
    if (!layoutId || typeof layoutId !== 'string') return;
    socket.join(getLayoutRoom(layoutId));
    console.log(`User ${socket.userId} joined layout room: ${layoutId}`);
  });

  socket.on('leave:layout', (data: any) => {
    const { layoutId } = data ?? {};
    if (!layoutId || typeof layoutId !== 'string') return;
    socket.leave(getLayoutRoom(layoutId));
    console.log(`User ${socket.userId} left layout room: ${layoutId}`);
  });

  socket.on('join-organization', (data: any) => {
    const { organization_id } = data ?? {};
    if (socket.organizationId === organization_id) {
      socket.join(getOrganizationRoom(organization_id));
    }
  });

  socket.on('leave-organization', (data: any) => {
    const { organization_id } = data ?? {};
    if (!organization_id || typeof organization_id !== 'string') return;
    socket.leave(getOrganizationRoom(organization_id));
  });
}
