import type { AuthenticatedSocket } from './handlers/connection.js';
import { UnitsRepository } from '../modules/warehouse/units/repository.js';

const unitsRepository = new UnitsRepository();

export function requireUnitAccess(
  handler: (socket: AuthenticatedSocket, data: any) => Promise<void>
): (socket: AuthenticatedSocket, data: any) => Promise<void> {
  return async (socket: AuthenticatedSocket, data: any) => {
    try {
      const unit_id = (data ?? {}).unit_id ?? (data ?? {}).unitId;

      if (!unit_id || typeof unit_id !== 'string') {
        socket.emit('error', { message: 'Invalid unit_id' });
        return;
      }

      const unit = await unitsRepository.findById(unit_id, socket.organizationId);

      if (!unit) {
        socket.emit('error', { message: 'Unit not found or access denied' });
        return;
      }

      await handler(socket, data);
    } catch (error) {
      console.error('requireUnitAccess error:', error);
      try {
        socket.emit('error', { message: 'Internal server error' });
      } catch (emitError) {
        console.error('Failed to emit error to socket:', emitError);
      }
    }
  };
}
