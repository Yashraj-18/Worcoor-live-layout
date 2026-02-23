import type { Server as SocketIOServer } from 'socket.io';

import { getUnitRoom, getLayoutRoom } from '../rooms.js';

export type LocationTagStatsPayload = {
  unitId: string;
  layoutId: string;
  totalLocationTags: number;
  totalSkus: number;
  totalComponents: number;
  totalAssets: number;
  timestamp: string;
};

export type LocationTagCreatedPayload = {
  locationTagId: string;
  locationTagName: string;
  componentId: string;
  layoutId: string;
  unitId: string;
};

export type LocationTagDeletedPayload = {
  locationTagId: string;
  componentId: string;
  layoutId: string;
  unitId: string;
};

export type LocationTagUpdatedPayload = {
  locationTagId: string;
  locationTagName: string;
  capacity: number;
  componentId: string;
  layoutId: string;
  unitId: string;
};

/**
 * Emit location tag statistics update to all clients viewing the unit
 */
export function emitLocationTagStats(
  io: SocketIOServer,
  unitId: string,
  payload: LocationTagStatsPayload,
) {
  io.to(getUnitRoom(unitId)).emit('locationTag:statsUpdated', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('locationTag:statsUpdated', payload);
}

/**
 * Emit when a new location tag is created/attached to a component
 */
export function emitLocationTagCreated(
  io: SocketIOServer,
  unitId: string,
  payload: LocationTagCreatedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('locationTag:created', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('locationTag:created', payload);
}

/**
 * Emit when a location tag is deleted/detached from a component
 */
export function emitLocationTagDeleted(
  io: SocketIOServer,
  unitId: string,
  payload: LocationTagDeletedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('locationTag:deleted', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('locationTag:deleted', payload);
}

/**
 * Emit when a location tag is updated
 */
export function emitLocationTagUpdated(
  io: SocketIOServer,
  unitId: string,
  payload: LocationTagUpdatedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('locationTag:updated', payload);
  io.to(getLayoutRoom(payload.layoutId)).emit('locationTag:updated', payload);
}
