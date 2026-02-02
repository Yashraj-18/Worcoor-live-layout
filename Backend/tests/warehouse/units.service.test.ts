import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UnitsService } from '../../src/modules/warehouse/units/service.js';
import type { UnitsRepository } from '../../src/modules/warehouse/units/repository.js';
import { createMockReply, createMockRequest } from '../helpers/mocks.js';

type UnitsRepositoryMock = {
  findAllByOrganization: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function buildRepository(): UnitsRepositoryMock {
  return {
    findAllByOrganization: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('UnitsService', () => {
  let repository: UnitsRepositoryMock;
  let service: UnitsService;

  beforeEach(() => {
    repository = buildRepository();
    service = new UnitsService(repository as unknown as UnitsRepository);
  });

  it('lists units scoped to organization', async () => {
    repository.findAllByOrganization.mockResolvedValue([
      { id: 'unit-1', unitName: 'Main', organizationId: 'org-1' },
    ] as never);

    const reply = createMockReply();
    const request = createMockRequest({ user: { organizationId: 'org-1' } });

    await service.list(request, reply);

    expect(repository.findAllByOrganization).toHaveBeenCalledWith('org-1');
    expect(reply.payload).toEqual([{ id: 'unit-1', unitName: 'Main', organizationId: 'org-1' }]);
  });

  it('creates unit while injecting organization id', async () => {
    repository.create.mockResolvedValue({
      id: 'unit-2',
      unitName: 'Secondary',
      description: null,
      organizationId: 'org-1',
    } as never);

    const reply = createMockReply();
    const request = createMockRequest({
      body: { unitName: 'Secondary', unitType: 'warehouse', status: 'LIVE' as const },
      user: { organizationId: 'org-1' },
    });

    await service.create(request, reply);

    expect(repository.create).toHaveBeenCalledWith({
      unitName: 'Secondary',
      unitType: 'warehouse',
      status: 'LIVE',
      description: null,
      organizationId: 'org-1',
    });
    expect(reply.statusCode).toBe(201);
  });

  it('returns 404 when updating missing unit', async () => {
    repository.update.mockResolvedValue(null);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { unitId: 'unit-missing' },
      body: { unitName: 'Updated' },
      user: { organizationId: 'org-1' },
    });

    await service.update(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Unit not found' });
  });

  it('returns 404 when deleting missing unit', async () => {
    repository.delete.mockResolvedValue(false);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { unitId: 'unit-missing' },
      user: { organizationId: 'org-1' },
    });

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Unit not found' });
  });
});
