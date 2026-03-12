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
 
  async findAllWithUtilization(organizationId: string): Promise<UnitWithUtilization[]> {
    const unitsList = await this.findAllByOrganization(organizationId);
    const results = await Promise.all(
      unitsList.map((u) => this.findByIdWithUtilization(u.id, organizationId))
    );
    return results.filter((u): u is UnitWithUtilization => u !== null);
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
 
    const stats = await db
      .select({
        totalCapacity: sql<number>`COALESCE(SUM(${locationTags.capacity}), 0)`,
        totalOccupied: sql<number>`COALESCE((
          SELECT SUM(skus.quantity)
          FROM skus
          WHERE skus.location_tag_id IN (
            SELECT id FROM location_tags WHERE unit_id = ${id}
          ) AND skus.organization_id = ${organizationId}
        ), 0)`,
      })
      .from(locationTags)
      .where(eq(locationTags.unitId, id));
 
    const { totalCapacity, totalOccupied } = stats[0] ?? { totalCapacity: 0, totalOccupied: 0 };
    const utilizationPercentage = totalCapacity > 0
      ? (Number(totalOccupied) / Number(totalCapacity)) * 100
      : 0;
 
    return {
      ...unit,
      totalLocations: Number(totalCapacity), // Renamed conceptually in this context
      occupiedLocations: Number(totalOccupied),
      utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
    };
  }

  async findByUnitId(unitId: string, organizationId: string): Promise<UnitEntity | null> {
    const result = await db
      .select()
      .from(units)
      .where(and(eq(units.unitId, unitId), eq(units.organizationId, organizationId)))
      .limit(1);

    return result[0] ?? null;
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
