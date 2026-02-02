import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { layouts, locationTags } from '../../../database/schema/index.js';
import { ComponentsRepository } from './repository.js';
import type {
  CreateComponentInput,
  UpdateComponentInput,
  UpdateLocationTagInput,
} from './schemas.js';

type LayoutParams = { layoutId: string };
type ComponentParams = { componentId: string };

export class ComponentsService {
  constructor(private readonly repository = new ComponentsRepository()) {}

  private async assertLayoutAccess(layoutId: string, organizationId: string) {
    const result = await db
      .select()
      .from(layouts)
      .where(and(eq(layouts.id, layoutId), eq(layouts.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
  }

  private async assertLocationTagAccess(
    locationTagId: string,
    organizationId: string,
    unitId?: string,
  ) {
    const result = await db
      .select()
      .from(locationTags)
      .where(and(eq(locationTags.id, locationTagId), eq(locationTags.organizationId, organizationId)))
      .limit(1);

    const tag = result[0];
    if (!tag) {
      return null;
    }

    if (unitId && tag.unitId !== unitId) {
      throw new Error('Location tag belongs to a different unit');
    }

    return tag;
  }

  async create(
    request: FastifyRequest<{ Params: LayoutParams; Body: CreateComponentInput }>,
    reply: FastifyReply,
  ) {
    const { layoutId } = request.params;
    const orgId = request.user.organizationId;
    const layout = await this.assertLayoutAccess(layoutId, orgId);

    if (!layout) {
      return reply.code(404).send({ error: 'Layout not found' });
    }

    if (request.body.locationTagId) {
      const tag = await this.assertLocationTagAccess(
        request.body.locationTagId,
        orgId,
        layout.unitId,
      );
      if (!tag) {
        return reply.code(404).send({ error: 'Location tag not found' });
      }
    }

    const component = await this.repository.create({
      ...request.body,
      color: request.body.color ?? null,
      locationTagId: request.body.locationTagId ?? null,
      organizationId: orgId,
      layoutId,
    });

    reply.code(201).send(component);
  }

  async update(
    request: FastifyRequest<{ Params: ComponentParams; Body: UpdateComponentInput }>,
    reply: FastifyReply,
  ) {
    const { componentId } = request.params;
    const orgId = request.user.organizationId;
    const existing = await this.repository.findById(componentId, orgId);

    if (!existing) {
      return reply.code(404).send({ error: 'Component not found' });
    }

    if (request.body.locationTagId !== undefined) {
      if (request.body.locationTagId) {
        await this.assertLocationTagAccess(request.body.locationTagId, orgId);
      } else {
        request.body.locationTagId = null;
      }
    }

    const updated = await this.repository.update(componentId, orgId, request.body);
    reply.send(updated);
  }

  async remove(
    request: FastifyRequest<{ Params: ComponentParams }>,
    reply: FastifyReply,
  ) {
    const { componentId } = request.params;
    const orgId = request.user.organizationId;
    const deleted = await this.repository.delete(componentId, orgId);

    if (!deleted) {
      return reply.code(404).send({ error: 'Component not found' });
    }

    reply.code(204).send();
  }

  async updateLocationTag(
    request: FastifyRequest<{ Params: ComponentParams; Body: UpdateLocationTagInput }>,
    reply: FastifyReply,
  ) {
    const { componentId } = request.params;
    const orgId = request.user.organizationId;
    const component = await this.repository.findById(componentId, orgId);

    if (!component) {
      return reply.code(404).send({ error: 'Component not found' });
    }

    if (request.body.locationTagId) {
      const layout = await this.assertLayoutAccess(component.layoutId, orgId);
      if (!layout) {
        return reply.code(404).send({ error: 'Layout not found for component' });
      }

      await this.assertLocationTagAccess(request.body.locationTagId, orgId, layout.unitId);
    }

    const updated = await this.repository.update(componentId, orgId, {
      locationTagId: request.body.locationTagId ?? null,
    });

    reply.send(updated);
  }
}
