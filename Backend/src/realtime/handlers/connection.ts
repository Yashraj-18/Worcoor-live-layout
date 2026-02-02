import type { Socket } from 'socket.io';

import { getUnitRoom, getOrganizationRoom } from '../rooms.js';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  organizationId: string;
  role: string;
  currentUnit?: string;
}

export function handleConnection(socket: AuthenticatedSocket) {
  console.log(`User ${socket.userId} connected`);

  socket.on('join-unit', async ({ unit_id }: { unit_id: string }) => {
    socket.join(getUnitRoom(unit_id));
    socket.currentUnit = unit_id;
  });

  socket.on('leave-unit', ({ unit_id }: { unit_id: string }) => {
    socket.leave(getUnitRoom(unit_id));
    if (socket.currentUnit === unit_id) {
      socket.currentUnit = undefined;
    }
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
