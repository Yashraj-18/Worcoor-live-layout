import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LocationTagsService } from '../../src/modules/warehouse/location-tags/service.js';
import type { LocationTagsRepository } from '../../src/modules/warehouse/location-tags/repository.js';
import { createMockRequest, createMockReply } from '../helpers/mocks.js';

type LocationTagsRepositoryMock = {
  findAllByUnit: ReturnType<typeof vi.fn>;
  getUsage: ReturnType<typeof vi.fn>;
  findByName: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

function buildRepository(): LocationTagsRepositoryMock {
  return {
    findAllByUnit: vi.fn(),
    getUsage: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
}

describe('LocationTagsService', () => {
  let repository: LocationTagsRepositoryMock;
  let service: LocationTagsService;

  beforeEach(() => {
    repository = buildRepository();
    service = new LocationTagsService(repository as unknown as LocationTagsRepository);
  });

  it('lists tags with usage and utilization', async () => {
    repository.findAllByUnit.mockResolvedValue([
      {
        id: 'tag-1',
        unitId: 'unit-1',
        organizationId: 'org-1',
        locationTagName: 'RACK-A-01',
        capacity: 200,
      },
    ] as never);
    repository.getUsage.mockResolvedValue(80);

    const request = createMockRequest({
      params: { unitId: 'unit-1' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.list(request, reply);

    expect(repository.findAllByUnit).toHaveBeenCalledWith('unit-1', 'org-1');
    expect(repository.getUsage).toHaveBeenCalledWith('tag-1', 'org-1');
    expect(reply.payload).toEqual([
      expect.objectContaining({
        id: 'tag-1',
        currentItems: 80,
        utilizationPercentage: 40,
      }),
    ]);
  });

  it('prevents creating duplicate location tag names', async () => {
    repository.findByName.mockResolvedValue({ id: 'tag-1' });

    const request = createMockRequest({
      body: { unitId: 'unit-1', locationTagName: 'RACK-A-01', capacity: 100 },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.create(request, reply);

    expect(reply.statusCode).toBe(409);
    expect(reply.payload).toEqual({ error: 'Location tag name already in use' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates tag when name is unique', async () => {
    repository.findByName.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 'tag-new',
      unitId: 'unit-1',
      locationTagName: 'RACK-B-02',
      organizationId: 'org-1',
      capacity: 150,
    } as never);

    const request = createMockRequest({
      body: { unitId: 'unit-1', locationTagName: 'RACK-B-02', capacity: 150 },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.create(request, reply);

    expect(repository.create).toHaveBeenCalledWith({
      unitId: 'unit-1',
      locationTagName: 'RACK-B-02',
      capacity: 150,
      organizationId: 'org-1',
    });
    expect(reply.statusCode).toBe(201);
  });

  it('prevents updating to duplicate location tag names', async () => {
    repository.findByName.mockResolvedValue({ id: 'other-tag' });

    const request = createMockRequest({
      params: { locationTagId: 'tag-1' },
      body: { locationTagName: 'RACK-A-01' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.update(request, reply);

    expect(reply.statusCode).toBe(409);
    expect(reply.payload).toEqual({ error: 'Location tag name already in use' });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns 404 when tag to update is missing', async () => {
    repository.findByName.mockResolvedValue(null);
    repository.update.mockResolvedValue(null);

    const request = createMockRequest({
      params: { locationTagId: 'tag-missing' },
      body: { capacity: 250 },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.update(request, reply);

    expect(repository.update).toHaveBeenCalledWith('tag-missing', 'org-1', { capacity: 250 });
    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Location tag not found' });
  });
});
