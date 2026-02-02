import type { FastifyReply, FastifyRequest } from 'fastify';

import { LocationTagsRepository } from '../../warehouse/location-tags/repository.js';
import { AssetsRepository } from './repository.js';
import type { AssetQueryInput, CreateAssetInput, MoveAssetInput, UpdateAssetInput } from './schemas.js';

export type AssetParams = { assetId: string };

export class AssetsService {
  constructor(
    private readonly repository = new AssetsRepository(),
    private readonly locationTagsRepository = new LocationTagsRepository(),
  ) {}

  async list(
    request: FastifyRequest<{ Querystring: AssetQueryInput }>,
    reply: FastifyReply,
  ) {
    const result = await this.repository.list(request.user.organizationId, request.query ?? {});
    reply.send(result);
  }

  async get(
    request: FastifyRequest<{ Params: AssetParams }>,
    reply: FastifyReply,
  ) {
    const asset = await this.repository.findById(request.params.assetId, request.user.organizationId);
    if (!asset) {
      return reply.code(404).send({ error: 'Asset not found' });
    }
    reply.send(asset);
  }

  private async ensureLocation(tagId: string | null | undefined, organizationId: string, reply: FastifyReply) {
    if (!tagId) {
      return true;
    }

    const tag = await this.locationTagsRepository.findById(tagId, organizationId);
    if (!tag) {
      reply.code(404).send({ error: 'Location tag not found' });
      return false;
    }
    return true;
  }

  async create(
    request: FastifyRequest<{ Body: CreateAssetInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    if (request.body.locationTagId) {
      const ok = await this.ensureLocation(request.body.locationTagId, orgId, reply);
      if (!ok) return;
    }

    const asset = await this.repository.create({
      assetName: request.body.assetName,
      assetType: request.body.assetType,
      locationTagId: request.body.locationTagId ?? null,
      organizationId: orgId,
    });

    reply.code(201).send(asset);
  }

  async update(
    request: FastifyRequest<{ Params: AssetParams; Body: UpdateAssetInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    const existing = await this.repository.findById(request.params.assetId, orgId);
    if (!existing) {
      return reply.code(404).send({ error: 'Asset not found' });
    }

    if (request.body.locationTagId !== undefined) {
      const ok = await this.ensureLocation(request.body.locationTagId, orgId, reply);
      if (!ok) return;
    }

    const updated = await this.repository.update(request.params.assetId, orgId, {
      assetName: request.body.assetName ?? existing.assetName,
      assetType: request.body.assetType ?? existing.assetType,
      locationTagId:
        request.body.locationTagId !== undefined ? request.body.locationTagId : existing.locationTagId,
    });

    reply.send(updated);
  }

  async remove(
    request: FastifyRequest<{ Params: AssetParams }>,
    reply: FastifyReply,
  ) {
    const deleted = await this.repository.delete(request.params.assetId, request.user.organizationId);
    if (!deleted) {
      return reply.code(404).send({ error: 'Asset not found' });
    }
    reply.code(204).send();
  }

  async move(
    request: FastifyRequest<{ Params: AssetParams; Body: MoveAssetInput }>,
    reply: FastifyReply,
  ) {
    const orgId = request.user.organizationId;
    const asset = await this.repository.findById(request.params.assetId, orgId);
    if (!asset) {
      return reply.code(404).send({ error: 'Asset not found' });
    }

    const ok = await this.ensureLocation(request.body.toLocationTagId, orgId, reply);
    if (!ok) return;

    const updated = await this.repository.update(request.params.assetId, orgId, {
      locationTagId: request.body.toLocationTagId,
    });

    reply.send(updated);
  }
}
