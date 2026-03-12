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
  
  socket.on('join:unit', requireUnitAccess(async (socket, data) => {
    const unitId = data?.unit_id ?? data?.unitId;
    if (!unitId) return;
    socket.join(getUnitRoom(unitId));
    socket.currentUnit = unitId;
  }));
 
  socket.on('leave:unit', (data: any) => {
    const unitId = data?.unit_id ?? data?.unitId;
    if (!unitId || typeof unitId !== 'string') return;
    socket.leave(getUnitRoom(unitId));
    if (socket.currentUnit === unitId) {
      socket.currentUnit = undefined;
    }
  });
 
  socket.on('join:layout', async (data: any) => {
    const { layoutId } = data ?? {};
    if (!layoutId || typeof layoutId !== 'string') return;
    socket.join(getLayoutRoom(layoutId));
  });
 
  socket.on('leave:layout', (data: any) => {
    const { layoutId } = data ?? {};
    if (!layoutId || typeof layoutId !== 'string') return;
    socket.leave(getLayoutRoom(layoutId));
  });
 
  socket.on('join:organization', (data: any) => {
    const orgId = data?.organization_id ?? data?.organizationId;
    if (socket.organizationId === orgId) {
      socket.join(getOrganizationRoom(orgId));
    }
  });
 
  socket.on('leave:organization', (data: any) => {
    const orgId = data?.organization_id ?? data?.organizationId;
    if (!orgId || typeof orgId !== 'string') return;
    socket.leave(getOrganizationRoom(orgId));
  });
}
