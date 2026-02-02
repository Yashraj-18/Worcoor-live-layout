import type { Server as SocketIOServer } from 'socket.io';

import { getUnitRoom, getLayoutRoom } from '../rooms.js';

export type ComponentUpdatedPayload = {
  componentId: string;
  layoutId: string;
  displayName: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  color: string | null;
  locationTagId: string | null;
};

export type ComponentCreatedPayload = {
  componentId: string;
  layoutId: string;
  componentType: string;
  displayName: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
};

export type ComponentDeletedPayload = {
  componentId: string;
  layoutId: string;
};

export type LocationTagAttachedPayload = {
  componentId: string;
  layoutId: string;
  locationTagId: string;
  locationTagName: string;
  capacity: number;
};

export function emitComponentUpdated(
  io: SocketIOServer,
  unitId: string,
  payload: ComponentUpdatedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('component:updated', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('component:updated', payload);
}

export function emitComponentCreated(
  io: SocketIOServer,
  unitId: string,
  payload: ComponentCreatedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('component:created', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('component:created', payload);
}

export function emitComponentDeleted(
  io: SocketIOServer,
  unitId: string,
  payload: ComponentDeletedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('component:deleted', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('component:deleted', payload);
}

export function emitLocationTagAttached(
  io: SocketIOServer,
  unitId: string,
  payload: LocationTagAttachedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('component:locationTagAttached', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('component:locationTagAttached', payload);
}
