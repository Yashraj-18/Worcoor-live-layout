import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SkusService } from '../../src/modules/inventory/skus/service.js';
import type { SkusRepository } from '../../src/modules/inventory/skus/repository.js';
import type { LocationTagsRepository } from '../../src/modules/warehouse/location-tags/repository.js';
import type { SkuMovementsRepository } from '../../src/modules/inventory/sku-movements/repository.js';
import { createMockReply, createMockRequest } from '../helpers/mocks.js';

type SkusRepositoryMock = {
  list: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

type LocationTagsRepositoryMock = {
  findById: ReturnType<typeof vi.fn>;
  getUsage: ReturnType<typeof vi.fn>;
};

type SkuMovementsRepositoryMock = {
  logMovement: ReturnType<typeof vi.fn>;
  getHistory: ReturnType<typeof vi.fn>;
};

function buildRepositories() {
  const skusRepository: SkusRepositoryMock = {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const locationTagsRepository: LocationTagsRepositoryMock = {
    findById: vi.fn(),
    getUsage: vi.fn(),
  };

  const movementsRepository: SkuMovementsRepositoryMock = {
    logMovement: vi.fn(),
    getHistory: vi.fn(),
  };

  return { skusRepository, locationTagsRepository, movementsRepository };
}

describe('SkusService', () => {
  let skusRepository: SkusRepositoryMock;
  let locationTagsRepository: LocationTagsRepositoryMock;
  let movementsRepository: SkuMovementsRepositoryMock;
  let service: SkusService;

  beforeEach(() => {
    const repos = buildRepositories();
    skusRepository = repos.skusRepository;
    locationTagsRepository = repos.locationTagsRepository;
    movementsRepository = repos.movementsRepository;

    service = new SkusService(
      skusRepository as unknown as SkusRepository,
      locationTagsRepository as unknown as LocationTagsRepository,
      movementsRepository as unknown as SkuMovementsRepository,
    );
  });

  it('lists SKUs with pagination metadata', async () => {
    skusRepository.list.mockResolvedValue({
      items: [
        {
          id: 'sku-1',
          skuName: 'Steel Beam',
          skuCategory: 'raw',
          skuUnit: 'pieces',
          quantity: '10',
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
    });

    const reply = createMockReply();
    const request = createMockRequest({
      query: { limit: 20, offset: 0 },
    });

    await service.list(request, reply);

    expect(skusRepository.list).toHaveBeenCalledWith('org-1', { limit: 20, offset: 0 });
    expect(reply.payload.items[0].quantity).toBe(10);
  });

  it('creates SKU after validating capacity', async () => {
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-1', capacity: 100 });
    locationTagsRepository.getUsage.mockResolvedValue(25);
    skusRepository.create.mockResolvedValue({
      id: 'sku-1',
      skuName: 'Steel Beam',
      skuCategory: 'raw',
      skuUnit: 'pieces',
      quantity: '50',
      organizationId: 'org-1',
    });

    const reply = createMockReply();
    const request = createMockRequest({
      body: {
        skuName: 'Steel Beam',
        skuCategory: 'raw',
        skuUnit: 'pieces',
        quantity: 50,
        effectiveDate: '2024-01-01',
        expiryDate: null,
        locationTagId: 'tag-1',
      },
    });

    await service.create(request, reply);

    expect(locationTagsRepository.getUsage).toHaveBeenCalledWith('tag-1', 'org-1', undefined);
    expect(skusRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        skuName: 'Steel Beam',
        quantity: '50',
        organizationId: 'org-1',
      }),
    );
    expect(reply.statusCode).toBe(201);
  });

  it('prevents create when capacity exceeded', async () => {
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-1', capacity: 60 });
    locationTagsRepository.getUsage.mockResolvedValue(50);

    const reply = createMockReply();
    const request = createMockRequest({
      body: {
        skuName: 'Steel Beam',
        skuCategory: 'raw',
        skuUnit: 'pieces',
        quantity: 20,
        effectiveDate: '2024-01-01',
        locationTagId: 'tag-1',
      },
    });

    await service.create(request, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ error: 'Location tag capacity exceeded' });
    expect(skusRepository.create).not.toHaveBeenCalled();
  });

  it('returns 404 when updating missing SKU', async () => {
    skusRepository.findById.mockResolvedValue(null);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { skuId: 'missing' },
      body: { skuName: 'updated' },
    });

    await service.update(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'SKU not found' });
  });

  it('updates SKU and validates capacity when location changes', async () => {
    skusRepository.findById.mockResolvedValue({
      id: 'sku-1',
      skuName: 'Steel Beam',
      skuCategory: 'raw',
      skuUnit: 'pieces',
      quantity: '30',
      locationTagId: 'tag-1',
      effectiveDate: '2024-01-01',
    });
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-2', capacity: 200 });
    locationTagsRepository.getUsage.mockResolvedValue(20);
    skusRepository.update.mockResolvedValue({ id: 'sku-1', quantity: '45', locationTagId: 'tag-2' });

    const reply = createMockReply();
    const request = createMockRequest({
      params: { skuId: 'sku-1' },
      body: { quantity: 45, locationTagId: 'tag-2' },
    });

    await service.update(request, reply);

    expect(locationTagsRepository.getUsage).toHaveBeenCalledWith('tag-2', 'org-1', 'sku-1');
    expect(skusRepository.update).toHaveBeenCalledWith(
      'sku-1',
      'org-1',
      expect.objectContaining({ quantity: '45', locationTagId: 'tag-2' }),
    );
  });

  it('deletes SKU and returns 204', async () => {
    skusRepository.delete.mockResolvedValue(true);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { skuId: 'sku-1' },
    });

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(204);
  });

  it('returns 404 when delete target missing', async () => {
    skusRepository.delete.mockResolvedValue(false);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { skuId: 'missing' },
    });

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'SKU not found' });
  });

  it('moves SKU and logs movement', async () => {
    skusRepository.findById.mockResolvedValue({
      id: 'sku-1',
      quantity: '15',
      locationTagId: 'tag-1',
    });
    locationTagsRepository.findById.mockResolvedValue({ id: 'tag-2', capacity: 200 });
    locationTagsRepository.getUsage.mockResolvedValue(50);
    skusRepository.update.mockResolvedValue({
      id: 'sku-1',
      quantity: '15',
      locationTagId: 'tag-2',
    });

    const reply = createMockReply();
    const request = createMockRequest({
      params: { skuId: 'sku-1' },
      body: { toLocationTagId: 'tag-2' },
    });

    await service.move(request, reply);

    expect(movementsRepository.logMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        skuId: 'sku-1',
        fromLocationTagId: 'tag-1',
        toLocationTagId: 'tag-2',
      }),
    );
  });

  it('returns history for SKU', async () => {
    movementsRepository.getHistory.mockResolvedValue([{ id: 'move-1' }]);
    const reply = createMockReply();
    const request = createMockRequest({
      params: { skuId: 'sku-1' },
    });

    await service.history(request, reply);

    expect(movementsRepository.getHistory).toHaveBeenCalledWith('sku-1', 'org-1');
    expect(reply.payload).toEqual({ movements: [{ id: 'move-1' }] });
  });
});
