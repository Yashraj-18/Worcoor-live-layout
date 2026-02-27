# Bulk Import Data Files

Real-world CSV files for the Bulk Upload feature in the Worcoor application.
Each file contains **20 rows** of realistic warehouse data ready to import.

## Files

| File | Rows | Contents |
|------|------|---------|
| `sample_skus.csv` | 20 | Electronics, industrial materials, and safety equipment SKUs |
| `sample_location_tags.csv` | 20 | Warehouse racks, zones, staging areas, and pick faces with dimensions |
| `sample_assets.csv` | 20 | Forklifts, pallet jacks, scanners, printers, conveyors, and dock equipment |

## Recommended Import Order

Import in this order so that location tags exist before SKUs/assets reference them:

1. **Location Tags** first — creates all rack and zone locations in the warehouse
2. **SKUs** second — inventory items (no location tag assigned at import; assign later via Edit)
3. **Assets** third — equipment items (no location tag assigned at import; assign later via Edit)

## How to Use

1. Go to **Reference Data → Bulk Upload** in the app.
2. Select a **Warehouse** from the dropdown (required).
3. Choose the **data type** (Location Tags, SKUs, or Assets).
4. Select **Create New** as the operation.
5. Click **Confirm Configuration**.
6. Drop or browse to the corresponding CSV file.
7. Click **Upload File** to validate.
8. Review the results — all rows should show as **Valid**.
9. Click **Import N Valid Records** to save to the database.

The app accepts both `.csv` and `.xlsx` files.

---

## Column Reference

### SKUs (`sample_skus.csv`)

| Column | Required | Description |
|--------|----------|-------------|
| `sku_id` | No | Your internal SKU code (e.g. `SKU-001`) |
| `sku_name` | **Yes** | Name of the SKU |
| `sku_category` | **Yes** | `finished_good` or `raw_material` |
| `sku_unit` | **Yes** | Unit of measure: `pieces`, `kg`, `liters`, `boxes` |
| `quantity` | **Yes** | Numeric quantity |
| `effective_date` | **Yes** | Format: `YYYY-MM-DD` |
| `expiry_date` | No | Format: `YYYY-MM-DD` |
| `location_tag_name` | No | Must match an existing location tag in the selected warehouse |

### Location Tags (`sample_location_tags.csv`)

| Column | Required | Description |
|--------|----------|-------------|
| `location_tag` | **Yes** | Name/code of the location tag |
| `unit_id` | **Yes** | Org unit code (e.g. `CDC-001`) — must match an existing unit |
| `length` | No* | Numeric dimension |
| `breadth` | No* | Numeric dimension |
| `height` | No* | Numeric dimension |
| `unit_of_measurement` | No* | `meters`, `feet`, `inches`, or `centimeters` |
| `description` | No | Free text description |

\* If any dimension is provided, all three dimensions **and** `unit_of_measurement` are required together.

### Assets (`sample_assets.csv`)

| Column | Required | Description |
|--------|----------|-------------|
| `asset_id` | No | Your internal asset code (e.g. `FORK-001`) |
| `asset_name` | **Yes** | Name of the asset |
| `asset_type` | **Yes** | `forklift`, `pallet_jack`, or `scanner` |
| `location_tag_name` | No | Must match an existing location tag in the selected warehouse |
| `description` | No | Free text description |
