import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SkuMovementsService } from '../../src/modules/inventory/sku-movements/service.js';
import type { SkuMovementsRepository } from '../../src/modules/inventory/sku-movements/repository.js';
import { createMockReply, createMockRequest } from '../helpers/mocks.js';

describe('SkuMovementsService', () => {
  let repository: { list: ReturnType<typeof vi.fn> };
  let service: SkuMovementsService;

  beforeEach(() => {
    repository = {
      list: vi.fn(),
    };
    service = new SkuMovementsService(repository as unknown as SkuMovementsRepository);
  });

  it('returns paginated movement list scoped by organization', async () => {
    const mockResult = {
      items: [
        {
          id: 'move-1',
          skuId: 'sku-1',
          toLocationTagId: 'tag-2',
          movedAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
    };
    repository.list.mockResolvedValue(mockResult);

    const reply = createMockReply();
    const request = createMockRequest({
      query: { skuId: 'sku-1' },
    });

    await service.list(request, reply);

    expect(repository.list).toHaveBeenCalledWith('org-1', { skuId: 'sku-1' });
    expect(reply.payload).toEqual(mockResult);
  });
});
