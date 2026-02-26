import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }
});

console.log('Loaded environment variables:');
console.log('SUPABASE_URL:', env.SUPABASE_URL ? 'Found' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

const supabase = createClient(
  env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Get organization ID (assuming Acme Logistics)
let organizationId: string;

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

const stats = {
  units: { total: 0, success: 0, failed: 0, errors: [] as string[] },
  layouts: { total: 0, success: 0, failed: 0, errors: [] as string[] },
  locationTags: { total: 0, success: 0, failed: 0, errors: [] as string[] },
  skus: { total: 0, success: 0, failed: 0, errors: [] as string[] },
  assets: { total: 0, success: 0, failed: 0, errors: [] as string[] },
};

function readCSV(filename: string): any[] {
  const filePath = join(__dirname, filename);
  const fileContent = readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

async function getOrganizationId(): Promise<string> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Acme Logistics')
    .single();

  if (error || !data) {
    throw new Error('Acme Logistics organization not found');
  }

  return data.id;
}

async function importUnits() {
  console.log('\n📦 Importing Units...');
  const units = readCSV('01-units.csv');
  stats.units.total = units.length;

  for (const unit of units) {
    try {
      const { error } = await supabase.from('units').insert({
        organization_id: organizationId,
        unit_id: unit.unit_id || null,
        unit_name: unit.unit_name,
        unit_type: unit.unit_type,
        status: unit.status,
        description: unit.description || null,
        area: unit.area || null,
      });

      if (error) throw error;
      stats.units.success++;
      process.stdout.write('.');
    } catch (error: any) {
      stats.units.failed++;
      stats.units.errors.push(`${unit.unit_name}: ${error.message}`);
      process.stdout.write('X');
    }
  }
  console.log(`\n✅ Units: ${stats.units.success}/${stats.units.total} imported`);
}

async function importLayouts() {
  console.log('\n📐 Importing Layouts...');
  const layouts = readCSV('02-layouts.csv');
  stats.layouts.total = layouts.length;

  // Get unit IDs
  const { data: units } = await supabase
    .from('units')
    .select('id, unit_name')
    .eq('organization_id', organizationId);

  const unitMap = new Map(units?.map(u => [u.unit_name, u.id]) || []);

  for (const layout of layouts) {
    try {
      const unitId = unitMap.get(layout.unit_name);
      if (!unitId) throw new Error(`Unit not found: ${layout.unit_name}`);

      const { error } = await supabase.from('layouts').insert({
        organization_id: organizationId,
        unit_id: unitId,
        layout_name: layout.layout_name,
        description: layout.description,
      });

      if (error) throw error;
      stats.layouts.success++;
      process.stdout.write('.');
    } catch (error: any) {
      stats.layouts.failed++;
      stats.layouts.errors.push(`${layout.layout_name}: ${error.message}`);
      process.stdout.write('X');
    }
  }
  console.log(`\n✅ Layouts: ${stats.layouts.success}/${stats.layouts.total} imported`);
}

async function importLocationTags() {
  console.log('\n📍 Importing Location Tags...');
  const locationTags = readCSV('03-location-tags.csv');
  stats.locationTags.total = locationTags.length;

  // Get unit IDs
  const { data: units } = await supabase
    .from('units')
    .select('id, unit_name')
    .eq('organization_id', organizationId);

  const unitMap = new Map(units?.map(u => [u.unit_name, u.id]) || []);

  for (const tag of locationTags) {
    try {
      const unitId = unitMap.get(tag.unit_name);
      if (!unitId) throw new Error(`Unit not found: ${tag.unit_name}`);

      const { error } = await supabase.from('location_tags').insert({
        organization_id: organizationId,
        unit_id: unitId,
        location_tag_name: tag.location_tag_name,
        capacity: parseInt(tag.capacity),
        description: tag.description,
      });

      if (error) throw error;
      stats.locationTags.success++;
      process.stdout.write('.');
    } catch (error: any) {
      stats.locationTags.failed++;
      stats.locationTags.errors.push(`${tag.location_tag_name}: ${error.message}`);
      process.stdout.write('X');
    }
  }
  console.log(`\n✅ Location Tags: ${stats.locationTags.success}/${stats.locationTags.total} imported`);
}

async function importSKUs() {
  console.log('\n📦 Importing SKUs...');
  const skus = readCSV('04-skus.csv');
  stats.skus.total = skus.length;

  // Get location tag IDs
  const { data: tags } = await supabase
    .from('location_tags')
    .select('id, location_tag_name')
    .eq('organization_id', organizationId);

  const tagMap = new Map(tags?.map(t => [t.location_tag_name, t.id]) || []);

  for (const sku of skus) {
    try {
      const locationTagId = sku.location_tag_name ? tagMap.get(sku.location_tag_name) : null;
      if (sku.location_tag_name && !locationTagId) {
        throw new Error(`Location tag not found: ${sku.location_tag_name}`);
      }

      const { error } = await supabase.from('skus').insert({
        organization_id: organizationId,
        sku_id: sku.sku_code || null,
        sku_name: sku.sku_name,
        sku_category: sku.sku_category,
        sku_unit: sku.sku_unit,
        quantity: parseFloat(sku.quantity),
        effective_date: sku.effective_date,
        expiry_date: sku.expiry_date || null,
        location_tag_id: locationTagId,
      });

      if (error) throw error;
      stats.skus.success++;
      process.stdout.write('.');
    } catch (error: any) {
      stats.skus.failed++;
      stats.skus.errors.push(`${sku.sku_code}: ${error.message}`);
      process.stdout.write('X');
    }
  }
  console.log(`\n✅ SKUs: ${stats.skus.success}/${stats.skus.total} imported`);
}

async function importAssets() {
  console.log('\n🚜 Importing Assets...');
  const assets = readCSV('05-assets.csv');
  stats.assets.total = assets.length;

  // Get location tag IDs
  const { data: tags } = await supabase
    .from('location_tags')
    .select('id, location_tag_name')
    .eq('organization_id', organizationId);

  const tagMap = new Map(tags?.map(t => [t.location_tag_name, t.id]) || []);

  for (const asset of assets) {
    try {
      const locationTagId = asset.location_tag_name ? tagMap.get(asset.location_tag_name) : null;
      if (asset.location_tag_name && !locationTagId) {
        throw new Error(`Location tag not found: ${asset.location_tag_name}`);
      }

      const { error } = await supabase.from('assets').insert({
        organization_id: organizationId,
        asset_id: asset.asset_id || null,
        asset_name: asset.asset_name,
        asset_type: asset.asset_type,
        location_tag_id: locationTagId,
      });

      if (error) throw error;
      stats.assets.success++;
      process.stdout.write('.');
    } catch (error: any) {
      stats.assets.failed++;
      stats.assets.errors.push(`${asset.asset_id}: ${error.message}`);
      process.stdout.write('X');
    }
  }
  console.log(`\n✅ Assets: ${stats.assets.success}/${stats.assets.total} imported`);
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));

  const categories = [
    { name: 'Units', stats: stats.units },
    { name: 'Layouts', stats: stats.layouts },
    { name: 'Location Tags', stats: stats.locationTags },
    { name: 'SKUs', stats: stats.skus },
    { name: 'Assets', stats: stats.assets },
  ];

  categories.forEach(({ name, stats }) => {
    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0';
    console.log(`\n${name}:`);
    console.log(`  ✅ Success: ${stats.success}/${stats.total} (${successRate}%)`);
    if (stats.failed > 0) {
      console.log(`  ❌ Failed: ${stats.failed}`);
      console.log(`  Errors:`);
      stats.errors.slice(0, 5).forEach(err => console.log(`    - ${err}`));
      if (stats.errors.length > 5) {
        console.log(`    ... and ${stats.errors.length - 5} more errors`);
      }
    }
  });

  const totalSuccess = categories.reduce((sum, c) => sum + c.stats.success, 0);
  const totalRecords = categories.reduce((sum, c) => sum + c.stats.total, 0);
  const totalFailed = categories.reduce((sum, c) => sum + c.stats.failed, 0);

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${totalSuccess}/${totalRecords} records imported successfully`);
  if (totalFailed > 0) {
    console.log(`❌ ${totalFailed} records failed`);
  }
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    console.log('🚀 Starting Bulk Import...\n');
    console.log('Checking database connection...');

    organizationId = await getOrganizationId();
    console.log(`✅ Connected to organization: Acme Logistics (${organizationId})`);

    await importUnits();
    await importLayouts();
    await importLocationTags();
    await importSKUs();
    await importAssets();

    printSummary();

    console.log('✅ Import completed!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();
