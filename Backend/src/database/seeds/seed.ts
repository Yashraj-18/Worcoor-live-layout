import 'dotenv/config';

import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function deleteAll(table: string) {
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

async function insert(table: string, rows: Record<string, unknown>[]) {
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    throw new Error(`Failed to insert into ${table}: ${error.message}`);
  }
}

async function seed() {
  await deleteAll('components');
  await deleteAll('location_tags');
  await deleteAll('layouts');
  await deleteAll('units');
  await deleteAll('users');
  await deleteAll('organizations');

  const orgAId = randomUUID();
  const orgBId = randomUUID();

  await insert('organizations', [
    { id: orgAId, name: 'Acme Logistics' },
    { id: orgBId, name: 'Northwind Warehousing' },
  ]);

  const [adminPassword, workerPassword, viewerPassword] = await Promise.all([
    bcrypt.hash('AdminPass123!', 10),
    bcrypt.hash('WorkerPass123!', 10),
    bcrypt.hash('ViewerPass123!', 10),
  ]);

  const adminId = randomUUID();
  const workerId = randomUUID();
  const viewerId = randomUUID();

  await insert('users', [
    {
      id: adminId,
      organization_id: orgAId,
      email: 'admin@acme-logistics.com',
      password_hash: adminPassword,
      role: 'admin',
    },
    {
      id: workerId,
      organization_id: orgAId,
      email: 'worker@acme-logistics.com',
      password_hash: workerPassword,
      role: 'worker',
    },
    {
      id: viewerId,
      organization_id: orgBId,
      email: 'viewer@northwind.com',
      password_hash: viewerPassword,
      role: 'viewer',
    },
  ]);

  const unitAId = randomUUID();
  const layoutAId = randomUUID();

  await insert('units', [
    {
      id: unitAId,
      organization_id: orgAId,
      unit_name: 'Acme HQ Warehouse',
      unit_type: 'warehouse',
      status: 'LIVE',
      description: 'Primary distribution center',
    },
  ]);

  await insert('layouts', [
    {
      id: layoutAId,
      unit_id: unitAId,
      organization_id: orgAId,
      layout_name: 'Ground Floor',
    },
  ]);

  const locationTagId = randomUUID();

  await insert('location_tags', [
    {
      id: locationTagId,
      organization_id: orgAId,
      unit_id: unitAId,
      location_tag_name: 'RACK-A-001',
      capacity: 50,
    },
  ]);

  await insert('components', [
    {
      id: randomUUID(),
      layout_id: layoutAId,
      organization_id: orgAId,
      component_type: 'vertical_rack',
      display_name: 'Rack A',
      position_x: 120,
      position_y: 200,
      width: 80,
      height: 120,
      location_tag_id: locationTagId,
      color: '#4CAF50',
    },
  ]);

  console.log('✅ Seed data inserted successfully via Supabase REST API.');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  });
