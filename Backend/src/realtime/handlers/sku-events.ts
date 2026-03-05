import type { Server as SocketIOServer } from 'socket.io';

import { getUnitRoom, getOrganizationRoom } from '../rooms.js';

export type SkuMovedPayload = {
  skuId: string;
  skuName: string;
  fromLocationTagId: string | null;
  toLocationTagId: string;
  quantity: number;
  movedByUserId: string;
};

export type SkuUpdatedPayload = {
  skuId: string;
  skuName: string;
  quantity: number;
  locationTagId: string | null;
};

export type SkuCreatedPayload = {
  skuId: string;
  skuName: string;
  quantity: number;
  locationTagId: string | null;
};

export type SkuDeletedPayload = {
  skuId: string;
};

export function emitSkuMoved(
  io: SocketIOServer,
  unitId: string,
  organizationId: string,
  payload: SkuMovedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('sku:moved', payload);
  io.to(getOrganizationRoom(organizationId)).emit('sku:moved', payload);
}

export function emitSkuUpdated(
  io: SocketIOServer,
  unitId: string,
  organizationId: string,
  payload: SkuUpdatedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('sku:updated', payload);
  io.to(getOrganizationRoom(organizationId)).emit('sku:updated', payload);
}

export function emitSkuCreated(
  io: SocketIOServer,
  organizationId: string,
  payload: SkuCreatedPayload,
) {
  io.to(getOrganizationRoom(organizationId)).emit('sku:created', payload);
}

export function emitSkuDeleted(
  io: SocketIOServer,
  organizationId: string,
  payload: SkuDeletedPayload,
) {
  io.to(getOrganizationRoom(organizationId)).emit('sku:deleted', payload);
}

export type LocationUpdatedPayload = {
  location_tag_id: string;
  current_items: number;
  utilization_percentage: number;
};

export type InventoryChangedPayload = {
  unit_id: string;
  location_tag_id: string;
  current_items: number;
  utilization_percentage: number;
};

export type CapacityWarningPayload = {
  location_tag_id: string;
  location_tag_name: string;
  current: number;
  capacity: number;
  percentage: number;
};

export function emitLocationUpdated(
  io: SocketIOServer,
  unitId: string,
  payload: LocationUpdatedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('location:updated', payload);
}

export function emitInventoryChanged(
  io: SocketIOServer,
  unitId: string,
  payload: InventoryChangedPayload,
) {
  io.to(getUnitRoom(unitId)).emit('inventory:changed', payload);
}

export function emitCapacityWarning(
  io: SocketIOServer,
  unitId: string,
  payload: CapacityWarningPayload,
) {
  io.to(getUnitRoom(unitId)).emit('location:capacity-warning', payload);
}
