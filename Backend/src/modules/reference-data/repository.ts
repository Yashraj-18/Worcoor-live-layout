import { count, eq } from 'drizzle-orm';

import { db } from '../../config/database.js';
import { units } from '../../database/schema/units.js';
import { skus } from '../../database/schema/skus.js';
import { locationTags } from '../../database/schema/location-tags.js';
import { assets } from '../../database/schema/assets.js';

export type ReferenceDataCounts = {
  totalUnits: number;
  totalSkus: number;
  totalLocationTags: number;
  totalAssets: number;
};

export class ReferenceDataRepository {
  async getCounts(organizationId: string): Promise<ReferenceDataCounts> {
    const [unitsResult, skusResult, locationTagsResult, assetsResult] =
      await Promise.all([
        db
          .select({ total: count() })
          .from(units)
          .where(eq(units.organizationId, organizationId)),
        db
          .select({ total: count() })
          .from(skus)
          .where(eq(skus.organizationId, organizationId)),
        db
          .select({ total: count() })
          .from(locationTags)
          .where(eq(locationTags.organizationId, organizationId)),
        db
          .select({ total: count() })
          .from(assets)
          .where(eq(assets.organizationId, organizationId)),
      ]);

    return {
      totalUnits: unitsResult[0]?.total ?? 0,
      totalSkus: skusResult[0]?.total ?? 0,
      totalLocationTags: locationTagsResult[0]?.total ?? 0,
      totalAssets: assetsResult[0]?.total ?? 0,
    };
  }
}
