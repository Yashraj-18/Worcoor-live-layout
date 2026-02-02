-- =========================================================
--  Add user-defined IDs and measurement fields
-- =========================================================

-- Org Units: user-defined unit_id + area
alter table units
  add column if not exists unit_id varchar(100),
  add column if not exists area varchar(100);

create unique index if not exists idx_units_org_unit_id_unique
  on units (organization_id, unit_id)
  where unit_id is not null;

-- Location Tags: measurement dimensions + unit + capacity precision
alter table location_tags
  add column if not exists length numeric(10,3),
  add column if not exists breadth numeric(10,3),
  add column if not exists height numeric(10,3),
  add column if not exists unit_of_measurement varchar(20);

alter table location_tags
  alter column capacity type numeric(15,3)
  using capacity::numeric(15,3);

-- Ensure measurements are either fully provided or fully null
alter table location_tags
  drop constraint if exists location_tags_measurement_all_or_none,
  add constraint location_tags_measurement_all_or_none
    check (
      (length is null and breadth is null and height is null and unit_of_measurement is null) or
      (length is not null and breadth is not null and height is not null and unit_of_measurement is not null)
    );

-- Ensure measurement values stay within expected bounds when provided
alter table location_tags
  drop constraint if exists location_tags_measurement_positive,
  add constraint location_tags_measurement_positive
    check (
      (length is null or (length > 0 and length <= 999999.999)) and
      (breadth is null or (breadth > 0 and breadth <= 999999.999)) and
      (height is null or (height > 0 and height <= 999999.999))
    );

-- SKUs: user-defined sku_id
alter table skus
  add column if not exists sku_id varchar(100);

create unique index if not exists idx_skus_org_sku_id_unique
  on skus (organization_id, sku_id)
  where sku_id is not null;

-- Assets: user-defined asset_id
alter table assets
  add column if not exists asset_id varchar(100);

create unique index if not exists idx_assets_org_asset_id_unique
  on assets (organization_id, asset_id)
  where asset_id is not null;
