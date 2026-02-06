# Multi-Tenant Test Suite

Automated regression tests validating multi-tenant isolation for the WorCoor platform.

## Overview

The `multi-tenant-tests.js` script exercises the backend API to verify that tenant data is properly scoped and isolated. It logs in as two separate tenant admins (Company A and Company B) and runs a battery of tests against each core entity.

## Entities Covered

- **Org Units** – warehouses, stores, etc.
- **Location Tags** – storage locations within units
- **SKUs** – inventory items
- **Assets** – equipment and other tracked assets

## Test Scenarios

For each entity the suite validates three properties:

| Scenario | Description | Expected Outcome |
|----------|-------------|------------------|
| Cross-tenant duplication | Create the same code/name under both tenants | Both requests succeed (201) |
| Within-tenant uniqueness | Create the same code/name twice in one tenant | First succeeds (201), second rejected (≥400) |
| Data isolation | Tenant B lists or fetches Tenant A's record by ID | Empty list or 404 |

## Prerequisites

1. **Backend running** on `http://localhost:4000` (or set `API_BASE_URL` env var).
2. **Seeded tenant accounts**:
   - Company A: `admin1@company.com` / `Admin@123`
   - Company B: `admin2@company.com` / `Admin@123`
3. **Node.js** installed (v18+ recommended).
4. **axios** available (`npm install axios` if not already in project).

## Usage

```bash
# From repository root
node scripts/multi-tenant-tests.js
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:4000/api` | Base URL for API requests |

## Output

The script prints a line per test with ✅ (pass) or ❌ (fail) and a brief detail string. Example:

```
Logged in as admin1@company.com (Company A)
Logged in as admin2@company.com (Company B)
✅ Cross-tenant duplication allowed
   Company A status 201, Company B status 201
✅ Within-tenant uniqueness (Company A)
   Company A: first 201, second 500
...
All multi-tenant tests passed successfully.
```

Exit code is **0** when all tests pass, **1** otherwise.

## Extending the Suite

To add coverage for a new entity:

1. Add helper methods to `TenantSession` (e.g., `createFoo`, `listFoos`, `getFooById`).
2. Implement test functions following the existing pattern (`testFooCrossTenantDuplication`, etc.).
3. Push results onto the `results` array in `run()`.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Login failed` | Backend not running or wrong credentials | Start backend, verify seed data |
| `500` on Location Tag create | Missing dimensions | Ensure payload includes `length`, `breadth`, `height`, `unitOfMeasurement` |
| `ECONNREFUSED` | Backend unreachable | Check `API_BASE_URL` and network |

## License

Internal use only – Surviant LLC.
