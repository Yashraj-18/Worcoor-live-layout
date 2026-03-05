-- Allow duplicate SKU IDs within an organization
-- while preserving lookup performance for sku_id queries

drop index if exists idx_skus_org_sku_id_unique;

create index if not exists idx_skus_org_sku_id_idx
  on skus (organization_id, sku_id)
  where sku_id is not null;
