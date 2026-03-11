# Worcoor Layout Mapping

Warehouse management system for tracking organizational units, location tags, SKUs, assets, and storage racks.

## Monorepo Structure

This is a monorepo where the **Frontend (Next.js)** lives at the repository root and the **Backend (Fastify)** lives in the `Backend/` subfolder. Next.js requires its configuration files (`app/`, `components/`, `next.config.mjs`, etc.) to be at the project root — they cannot be moved into a subdirectory without breaking the framework.

```
Worcoor-Layout-Mapping/          ← Frontend (Next.js) root
├── app/                         # Next.js App Router pages
│   ├── dashboard/               # Dashboard routes
│   │   ├── reference-data/      # Org Units, Location Tags, SKUs, Assets, Bulk Upload
│   │   ├── warehouse-management/# Layout builder & warehouse map
│   │   └── admin/               # User & role management
│   ├── login/                   # Auth pages
│   ├── layout.tsx
│   └── globals.css
├── components/                  # Reusable UI components
│   ├── ui/                      # Base Radix UI components
│   ├── dashboard/               # Dashboard-specific components
│   ├── inventory/               # SKU form components
│   ├── layout/                  # Page layout components
│   └── warehouse/               # Warehouse map components
├── src/
│   ├── services/                # API service layer (axios clients)
│   ├── constants/               # API endpoint constants
│   └── utils/                   # Auth and utility helpers
├── hooks/                       # Custom React hooks
├── contexts/                    # React context providers
├── lib/                         # Warehouse utilities and helpers
├── types/                       # Shared TypeScript type definitions
├── styles/                      # Additional CSS (warehouse styles)
├── public/                      # Static assets
├── warehouse/                   # Legacy warehouse components
├── bulk-import-data/            # Sample CSV files for Bulk Upload feature
├── scripts/                     # Dev/test scripts (multi-tenant tests)
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── Backend/                     ← Backend (Fastify) subfolder
    ├── src/
    │   ├── modules/             # Feature modules (auth, units, skus, assets…)
    │   ├── database/            # Drizzle ORM schema & migrations
    │   └── middleware/          # JWT auth & validation
    ├── 01-units.csv             # Seed data — Org Units
    ├── 02-layouts.csv           # Seed data — Layouts
    ├── 03-location-tags.csv     # Seed data — Location Tags
    ├── 04-skus.csv              # Seed data — SKUs
    ├── 05-assets.csv            # Seed data — Assets
    ├── import-script.ts         # Seed data import script
    ├── package.json
    └── tsconfig.json
```

## Technology Stack

### Frontend (root)
- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** + Radix UI components
- **React Hook Form** + Zod validation
- **Recharts** for data visualization
- **Socket.IO Client** for real-time updates

### Backend (`Backend/`)
- **Fastify** HTTP framework
- **PostgreSQL** with Drizzle ORM
- **JWT** authentication
- **Socket.IO** for WebSocket connections
- **Supabase** (hosted Postgres)

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Supabase project)
- pnpm (recommended)

### Frontend

```bash
# From repository root
pnpm install
cp .env.example .env.local   # configure API base URL
pnpm dev                     # http://localhost:3000
```

### Backend

```bash
cd Backend
pnpm install
# configure .env (copy from .env.example)
pnpm run db:push             # run migrations
pnpm run dev                 # http://localhost:4000
```

## Default Credentials

Default credentials are configured during initial database setup. Refer to the seeding instructions in `Backend/README.md`.

## Performance Optimizations

The warehouse map and data layer have been optimized for high-density environments (5,000+ items):

- **Query Batching:** Eliminated N+1 database queries by implementing bulk fetching for location tags and layout components using Drizzle `inArray`.
- **Frontend Optimization:** Wrapped `WarehouseItem` in `React.memo` with custom prop hashing, reducing map re-render cycles by up to 95% during live updates.
- **Selective State Hydration:** Real-time updates now surgically patch the specific component state in memory without triggering a full-screen layout refetch.
- **Database Performance:** Strategic composite indexes added to `skus`, `assets`, and `components` tables to ensure sub-100ms response times for unit-wide data.

## Key Features

- JWT-based user authentication with role-based access control
- Organizational unit management (warehouses, offices, production)
- Location tag tracking with L×B×H dimensions and capacity calculation
- SKU inventory management with effective/expiry dates
- Asset management with location assignment
- Interactive warehouse layout builder with drag-and-drop rack visualization
- Real-time WebSocket updates for live map statistics and component changes
- Configurable auto-refresh for warehouse data (1-60 minute intervals)
- Bulk data import via CSV or Excel (SKUs, Location Tags, Assets)
- Multi-tenant data isolation with organization-scoped queries

## API Documentation

Swagger docs available at `http://localhost:4000/documentation` when the backend is running.
