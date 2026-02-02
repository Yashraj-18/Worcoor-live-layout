# WC LiveLayout API Testing Guide

**Base URL:** `http://localhost:3000`

---

## 1. Authentication & User Onboarding

### POST /api/auth/signup (first org signup — auto admin)
```json
{
  "email": "admin@testorg.com",
  "password": "SecurePass123!",
  "organizationName": "Test Organization"
}
```

### POST /api/auth/login
```json
{
  "email": "admin@testorg.com",
  "password": "SecurePass123!"
}
```
> **Note:** After login, the JWT token is set in an httpOnly cookie automatically.

### POST /api/auth/logout
```json
{}
```

### POST /api/users/invite (admin only)
```json
{
  "email": "worker1@testorg.com",
  "role": "worker" // admin | worker | viewer
}
```
> Response includes `token` (use for acceptance); in production this would be emailed.

### GET /api/users/invitation/:token (public)
No body; returns invite details if valid.

### POST /api/users/accept-invitation (public)
```json
{
  "token": "<token-from-invite>",
  "password": "SecurePass123!"
}
```

### PUT /api/users/:id/role (admin only)
```json
{
  "role": "viewer" // admin | worker | viewer
}
```

---

## 2. Units

### GET /api/units
No body required. Returns all units for the authenticated organization.

### GET /api/units/:unitId
No body required. Returns unit with utilization data.
```
GET /api/units/550e8400-e29b-41d4-a716-446655440001
```

### POST /api/units
```json
{
  "unitName": "Warehouse A",
  "unitType": "warehouse",
  "status": "LIVE",
  "description": "Main storage facility"
}
```

**Status options:** `LIVE`, `OFFLINE`, `MAINTENANCE`, `PLANNING`

### PUT /api/units/:unitId
```json
{
  "unitName": "Warehouse A - Updated",
  "status": "MAINTENANCE",
  "description": "Under renovation"
}
```

### DELETE /api/units/:unitId
No body required.
```
DELETE /api/units/550e8400-e29b-41d4-a716-446655440001
```

---

## 3. Layouts

### GET /api/units/:unitId/layouts
No body required.
```
GET /api/units/550e8400-e29b-41d4-a716-446655440001/layouts
```

### POST /api/units/:unitId/layouts
```json
{
  "layoutName": "Ground Floor"
}
```

### PUT /api/layouts/:layoutId
```json
{
  "layoutName": "Ground Floor - Updated"
}
```

### DELETE /api/layouts/:layoutId
No body required.

---

## 4. Components

### POST /api/units/:unitId/layouts/:layoutId/components
```json
{
  "componentType": "vertical_rack",
  "displayName": "Rack A-01",
  "positionX": 100,
  "positionY": 200,
  "width": 80,
  "height": 120,
  "color": "#4CAF50",
  "locationTagId": null
}
```

**Component types:** `vertical_rack`, `horizontal_rack`, `zone`, `pathway`, `office`, `meeting_room`, `desk`, `storage_bin`, `conveyor`, `dock`, `staging_area`, `cold_storage`, `hazmat_zone`, etc.

### PUT /api/components/:componentId
```json
{
  "displayName": "Rack A-01 Updated",
  "positionX": 150,
  "positionY": 250,
  "color": "#FF5722"
}
```

### PUT /api/components/:componentId/location-tag
```json
{
  "locationTagId": "550e8400-e29b-41d4-a716-446655440010"
}
```

To detach location tag:
```json
{
  "locationTagId": null
}
```

### DELETE /api/components/:componentId
No body required.

---

## 5. Location Tags

### GET /api/units/:unitId/location-tags
No body required.
```
GET /api/units/550e8400-e29b-41d4-a716-446655440001/location-tags
```

### POST /api/location-tags
```json
{
  "unitId": "550e8400-e29b-41d4-a716-446655440001",
  "locationTagName": "RACK-A-001",
  "capacity": 50
}
```

### PUT /api/location-tags/:locationTagId
```json
{
  "locationTagName": "RACK-A-001-UPDATED",
  "capacity": 75
}
```

---

## 6. SKUs (Inventory)

### GET /api/skus
Query parameters:
```
GET /api/skus?unitId=xxx&locationTagId=xxx&search=product&limit=50&offset=0
```

### GET /api/skus/:skuId
No body required.

### POST /api/skus
```json
{
  "skuName": "Steel Beam Type A",
  "skuCategory": "raw_material",
  "skuUnit": "kg",
  "quantity": 250.5,
  "effectiveDate": "2026-01-15",
  "expiryDate": "2027-01-15",
  "locationTagId": "550e8400-e29b-41d4-a716-446655440010"
}
```

**SKU categories:** `raw_material`, `finished_good`, `work_in_progress`, `packaging`, `spare_parts`

**SKU units:** `kg`, `liters`, `pieces`, `boxes`, `pallets`, `meters`

### PUT /api/skus/:skuId
```json
{
  "skuName": "Steel Beam Type A - Premium",
  "quantity": 200.0,
  "expiryDate": "2027-06-15"
}
```

### PUT /api/skus/:skuId/move
```json
{
  "toLocationTagId": "550e8400-e29b-41d4-a716-446655440011"
}
```

### GET /api/skus/:skuId/history
No body required. Returns movement history for the SKU.

### DELETE /api/skus/:skuId
No body required.

---

## 7. Assets

### GET /api/assets
Query parameters:
```
GET /api/assets?unitId=xxx&limit=50&offset=0
```

### GET /api/assets/:assetId
No body required.

### POST /api/assets
```json
{
  "assetName": "Forklift #3",
  "assetType": "forklift",
  "locationTagId": "550e8400-e29b-41d4-a716-446655440010"
}
```

**Asset types:** `forklift`, `pallet_jack`, `scanner`, `conveyor`, `crane`, `truck`, `cart`

### PUT /api/assets/:assetId
```json
{
  "assetName": "Forklift #3 - Repaired",
  "assetType": "forklift"
}
```

### PUT /api/assets/:assetId/move
```json
{
  "toLocationTagId": "550e8400-e29b-41d4-a716-446655440011"
}
```

### DELETE /api/assets/:assetId
No body required.

---

## 8. SKU Movements

### GET /api/sku-movements
Query parameters:
```
GET /api/sku-movements?skuId=xxx&fromLocationTagId=xxx&toLocationTagId=xxx&unitId=xxx&limit=50&offset=0
```

---

## 9. Live Map

### GET /api/units/:unitId/live-map
No body required. Returns complete live map with layouts, components, SKUs, and utilization.
```
GET /api/units/550e8400-e29b-41d4-a716-446655440001/live-map
```

### GET /api/units/:unitId/search?q=query
```
GET /api/units/550e8400-e29b-41d4-a716-446655440001/search?q=RACK-A
```

---

## Testing Flow (Recommended Order)

1. **Register/Login** - Get authenticated
2. **Create Unit** - POST /api/units
3. **Create Layout** - POST /api/units/:unitId/layouts
4. **Create Location Tags** - POST /api/location-tags
5. **Create Components** - POST /api/units/:unitId/layouts/:layoutId/components
6. **Attach Location Tags** - PUT /api/components/:componentId/location-tag
7. **Add SKUs** - POST /api/skus
8. **View Live Map** - GET /api/units/:unitId/live-map
9. **Move SKU** - PUT /api/skus/:skuId/move
10. **Check History** - GET /api/skus/:skuId/history
11. **Search** - GET /api/units/:unitId/search?q=

---

## cURL Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@testorg.com","password":"SecurePass123!"}'
```

### Create Unit (with cookie)
```bash
curl -X POST http://localhost:3000/api/units \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"unitName":"Warehouse A","unitType":"warehouse","status":"LIVE","description":"Main facility"}'
```

### Get Live Map
```bash
curl -X GET http://localhost:3000/api/units/UNIT_ID/live-map \
  -b cookies.txt
```

### Move SKU
```bash
curl -X PUT http://localhost:3000/api/skus/SKU_ID/move \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"toLocationTagId":"TARGET_LOCATION_TAG_ID"}'
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET/PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

---

## Role Permissions

| Action | Admin | Worker | Viewer |
|--------|-------|--------|--------|
| Read (GET) | ✅ | ✅ | ✅ |
| Add SKUs/Assets | ✅ | ✅ | ❌ |
| Move SKUs/Assets | ✅ | ✅ | ❌ |
| Create Units/Layouts | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| Edit Layouts/Components | ✅ | ❌ | ❌ |
