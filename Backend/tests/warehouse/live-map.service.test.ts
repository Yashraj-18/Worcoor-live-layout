import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LiveMapService } from '../../src/modules/warehouse/live-map/service.js';
import type { LiveMapRepository } from '../../src/modules/warehouse/live-map/repository.js';
import { createMockReply, createMockRequest } from '../helpers/mocks.js';

type LiveMapRepositoryMock = {
  getUnitWithLayouts: ReturnType<typeof vi.fn>;
  getLayoutComponents: ReturnType<typeof vi.fn>;
  getLocationTagSkus: ReturnType<typeof vi.fn>;
  getSkusForLocationTags: ReturnType<typeof vi.fn>;
  calculateUtilization: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
};

function buildRepository(): LiveMapRepositoryMock {
  return {
    getUnitWithLayouts: vi.fn(),
    getLayoutComponents: vi.fn(),
    getLocationTagSkus: vi.fn(),
    getSkusForLocationTags: vi.fn(),
    calculateUtilization: vi.fn(),
    search: vi.fn(),
  };
}

describe('LiveMapService', () => {
  let repository: LiveMapRepositoryMock;
  let service: LiveMapService;

  beforeEach(() => {
    repository = buildRepository();
    service = new LiveMapService(repository as unknown as LiveMapRepository);
  });

  describe('getLiveMap', () => {
    it('returns 404 when unit not found', async () => {
      repository.getUnitWithLayouts.mockResolvedValue(null);

      const reply = createMockReply();
      const request = createMockRequest({
        params: { unitId: 'unit-1' },
      });

      await service.getLiveMap(request, reply);

      expect(reply.statusCode).toBe(404);
      expect(reply.payload).toEqual({ error: 'Unit not found' });
    });

    it('returns live map with layouts and components', async () => {
      repository.getUnitWithLayouts.mockResolvedValue({
        unit: { id: 'unit-1', unitName: 'Warehouse A', status: 'active' },
        layouts: [{ id: 'layout-1', layoutName: 'Floor 1' }],
      });
      repository.getLayoutComponents.mockResolvedValue([
        {
          id: 'comp-1',
          componentType: 'rack',
          displayName: 'Rack A',
          positionX: 10,
          positionY: 20,
          width: 100,
          height: 50,
          color: '#333',
          locationTagId: 'tag-1',
          locationTagName: 'Zone A',
          capacity: 100,
        },
      ]);
      repository.getSkusForLocationTags.mockResolvedValue([
        { id: 'sku-1', skuName: 'Item 1', quantity: '25', skuUnit: 'pcs', locationTagId: 'tag-1' },
      ]);
      repository.calculateUtilization.mockResolvedValue({
        totalCapacity: 100,
        totalItems: 25,
        utilizationPercentage: 25,
      });

      const reply = createMockReply();
      const request = createMockRequest({
        params: { unitId: 'unit-1' },
      });

      await service.getLiveMap(request, reply);

      expect(repository.getUnitWithLayouts).toHaveBeenCalledWith('unit-1', 'org-1');
      expect(reply.payload.unit.unitName).toBe('Warehouse A');
      expect(reply.payload.unit.utilizationPercentage).toBe(25);
      expect(reply.payload.layouts).toHaveLength(1);
      expect(reply.payload.layouts[0].components[0].locationTag.currentItems).toBe(25);
      expect(reply.payload.layouts[0].components[0].locationTag.utilizationPercentage).toBe(25);
    });

    it('handles components without location tags', async () => {
      repository.getUnitWithLayouts.mockResolvedValue({
        unit: { id: 'unit-1', unitName: 'Warehouse A', status: 'active' },
        layouts: [{ id: 'layout-1', layoutName: 'Floor 1' }],
      });
      repository.getLayoutComponents.mockResolvedValue([
        {
          id: 'comp-1',
          componentType: 'pathway',
          displayName: 'Aisle 1',
          positionX: 0,
          positionY: 0,
          width: 50,
          height: 200,
          color: '#999',
          locationTagId: null,
          locationTagName: null,
          capacity: null,
        },
      ]);
      repository.getSkusForLocationTags.mockResolvedValue([]);
      repository.calculateUtilization.mockResolvedValue({
        totalCapacity: 0,
        totalItems: 0,
        utilizationPercentage: 0,
      });

      const reply = createMockReply();
      const request = createMockRequest({
        params: { unitId: 'unit-1' },
      });

      await service.getLiveMap(request, reply);

      expect(reply.payload.layouts[0].components[0].locationTag).toBeNull();
    });
  });

  describe('search', () => {
    it('returns 400 when query too short', async () => {
      const reply = createMockReply();
      const request = createMockRequest({
        params: { unitId: 'unit-1' },
        query: { q: 'a' },
      });

      await service.search(request, reply);

      expect(reply.statusCode).toBe(400);
      expect(reply.payload).toEqual({ error: 'Search query must be at least 2 characters' });
    });

    it('returns search results for locations and SKUs', async () => {
      repository.search.mockResolvedValue([
        { type: 'location', id: 'tag-1', name: 'Zone A', componentId: 'comp-1' },
        { type: 'sku', id: 'sku-1', name: 'Steel Beam', locationTagId: 'tag-1' },
      ]);

      const reply = createMockReply();
      const request = createMockRequest({
        params: { unitId: 'unit-1' },
        query: { q: 'steel' },
      });

      await service.search(request, reply);

      expect(repository.search).toHaveBeenCalledWith('unit-1', 'org-1', 'steel');
      expect(reply.payload.results).toHaveLength(2);
    });
  });
});
