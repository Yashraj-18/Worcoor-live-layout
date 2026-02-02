# WorCoor Backend

Backend API for the **WorCoor LiveLayout Platform** — a multi-tenant SaaS application for real-time warehouse and office space management.

Built with **Fastify + TypeScript**, backed by **PostgreSQL on Supabase**, and using **Drizzle ORM** for type-safe database access.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [Installation](#installation)
5. [Database Setup](#database-setup)
6. [Running the Server](#running-the-server)
7. [Available Scripts](#available-scripts)
8. [API Overview](#api-overview)
9. [Authentication](#authentication)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **Git**
- A **Supabase** account and project (for PostgreSQL database)

---

## Project Structure

```
Backend/
├── src/
│   ├── config/                 # App and database configuration
│   │   ├── database.ts         # Drizzle + pg pool setup
│   │   └── env.ts              # Environment variable loader
│   ├── database/
│   │   ├── migrations/         # SQL migration scripts
│   │   ├── schema/             # Drizzle ORM table definitions
│   │   └── seeds/              # Seed data scripts
│   ├── modules/
│   │   ├── auth/               # Authentication (login, register, password reset)
│   │   └── warehouse/          # Warehouse APIs (units, layouts, components, location-tags, live-map, skus)
│   ├── plugins/                # Fastify plugins (auth decorator, CORS, cookies)
│   ├── routes/                 # Route registrations
│   └── server.ts               # Application entry point
├── tests/
│   ├── auth/                   # Auth service tests
│   ├── warehouse/              # Warehouse service tests
│   └── helpers/                # Test utilities and mocks
├── .env                        # Environment variables (not committed)
├── .env.example                # Template for environment variables
├── drizzle.config.ts           # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Environment Setup

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env
   ```

   If `.env.example` doesn't exist, create a `.env` file manually.

2. **Fill in the required variables in `.env`:**

   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0
   CORS_ORIGIN=http://localhost:5173

   # Supabase Project
   SUPABASE_PROJECT_ID=your_supabase_project_id
   SUPABASE_URL=https://your_project_id.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Database (Supabase Postgres)
   DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.your_project_id.supabase.co:5432/postgres

   # Authentication Secrets (use 32+ character random strings)
   JWT_SECRET=replace-with-32-character-jwt-secret
   COOKIE_SECRET=replace-with-32-character-cookie-secret

   # Optional: Redis for Socket.IO scaling
   REDIS_URL=redis://default:password@your_upstash_redis_url:6379
   ```

3. **Where to find Supabase credentials:**

   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **Settings → API**
   - Copy the **Project URL** → `SUPABASE_URL`
   - Copy the **anon/public key** → `SUPABASE_PUBLISHABLE_KEY`
   - Copy the **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
   - Navigate to **Settings → Database**
   - Copy the **Connection string (URI)** → `DATABASE_URL` (replace `[YOUR-PASSWORD]` with your actual DB password)

---

## Installation

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone https://github.com/your-org/worcoor.git
   cd worcoor/Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   This will install all required packages including Fastify, Drizzle, bcrypt, and testing utilities.

---

## Database Setup

### 1. Run the Initial Migration

The migration script creates all required tables, indexes, and constraints. You have two options:

**Option A: Run via Supabase SQL Editor (Recommended for first-time setup)**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `src/database/migrations/20240114_initial_schema.sql`
4. Paste and run the script

**Option B: Run additional migrations locally**

For subsequent migrations (e.g., password reset columns):

```bash
# Copy and run the migration SQL in Supabase SQL Editor
# File: src/database/migrations/20260114_add_password_reset_columns.sql
```

### 2. Seed the Database

The seed script inserts sample data including two organizations, test users, and baseline warehouse structures:

```bash
npm run db:seed
```

**Seed data includes:**

| Entity        | Sample Data                                                    |
| ------------- | -------------------------------------------------------------- |
| Organizations | Acme Logistics, Northwind Warehousing                          |
| Users         | admin@acme-logistics.com (admin), worker@acme-logistics.com (worker), viewer@northwind.com (viewer) |
| Units         | Acme HQ Warehouse                                              |
| Layouts       | Ground Floor                                                   |
| Location Tags | RACK-A-001                                                     |
| Components    | Rack A (vertical_rack)                                         |

**Default passwords for seed users:**

- Admin: `AdminPass123!`
- Worker: `WorkerPass123!`
- Viewer: `ViewerPass123!`

### 3. Explore the Database (Optional)

Use Drizzle Studio to visually browse and edit your database:

```bash
npm run db:studio
```

This opens a local web interface at `http://localhost:5555`.

---

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

The server starts at `http://localhost:3000` by default.

### Production Build

```bash
npm run build
npm start
```

---

## Available Scripts

| Script           | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | Start development server with hot reload (tsx)  |
| `npm run build`  | Compile TypeScript to JavaScript                 |
| `npm start`      | Run the compiled production build                |
| `npm run lint`   | Run ESLint on all TypeScript files               |
| `npm run db:generate` | Generate Drizzle migrations from schema     |
| `npm run db:studio`   | Open Drizzle Studio (database GUI)          |
| `npm run db:seed`     | Seed the database with sample data          |
| `npm test`       | Run all tests once (Vitest)                      |
| `npm run test:watch` | Run tests in watch mode                     |

---

## API Overview

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint                    | Description                     |
| ------ | --------------------------- | ------------------------------- |
| POST   | `/api/auth/login`           | Login with email/password       |
| POST   | `/api/auth/register`        | Register new organization/admin |
| POST   | `/api/auth/logout`          | Clear auth cookie               |
| POST   | `/api/auth/password-reset/request` | Request password reset token |
| POST   | `/api/auth/password-reset/confirm` | Confirm reset with new password |

### Units Endpoints

| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | `/api/units`          | List all units           |
| POST   | `/api/units`          | Create a new unit        |
| GET    | `/api/units/:unitId`  | Get unit by ID           |
| PUT    | `/api/units/:unitId`  | Update a unit            |
| DELETE | `/api/units/:unitId`  | Delete a unit            |

### Layouts Endpoints

| Method | Endpoint                          | Description              |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/api/units/:unitId/layouts`      | List layouts for a unit  |
| POST   | `/api/units/:unitId/layouts`      | Create a new layout      |
| PUT    | `/api/layouts/:layoutId`          | Update a layout          |
| DELETE | `/api/layouts/:layoutId`          | Delete a layout          |

### Components Endpoints

| Method | Endpoint                                    | Description                    |
| ------ | ------------------------------------------- | ------------------------------ |
| POST   | `/api/layouts/:layoutId/components`         | Create a component             |
| PUT    | `/api/components/:componentId`              | Update a component             |
| DELETE | `/api/components/:componentId`              | Delete a component             |
| PUT    | `/api/components/:componentId/location-tag` | Attach/detach location tag     |

### Location Tags Endpoints

| Method | Endpoint                              | Description                |
| ------ | ------------------------------------- | -------------------------- |
| GET    | `/api/units/:unitId/location-tags`    | List location tags for unit|
| POST   | `/api/location-tags`                  | Create a location tag      |
| PUT    | `/api/location-tags/:locationTagId`   | Update a location tag      |

---

## Authentication

The API uses **JWT tokens** stored in **httpOnly cookies** for authentication.

### How It Works

1. **Login/Register:** On successful authentication, the server issues a signed JWT and sets it as an httpOnly cookie named `token`.

2. **Authenticated Requests:** The browser automatically sends the cookie with each request. The server validates the JWT and extracts the user context (`userId`, `organizationId`, `role`).

3. **Logout:** Clears the `token` cookie.

4. **RBAC Roles:**
   - `admin` — Full access (manage users, create layouts, configure settings)
   - `worker` — Add/move inventory, view live maps, update assets
   - `viewer` — Read-only access

### Multi-Tenancy

Every database query is scoped by `organizationId` extracted from the JWT. Users can only access data belonging to their organization.

---

## Testing

The project uses **Vitest** for unit testing.

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Structure

```
tests/
├── auth/
│   └── auth.service.test.ts      # AuthService tests (login, register, reset)
├── warehouse/
│   ├── units.service.test.ts     # UnitsService tests
│   └── layouts.service.test.ts   # LayoutsService tests
└── helpers/
    └── mocks.ts                  # Fastify request/reply mocks
```

### Current Coverage

- **AuthService:** Login, register, password reset request/confirm, duplicate email handling, invalid credentials
- **UnitsService:** List, create, update, delete, 404 handling
- **LayoutsService:** List, create, update, delete, 404 handling

---

## Troubleshooting

### Common Issues

#### 1. `ENOTFOUND db.*.supabase.co`

**Cause:** DNS resolution failure for Supabase Postgres hostname (often IPv6 related).

**Solution:** The seed script now uses the Supabase REST API instead of direct Postgres connections. Ensure your `.env` has valid `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

#### 2. `Could not find the 'X' column in the schema cache`

**Cause:** The database schema doesn't match what the code expects.

**Solution:** Run the latest migration SQL in Supabase SQL Editor to add missing columns/tables.

#### 3. `Invalid credentials` on login

**Cause:** Password mismatch or user doesn't exist.

**Solution:** Run `npm run db:seed` to insert test users with known passwords.

#### 4. `JWT must be provided` or `401 Unauthorized`

**Cause:** Missing or expired auth cookie.

**Solution:** Ensure you're hitting `/api/auth/login` first and that cookies are being sent with requests (credentials: 'include' for fetch).

#### 5. TypeScript errors on `npm run build`

**Cause:** Type mismatches or missing dependencies.

**Solution:** Run `npm install` and ensure all `@types/*` packages are installed.

---

## Tech Stack Summary

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js (v18+)                      |
| Framework      | Fastify                             |
| Language       | TypeScript                          |
| ORM            | Drizzle ORM                         |
| Database       | PostgreSQL (Supabase)               |
| Authentication | JWT (httpOnly cookies) + bcrypt     |
| Validation     | Zod                                 |
| Realtime       | Socket.IO (planned)                 |
| Testing        | Vitest                              |

---

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run `npm test` to ensure all tests pass
4. Run `npm run lint` to check for linting issues
5. Submit a pull request

---

## License

Proprietary — WorCoor / Surviant LLC

