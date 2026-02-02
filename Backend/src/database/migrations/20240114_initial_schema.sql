-- =========================================================
--  WorCoor Core Schema (run once in Supabase SQL editor)
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  role varchar(50) not null check (role in ('admin','worker','viewer')),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_users_org on users (organization_id);
create index if not exists idx_users_email on users (email);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  unit_name varchar(255) not null,
  unit_type varchar(100) not null,
  status varchar(50) not null check (status in ('LIVE','OFFLINE','MAINTENANCE','PLANNING')),
  description text,
  unit_id varchar(100),
  area varchar(100),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_units_org on units (organization_id);
create unique index if not exists idx_units_org_unit_id_unique
  on units (organization_id, unit_id)
  where unit_id is not null;

create table if not exists layouts (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  layout_name varchar(255) not null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_layouts_unit on layouts (unit_id);
create index if not exists idx_layouts_org on layouts (organization_id);

create table if not exists location_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  location_tag_name varchar(200) not null,
  length numeric(10,3),
  breadth numeric(10,3),
  height numeric(10,3),
  unit_of_measurement varchar(20),
  capacity numeric(15,3) not null check (capacity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint unique_location_per_org unique (organization_id, location_tag_name),
  constraint location_tags_measurement_all_or_none
    check (
      (length is null and breadth is null and height is null and unit_of_measurement is null) or
      (length is not null and breadth is not null and height is not null and unit_of_measurement is not null)
    ),
  constraint location_tags_measurement_positive
    check (
      (length is null or (length > 0 and length <= 999999.999)) and
      (breadth is null or (breadth > 0 and breadth <= 999999.999)) and
      (height is null or (height > 0 and height <= 999999.999))
    )
);
create index if not exists idx_location_tags_org on location_tags (organization_id);
create index if not exists idx_location_tags_unit on location_tags (unit_id);

create table if not exists components (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references layouts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  component_type varchar(100) not null,
  display_name varchar(255) not null,
  position_x integer not null,
  position_y integer not null,
  width integer not null,
  height integer not null,
  location_tag_id uuid references location_tags(id),
  color varchar(50),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_components_layout on components (layout_id);
create index if not exists idx_components_org on components (organization_id);
create index if not exists idx_components_location_tag on components (location_tag_id);

create table if not exists skus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sku_name varchar(255) not null,
  sku_category varchar(100) not null,
  sku_unit varchar(50) not null,
  quantity numeric(10,2) not null check (quantity >= 0),
  effective_date date not null,
  expiry_date date,
  location_tag_id uuid references location_tags(id),
  sku_id varchar(100),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_skus_org on skus (organization_id);
create index if not exists idx_skus_location on skus (location_tag_id);
create index if not exists idx_skus_expiry on skus (expiry_date);
create unique index if not exists idx_skus_org_sku_id_unique
  on skus (organization_id, sku_id)
  where sku_id is not null;

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  asset_name varchar(255) not null,
  asset_type varchar(100) not null,
  location_tag_id uuid references location_tags(id),
  asset_id varchar(100),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_assets_org on assets (organization_id);
create index if not exists idx_assets_location on assets (location_tag_id);
create unique index if not exists idx_assets_org_asset_id_unique
  on assets (organization_id, asset_id)
  where asset_id is not null;

create table if not exists sku_movements (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references skus(id) on delete cascade,
  from_location_tag_id uuid references location_tags(id),
  to_location_tag_id uuid not null references location_tags(id),
  moved_at timestamptz not null default timezone('utc', now()),
  moved_by_user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade
);
create index if not exists idx_sku_movements_sku on sku_movements (sku_id);
create index if not exists idx_sku_movements_org on sku_movements (organization_id);
create index if not exists idx_sku_movements_date on sku_movements (moved_at);
