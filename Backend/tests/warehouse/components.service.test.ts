import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ComponentsService } from '../../src/modules/warehouse/components/service.js';
import type { ComponentsRepository } from '../../src/modules/warehouse/components/repository.js';
import { createMockRequest, createMockReply } from '../helpers/mocks.js';

type ComponentsRepositoryMock = {
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function buildRepository(): ComponentsRepositoryMock {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe('ComponentsService', () => {
  let repository: ComponentsRepositoryMock;
  let service: ComponentsService;

  beforeEach(() => {
    repository = buildRepository();
    service = new ComponentsService(repository as unknown as ComponentsRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const spyLayoutAccess = () =>
    vi.spyOn(
      service as unknown as {
        assertLayoutAccess: (layoutId: string, organizationId: string) => Promise<any>;
      },
      'assertLayoutAccess',
    );

  const spyLocationTagAccess = () =>
    vi.spyOn(
      service as unknown as {
        assertLocationTagAccess: (
          locationTagId: string,
          organizationId: string,
          unitId?: string,
        ) => Promise<any>;
      },
      'assertLocationTagAccess',
    );

  it('creates component when layout exists and location tag valid', async () => {
    const layoutSpy = spyLayoutAccess();
    layoutSpy.mockResolvedValue({ id: 'layout-1', unitId: 'unit-1' });
    const tagSpy = spyLocationTagAccess();
    tagSpy.mockResolvedValue({ id: 'tag-1' });
    repository.create.mockResolvedValue({
      id: 'component-1',
      layoutId: 'layout-1',
      organizationId: 'org-1',
    } as never);

    const request = createMockRequest({
      params: { layoutId: 'layout-1' },
      body: {
        componentType: 'vertical_rack',
        displayName: 'Rack A',
        positionX: 10,
        positionY: 20,
        width: 100,
        height: 40,
        locationTagId: 'tag-1',
      },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.create(request, reply);

    expect(layoutSpy).toHaveBeenCalledWith('layout-1', 'org-1');
    expect(tagSpy).toHaveBeenCalledWith('tag-1', 'org-1', 'unit-1');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutId: 'layout-1',
        organizationId: 'org-1',
        locationTagId: 'tag-1',
      }),
    );
    expect(reply.statusCode).toBe(201);
  });

  it('returns 404 when layout not found during create', async () => {
    const layoutSpy = spyLayoutAccess();
    layoutSpy.mockResolvedValue(null);
    const request = createMockRequest({
      params: { layoutId: 'layout-missing' },
      body: {
        componentType: 'desk',
        displayName: 'Desk 1',
        positionX: 0,
        positionY: 0,
        width: 10,
        height: 10,
      },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.create(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Layout not found' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns 404 when location tag lookup fails during create', async () => {
    const layoutSpy = spyLayoutAccess();
    layoutSpy.mockResolvedValue({ id: 'layout-1', unitId: 'unit-1' });
    const tagSpy = spyLocationTagAccess();
    tagSpy.mockResolvedValue(null);

    const request = createMockRequest({
      params: { layoutId: 'layout-1' },
      body: {
        componentType: 'desk',
        displayName: 'Desk 1',
        positionX: 0,
        positionY: 0,
        width: 10,
        height: 10,
        locationTagId: 'missing-tag',
      },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.create(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Location tag not found' });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns 404 when updating missing component', async () => {
    repository.findById.mockResolvedValue(null);
    const request = createMockRequest({
      params: { componentId: 'missing' },
      body: { displayName: 'Updated' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.update(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Component not found' });
  });

  it('updates component and clears location tag when null provided', async () => {
    repository.findById.mockResolvedValue({
      id: 'component-1',
      organizationId: 'org-1',
    } as never);
    repository.update.mockResolvedValue({
      id: 'component-1',
      locationTagId: null,
    } as never);

    const request = createMockRequest({
      params: { componentId: 'component-1' },
      body: { locationTagId: null },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.update(request, reply);

    expect(repository.update).toHaveBeenCalledWith('component-1', 'org-1', { locationTagId: null });
    expect(reply.payload).toEqual({ id: 'component-1', locationTagId: null });
  });

  it('requires valid location tag when updating to a new tag', async () => {
    repository.findById.mockResolvedValue({
      id: 'component-1',
      organizationId: 'org-1',
    } as never);
    const tagSpy = spyLocationTagAccess();
    tagSpy.mockResolvedValue({ id: 'tag-1' });
    repository.update.mockResolvedValue({ id: 'component-1', locationTagId: 'tag-1' } as never);

    const request = createMockRequest({
      params: { componentId: 'component-1' },
      body: { locationTagId: 'tag-1' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.update(request, reply);

    expect(tagSpy).toHaveBeenCalledWith('tag-1', 'org-1');
    expect(repository.update).toHaveBeenCalledWith('component-1', 'org-1', {
      locationTagId: 'tag-1',
    });
  });

  it('returns 404 when deleting missing component', async () => {
    repository.delete.mockResolvedValue(false);
    const request = createMockRequest({
      params: { componentId: 'missing' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.remove(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Component not found' });
  });

  it('returns 404 when component not found during location tag update', async () => {
    repository.findById.mockResolvedValue(null);
    const request = createMockRequest({
      params: { componentId: 'missing' },
      body: { locationTagId: 'tag-1' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.updateLocationTag(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Component not found' });
  });

  it('returns 404 when layout not found while updating location tag', async () => {
    repository.findById.mockResolvedValue({
      id: 'component-1',
      layoutId: 'layout-1',
      organizationId: 'org-1',
    } as never);
    const layoutSpy = spyLayoutAccess();
    layoutSpy.mockResolvedValue(null);

    const request = createMockRequest({
      params: { componentId: 'component-1' },
      body: { locationTagId: 'tag-1' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.updateLocationTag(request, reply);

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ error: 'Layout not found for component' });
  });

  it('updates location tag when layout and tag are valid', async () => {
    repository.findById.mockResolvedValue({
      id: 'component-1',
      layoutId: 'layout-1',
      organizationId: 'org-1',
    } as never);
    const layoutSpy = spyLayoutAccess();
    layoutSpy.mockResolvedValue({ id: 'layout-1', unitId: 'unit-1' });
    const tagSpy = spyLocationTagAccess();
    tagSpy.mockResolvedValue({ id: 'tag-1' });
    repository.update.mockResolvedValue({
      id: 'component-1',
      locationTagId: 'tag-1',
    } as never);

    const request = createMockRequest({
      params: { componentId: 'component-1' },
      body: { locationTagId: 'tag-1' },
      user: { organizationId: 'org-1' },
    });
    const reply = createMockReply();

    await service.updateLocationTag(request, reply);

    expect(layoutSpy).toHaveBeenCalledWith('layout-1', 'org-1');
    expect(tagSpy).toHaveBeenCalledWith('tag-1', 'org-1', 'unit-1');
    expect(repository.update).toHaveBeenCalledWith('component-1', 'org-1', {
      locationTagId: 'tag-1',
    });
    expect(reply.payload).toEqual({ id: 'component-1', locationTagId: 'tag-1' });
  });
});
