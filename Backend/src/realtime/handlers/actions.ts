import type { Server as SocketIOServer } from 'socket.io';

import type { AuthenticatedSocket } from './connection.js';
import { getUnitRoom } from '../rooms.js';

export type SkuMovePayload = {
  sku_id: string;
  to_location_tag_id: string;
};

export type ComponentUpdatePayload = {
  component_id: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  color?: string;
};

export type InventoryAddPayload = {
  sku_name: string;
  sku_category: string;
  quantity: number;
  sku_unit: string;
  location_tag_id: string;
  effective_date?: string;
  expiry_date?: string;
};

export function registerActionHandlers(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  dependencies: {
    moveSku: (skuId: string, toLocationTagId: string, userId: string, orgId: string) => Promise<{
      sku: { id: string; skuName: string; locationTagId: string | null };
      fromLocation: string | null;
      toLocation: string;
      currentItems: number;
      capacity: number;
    }>;
    updateComponent: (componentId: string, data: Partial<ComponentUpdatePayload>, orgId: string) => Promise<{
      id: string;
      layoutId: string;
    }>;
    addInventory: (data: InventoryAddPayload, userId: string, orgId: string) => Promise<{
      id: string;
      skuName: string;
      quantity: number;
      locationTagId: string;
    }>;
    getLocationCapacity: (locationTagId: string, orgId: string) => Promise<{
      capacity: number;
      currentItems: number;
      tagName: string;
    }>;
  },
) {
  socket.on('sku:move', async (data: SkuMovePayload) => {
    try {
      if (socket.role !== 'admin' && socket.role !== 'worker') {
        return socket.emit('error', { message: 'Insufficient permissions' });
      }

      if (!socket.currentUnit) {
        return socket.emit('error', { message: 'Not viewing any unit' });
      }

      const locationInfo = await dependencies.getLocationCapacity(
        data.to_location_tag_id,
        socket.organizationId,
      );

      if (locationInfo.currentItems >= locationInfo.capacity) {
        return socket.emit('error', { message: 'Location at capacity' });
      }

      const result = await dependencies.moveSku(
        data.sku_id,
        data.to_location_tag_id,
        socket.userId,
        socket.organizationId,
      );

      io.to(getUnitRoom(socket.currentUnit)).emit('sku:moved', {
        sku_id: result.sku.id,
        sku_name: result.sku.skuName,
        from_location: result.fromLocation,
        to_location: result.toLocation,
        moved_by: socket.userId,
        timestamp: new Date().toISOString(),
      });

      // Update destination location
      const utilizationPercentage = ((result.currentItems) / result.capacity) * 100;

      io.to(getUnitRoom(socket.currentUnit)).emit('location:updated', {
        location_tag_id: data.to_location_tag_id,
        current_items: result.currentItems,
        utilization_percentage: utilizationPercentage,
      });

      if (utilizationPercentage > 90) {
        io.to(getUnitRoom(socket.currentUnit)).emit('location:capacity-warning', {
          location_tag_id: data.to_location_tag_id,
          location_tag_name: locationInfo.tagName,
          current: result.currentItems,
          capacity: result.capacity,
          percentage: utilizationPercentage,
        });
      }

      // Also update source location if there was one
      if (result.fromLocation && result.fromLocation !== data.to_location_tag_id) {
        try {
          const sourceLocationInfo = await dependencies.getLocationCapacity(
            result.fromLocation,
            socket.organizationId,
          );

          const sourceUtilizationPercentage = ((sourceLocationInfo.currentItems) / sourceLocationInfo.capacity) * 100;

          io.to(getUnitRoom(socket.currentUnit)).emit('location:updated', {
            location_tag_id: result.fromLocation,
            current_items: sourceLocationInfo.currentItems,
            utilization_percentage: sourceUtilizationPercentage,
          });

          if (sourceUtilizationPercentage > 90) {
            io.to(getUnitRoom(socket.currentUnit)).emit('location:capacity-warning', {
              location_tag_id: result.fromLocation,
              location_tag_name: sourceLocationInfo.tagName,
              current: sourceLocationInfo.currentItems,
              capacity: sourceLocationInfo.capacity,
              percentage: sourceUtilizationPercentage,
            });
          }
        } catch (sourceError) {
          // Log but don't fail the operation if source location update fails
          console.error('Failed to emit source location update:', sourceError);
        }
      }
    } catch (error) {
      socket.emit('error', { message: (error as Error).message });
    }
  });

  socket.on('component:update', async (data: ComponentUpdatePayload) => {
    try {
      if (socket.role !== 'admin') {
        return socket.emit('error', { message: 'Only admins can edit layouts' });
      }

      if (!socket.currentUnit) {
        return socket.emit('error', { message: 'Not viewing any unit' });
      }

      const component = await dependencies.updateComponent(
        data.component_id,
        {
          position_x: data.position_x,
          position_y: data.position_y,
          width: data.width,
          height: data.height,
          color: data.color,
        },
        socket.organizationId,
      );

      socket.to(getUnitRoom(socket.currentUnit)).emit('component:updated', {
        component_id: component.id,
        changes: data,
        updated_by: socket.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      socket.emit('error', { message: (error as Error).message });
    }
  });

  socket.on('inventory:add', async (data: InventoryAddPayload) => {
    try {
      if (socket.role !== 'admin' && socket.role !== 'worker') {
        return socket.emit('error', { message: 'Insufficient permissions' });
      }

      if (!socket.currentUnit) {
        return socket.emit('error', { message: 'Not viewing any unit' });
      }

      const locationInfo = await dependencies.getLocationCapacity(
        data.location_tag_id,
        socket.organizationId,
      );

      if (locationInfo.currentItems >= locationInfo.capacity) {
        return socket.emit('error', { message: 'Location at capacity' });
      }

      const sku = await dependencies.addInventory(data, socket.userId, socket.organizationId);

      io.to(getUnitRoom(socket.currentUnit)).emit('sku:created', {
        sku_id: sku.id,
        sku_name: sku.skuName,
        quantity: sku.quantity,
        location_tag_id: sku.locationTagId,
        created_by: socket.userId,
        timestamp: new Date().toISOString(),
      });

      const newCurrentItems = locationInfo.currentItems + 1;
      const utilizationPercentage = (newCurrentItems / locationInfo.capacity) * 100;

      io.to(getUnitRoom(socket.currentUnit)).emit('inventory:changed', {
        unit_id: socket.currentUnit,
        location_tag_id: data.location_tag_id,
        current_items: newCurrentItems,
        utilization_percentage: utilizationPercentage,
      });
    } catch (error) {
      socket.emit('error', { message: (error as Error).message });
    }
  });
}
