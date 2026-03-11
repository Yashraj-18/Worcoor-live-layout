import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AssetsService, type AssetParams } from '../../src/modules/inventory/assets/service.js';
import type { AssetsRepository } from '../../src/modules/inventory/assets/repository.js';
import type { LocationTagsRepository } from '../../src/modules/warehouse/location-tags/repository.js';
import { createMockReply, createMockRequest } from '../helpers/mocks.js';

type AssetsRepositoryMock = {
  list: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

type LocationTagsRepositoryMock = {
  findById: ReturnType<typeof vi.fn>;
};

function buildRepositories() {
  const assetsRepository: AssetsRepositoryMock = {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const locationTagsRepository: LocationTagsRepositoryMock = {
    findById: vi.fn(),
  };

  return { assetsRepository, locationTagsRepository };
}

describe('AssetsService', () => {
  let assetsRepository: AssetsRepositoryMock;
  let locationTagsRepository: LocationTagsRepositoryMock;
  let service: AssetsService;

  beforeEach(() => {
    const repos = buildRepositories();
    assetsRepository = repos.assetsRepository;
    locationTagsRepository = repos.locationTagsRepository;

    service = new AssetsService(
      assetsRepository as unknown as AssetsRepository,
      locationTagsRepository as unknown as LocationTagsRepository,
    );
  });

  it('lists assets', async () => {
    assetsRepository.list.mockResolvedValue({
      items: [{ id: 'asset-1', assetName: 'Forklift' }],
      pagination: { total: 1, limit: 50, offset: 0 },
    });

    const reply = createMockReply();
    const request = createMockRequest({
      query: { search: 'Forklift' },
    });

    await service.list(request, reply);

    expect(assetsRepository.list).toHaveBeenCalledWith('org-1', { search: 'Forklift' });
    expect(reply.payload.items[0].assetName).toBe('Forklift');
  });

  it('creates asset after verifying location tag exists', async () => {
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-1' });
    assetsRepository.create.mockResolvedValue({
      id: 'asset-1',
      assetName: 'Forklift',
      assetType: 'vehicle',
      organizationId: 'org-1',
    } as never);

    const reply = createMockReply();
    const request = createMockRequest({
      body: { assetName: 'Forklift', assetType: 'vehicle', locationTagId: 'tag-1' },
    });

    await service.create(request, reply);

    expect(assetsRepository.create).toHaveBeenCalledWith({
      assetName: 'Forklift',
      assetType: 'vehicle',
      locationTagId: 'tag-1',
      assetId: null,
      organizationId: 'org-1',
    });
    expect(reply.statusCode).toBe(201);
  });

  it('rejects create when location tag missing', async () => {
    locationTagsRepository.findById.mockResolvedValue(null);
    const reply = createMockReply();
    const request = createMockRequest({
      body: { assetName: 'Forklift', assetType: 'vehicle', locationTagId: 'tag-missing' },
    });

    await service.create(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Location tag not found' });
    expect(assetsRepository.create).not.toHaveBeenCalled();
  });

  it('updates asset, verifying new location tag if provided', async () => {
    assetsRepository.findById.mockResolvedValue({
      id: 'asset-1',
      assetName: 'Forklift',
      assetType: 'vehicle',
      locationTagId: 'tag-1',
    } as never);
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-2' });
    assetsRepository.update.mockResolvedValue({
      id: 'asset-1',
      assetName: 'Forklift',
      assetType: 'vehicle',
      locationTagId: 'tag-2',
    } as never);

    const reply = createMockReply();
    const request = createMockRequest({
      params: { assetId: 'asset-1' },
      body: { locationTagId: 'tag-2' },
    });

    await service.update(request, reply);

    expect(locationTagsRepository.findById).toHaveBeenCalledWith('tag-2', 'org-1');
    expect(assetsRepository.update).toHaveBeenCalledWith(
      'asset-1',
      'org-1',
      expect.objectContaining({ locationTagId: 'tag-2' }),
    );
  });

  it('returns 404 when updating missing asset', async () => {
    assetsRepository.findById.mockResolvedValue(null);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { assetId: 'missing' },
      body: { assetName: 'Updated' },
    });

    await service.update(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Asset not found' });
  });

  it('deletes asset', async () => {
    assetsRepository.delete.mockResolvedValue(true);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { assetId: 'asset-1' },
    });

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(204);
  });

  it('returns 404 when deleting missing asset', async () => {
    assetsRepository.delete.mockResolvedValue(false);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { assetId: 'missing' },
    });

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Asset not found' });
  });

  it('moves asset to a new location tag', async () => {
    assetsRepository.findById.mockResolvedValue({
      id: 'asset-1',
      locationTagId: 'tag-1',
    } as never);
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-2' });
    assetsRepository.update.mockResolvedValue({
      id: 'asset-1',
      locationTagId: 'tag-2',
    } as never);

    const reply = createMockReply();
    const request = createMockRequest({
      params: { assetId: 'asset-1' },
      body: { toLocationTagId: 'tag-2' },
    });

    await service.move(request, reply);

    expect(assetsRepository.update).toHaveBeenCalledWith('asset-1', 'org-1', {
      locationTagId: 'tag-2',
    });
  });
});
