import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LayoutsService } from '../../src/modules/warehouse/layouts/service.js';
import type { LayoutsRepository } from '../../src/modules/warehouse/layouts/repository.js';
import { createMockRequest, createMockReply } from '../helpers/mocks.js';

type LayoutsRepositoryMock = {
  findAllByUnit: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function buildRepository(): LayoutsRepositoryMock {
  return {
    findAllByUnit: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('LayoutsService', () => {
  let repository: LayoutsRepositoryMock;
  let service: LayoutsService;

  beforeEach(() => {
    repository = buildRepository();
    service = new LayoutsService(repository as unknown as LayoutsRepository);
  });

  it('lists layouts for unit scoped to org', async () => {
    repository.findAllByUnit.mockResolvedValue([
      { id: 'layout-1', layoutName: 'Ground Floor', organizationId: 'org-1' },
    ] as never);
    const request = createMockRequest({ params: { unitId: 'unit-1' }, user: { organizationId: 'org-1' } });
    const reply = createMockReply();

    await service.list(request, reply);

    expect(repository.findAllByUnit).toHaveBeenCalledWith('unit-1', 'org-1');
    expect(reply.payload).toEqual([
      { id: 'layout-1', layoutName: 'Ground Floor', organizationId: 'org-1' },
    ]);
  });

  it('creates layout with provided unitId and org', async () => {
    repository.create.mockResolvedValue({
      id: 'layout-new',
      layoutName: 'Mezzanine',
      organizationId: 'org-1',
    } as never);

    const request = createMockRequest({
      params: { unitId: 'unit-1' },
      body: { layoutName: 'Mezzanine' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.create(request, reply);

    expect(repository.create).toHaveBeenCalledWith({
      layoutName: 'Mezzanine',
      unitId: 'unit-1',
      organizationId: 'org-1',
    });
    expect(reply.statusCode).toBe(201);
  });

  it('returns 404 when updating missing layout', async () => {
    repository.update.mockResolvedValue(null);
    const request = createMockRequest({
      params: { layoutId: 'layout-missing' },
      body: { layoutName: 'Updated' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.update(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Layout not found' });
  });

  it('returns 404 when deleting missing layout', async () => {
    repository.delete.mockResolvedValue(false);
    const request = createMockRequest({
      params: { layoutId: 'layout-missing' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Layout not found' });
  });
});
