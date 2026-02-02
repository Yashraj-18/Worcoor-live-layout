import { and, eq, sql, count } from 'drizzle-orm';

import { db } from '../../../config/database.js';
import { units, locationTags, skus } from '../../../database/schema/index.js';

export type UnitEntity = typeof units.$inferSelect;

export type UnitWithUtilization = UnitEntity & {
  totalLocations: number;
  occupiedLocations: number;
  utilizationPercentage: number;
};
export type CreateUnitDto = Omit<UnitEntity, 'id' | 'createdAt'>;
export type UpdateUnitDto = Partial<Omit<CreateUnitDto, 'organizationId'>>;

export class UnitsRepository {
  async findAllByOrganization(organizationId: string): Promise<UnitEntity[]> {
    return db.select().from(units).where(eq(units.organizationId, organizationId));
  }

  async findById(id: string, organizationId: string): Promise<UnitEntity | null> {
    const result = await db
      .select()
      .from(units)
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdWithUtilization(id: string, organizationId: string): Promise<UnitWithUtilization | null> {
    const unit = await this.findById(id, organizationId);
    if (!unit) return null;

    const locationStats = await db
      .select({
        totalLocations: count(locationTags.id),
        occupiedLocations: count(sql`CASE WHEN EXISTS (
          SELECT 1 FROM skus WHERE skus.location_tag_id = ${locationTags.id}
        ) THEN 1 END`),
      })
      .from(locationTags)
      .where(eq(locationTags.unitId, id));

    const stats = locationStats[0] ?? { totalLocations: 0, occupiedLocations: 0 };
    const utilizationPercentage = stats.totalLocations > 0
      ? (Number(stats.occupiedLocations) / Number(stats.totalLocations)) * 100
      : 0;

    return {
      ...unit,
      totalLocations: Number(stats.totalLocations),
      occupiedLocations: Number(stats.occupiedLocations),
      utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
    };
  }

  async create(payload: CreateUnitDto): Promise<UnitEntity> {
    const [created] = await db.insert(units).values(payload).returning();
    return created;
  }

  async update(id: string, organizationId: string, data: UpdateUnitDto): Promise<UnitEntity | null> {
    const [updated] = await db
      .update(units)
      .set(data)
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))
      .returning();

    return updated ?? null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const deleted = await db
      .delete(units)
      .where(and(eq(units.id, id), eq(units.organizationId, organizationId)))
      .returning({ id: units.id });

    return deleted.length > 0;
  }
}
