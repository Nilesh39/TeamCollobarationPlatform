# AI WORK OS — Phase 1: Core Foundation & Multi-Tenant Scaffolding

AI WORK OS is an enterprise-grade multi-tenant workspace platform uniting project management, real-time collaboration, autonomous AI agents, and RAG knowledge retrieval.

---

## Tech Stack Overview

* **Client Tier:** React 18/19, TypeScript, Vite, Tailwind CSS, shadcn/ui components, TanStack Query v5, Zustand.
* **API Tier:** Node.js v20+, Express, TypeScript, Clean Layered Architecture, Zod runtime validation, RFC-7807 problem details error handling.
* **Database & Vectors:** PostgreSQL 16 with `pgvector` extension (768 dimensions for Gemini `text-embedding-004`), HNSW cosine indexing, and Prisma ORM.
* **Multi-Tenancy Engine:** Shared Database / Shared Schema with Prisma client extensions enforcing Row-Level Security (RLS) and automatic `tenantId` injection on all queries and mutations.
* **Authentication & Cryptography:** Memory-hard **Argon2id** password hashing, short-lived **JWT access tokens** (15 minutes), and **Redis-backed sliding refresh tokens** (7 days) with token family rotation and reuse/replay revocation.
* **Cache & Message Broker:** Redis 7 Alpine powering session revocation, rate-limiting, and future Socket.IO / BullMQ distributed scaling.
* **Infrastructure:** Docker Compose for local PostgreSQL (with pgvector) and Redis 7 development.

---

## Project Structure

```
d:\TeamOS/
├── docker-compose.yml              # PostgreSQL 16 (pgvector) & Redis 7
├── .env.example                    # Global environment template
├── README.md                       # System documentation & setup guide
├── backend/                        # Node.js + Express + TypeScript service
│   ├── prisma/
│   │   ├── schema.prisma           # 14 entities, enums, pgvector extension
│   │   ├── seed.ts                 # Idempotent DB seeder (tenants, users, tasks)
│   │   └── migrations/
│   │       ├── init.sql            # Raw SQL migration with HNSW vector index
│   │       └── 20261101000000_init/
│   ├── src/
│   │   ├── app.ts                  # Express setup, security headers, CORS
│   │   ├── server.ts               # HTTP bootstrapper & graceful shutdown
│   │   ├── config/                 # Zod-validated environment config
│   │   ├── core/                   # RFC-7807 AppErrors, error codes, RBAC roles
│   │   ├── infrastructure/
│   │   │   ├── database/           # Prisma singleton & tenant-isolation extension
│   │   │   └── redis/              # Redis 7 client with in-memory fallback
│   │   ├── middlewares/            # Auth JWT, Tenant Scoping, RBAC, Validation
│   │   ├── modules/
│   │   │   ├── auth/               # Argon2id registration, login, refresh rotation
│   │   │   ├── tenants/            # Organization switching & details
│   │   │   └── health/             # System health & connectivity diagnostics
│   │   └── utils/                  # Argon2id hashing & JWT rotation crypto
│   └── tests/                      # 17 automated unit & integration tests
│       ├── auth.test.ts            # Argon2id, JWT, token family replay detection
│       ├── tenant-isolation.test.ts# Enforced tenantId query scoping
│       ├── rbac.test.ts            # Permission hierarchy & role guards
│       └── db-connectivity.test.ts # RFC-7807 error format & health telemetry
└── frontend/                       # React 18/19 + Vite + TypeScript application
    ├── src/
    │   ├── app/store/              # Zustand auth and tenant store
    │   ├── components/
    │   │   ├── layouts/            # Auth split-screen & App workspace shells
    │   │   └── ui/                 # Button, Input, Card, Badge (shadcn/ui style)
    │   ├── features/
    │   │   ├── auth/               # Login & Register forms with validation
    │   │   └── dashboard/          # Metrics, system diagnostics, Phase 1 status
    │   └── lib/                    # Axios interceptor with token refresh queue
    ├── vite.config.ts              # Vite bundler with /api proxy
    └── tailwind.config.ts          # Dark enterprise theme configuration
```

---

## Getting Started Locally

### 1. Prerequisites
* **Node.js**: v20+ LTS (Tested on v24.11.0)
* **npm**: v10+
* **Docker & Docker Compose** (Optional for local containerized DB & Cache)

---

### 2. Environment Setup

Create local `.env` files from templates:

```bash
# In backend/
copy backend\.env.example backend\.env

# In root (optional for docker-compose)
copy .env.example .env
```

---

### 3. Spin Up Infrastructure (PostgreSQL 16 + Redis 7)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** with `pgvector` on port `5432` (`ai_work_os` database).
- **Redis 7 Alpine** on port `6379`.

---

### 4. Database Initialization & Seeding

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

#### Demo Seed Accounts:
* **Tenant:** Acme Corporation (`acme-corp`)
* **Owner Account:** `owner@acme.com` / `Password123!`
* **Developer Account:** `developer@acme.com` / `Password123!`

---

### 5. Running the Automated Test Suite

```bash
cd backend
npm test
```

Verifies:
* Argon2id cryptographic hashing and verification.
* JWT short-lived access tokens and claims parsing.
* Sliding refresh tokens with Redis session storage.
* **Token Replay / Reuse Detection:** Revokes the entire token family when an already-consumed token is replayed.
* **Tenant Isolation Engine:** Guarantees `tenantId` injection on all queries and mutations, blocking cross-tenant snooping.
* **RBAC Role Matrix:** Validates permissions for OWNER, ADMIN, MEMBER, and GUEST.
* **Health & RFC-7807 Problem Details:** Centralized error formatting and operational health monitoring.

---

### 6. Starting Backend & Frontend Services

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server listening at http://localhost:5000
# Health check at http://localhost:5000/api/v1/health
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Client running at http://localhost:5173
```
