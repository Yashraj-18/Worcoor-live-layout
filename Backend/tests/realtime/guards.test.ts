import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { AuthenticatedSocket } from '../../src/realtime/handlers/connection.js';

const mockFindById = vi.fn();

vi.mock('../../src/modules/warehouse/units/repository.js', () => ({
  UnitsRepository: vi.fn().mockImplementation(() => ({
    findById: mockFindById,
    findAllByOrganization: vi.fn(),
    findByIdWithUtilization: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

const { requireUnitAccess } = await import('../../src/realtime/guards.js');

describe('requireUnitAccess', () => {
  let mockSocket: Partial<AuthenticatedSocket>;
  let mockHandler: (socket: AuthenticatedSocket, data: any) => Promise<void>;

  beforeEach(() => {
    mockSocket = {
      organizationId: 'org-123',
      userId: 'user-456',
      role: 'admin',
      emit: vi.fn(),
      join: vi.fn(),
    };

    mockHandler = vi.fn(async () => {});
    mockFindById.mockReset();
  });

  it('should emit error when unit_id is missing', async () => {
    const guardedHandler = requireUnitAccess(mockHandler);
    const data = {};

    await guardedHandler(mockSocket as AuthenticatedSocket, data);

    expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid unit_id' });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should emit error when unit_id is invalid type', async () => {
    const guardedHandler = requireUnitAccess(mockHandler);
    const data = { unit_id: 123 };

    await guardedHandler(mockSocket as AuthenticatedSocket, data);

    expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid unit_id' });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should emit error when unit belongs to different organization', async () => {
    mockFindById.mockResolvedValue(null);
    const guardedHandler = requireUnitAccess(mockHandler);
    const data = { unit_id: 'unit-abc' };

    await guardedHandler(mockSocket as AuthenticatedSocket, data);

    expect(mockFindById).toHaveBeenCalledWith('unit-abc', 'org-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Unit not found or access denied' });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should call inner handler when unit is valid and owned by organization', async () => {
    const mockUnit = {
      id: 'unit-abc',
      organizationId: 'org-123',
      unitName: 'Warehouse A',
      unitType: 'warehouse',
      status: 'LIVE',
      createdAt: new Date(),
    };
    mockFindById.mockResolvedValue(mockUnit);
    const guardedHandler = requireUnitAccess(mockHandler);
    const data = { unit_id: 'unit-abc' };

    await guardedHandler(mockSocket as AuthenticatedSocket, data);

    expect(mockFindById).toHaveBeenCalledWith('unit-abc', 'org-123');
    expect(mockHandler).toHaveBeenCalledWith(mockSocket, data);
    expect(mockSocket.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('should emit error when repository throws exception', async () => {
    mockFindById.mockRejectedValue(new Error('DB connection failed'));
    const guardedHandler = requireUnitAccess(mockHandler);
    const data = { unit_id: 'unit-abc' };

    await guardedHandler(mockSocket as AuthenticatedSocket, data);

    expect(mockFindById).toHaveBeenCalledWith('unit-abc', 'org-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Internal server error' });
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
