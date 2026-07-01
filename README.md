# RAVE Tickets

> A full-stack web platform for managing and validating event tickets — built for raves and festivals where sales are handled in cash by staff, not by attendees online.

![CI](https://github.com/salvadorsin123/rave-tickets/actions/workflows/ci.yml/badge.svg)

---

## What it does

RAVE Tickets is an internal operations platform for event organizers. There is **no self-service portal for attendees** — admins register each sale manually after receiving cash payment. The system then generates a PDF ticket with an embedded QR code that scanners validate at the door.

### Core workflow

1. **Admin creates an event** with name, date, venue, and optional logo/banner.
2. **Admin registers a sale** — buyer name, optional email, number of people on the ticket.
3. **System generates a PDF ticket** with a unique QR code and stores it in Azure Blob Storage.
4. **Admin downloads or resends the PDF** to the buyer via any channel.
5. **Scanner opens the scanner view on their phone** and scans QR codes at the venue entrance.
6. **System validates in real time** — green screen for valid, red for already used or invalid.

Each ticket tracks people independently: a ticket for 5 people can be scanned 3 times at entry and 2 more later (partial entry).

---

## Features

**Event management**
- Multiple events with independent stats
- Per-event logo and background image
- Configurable base price

**Ticket sales**
- Register a sale: buyer name, optional email, number of people
- Auto-generated PDF with embedded QR (dark festival aesthetic)
- Unique folio + UUID + validation token per ticket
- Reprint or resend PDF at any time

**QR validation**
- Camera-based scanner (phone or webcam) via `html5-qrcode`
- Result in < 1 s with haptic feedback on mobile
- Supports partial entry tracking (e.g. 3 of 5 people entered)
- Ticket states: `Pendiente` · `ParcialmenteUtilizado` · `Utilizado` · `Cancelado` · `Reembolsado` · `BloqueadoPorFraude`
- Entry and exit scanning modes

**Admin dashboard**
- Sales totals, revenue, expected vs actual attendance
- Sales-by-day and sales-by-hour charts (Recharts)
- Top scanners leaderboard
- Recent activity feed

**Reports**
- Export sales, tickets, and scan history as **Excel**, **CSV**, or **PDF**
- PDF reports render a real table with auto-sized columns, zebra rows, and pagination

**User management**
- Three roles: `super_admin` · `admin` · `escaneador`
- Seven granular permissions
- Admin can create, edit, deactivate, and reset passwords for scanners
- Full audit log of all actions

**Security**
- JWT access + refresh token pair (15 min / 7 day)
- `bcrypt` password hashing (12 rounds)
- Per-role permission guards on every endpoint
- `helmet` headers, rate limiting (NestJS Throttler)
- Swagger docs at `/docs` (dev/staging only)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | Azure SQL Database (SQL Server 2022 locally via Docker) |
| File storage | Azure Blob Storage (Azurite locally via Docker) |
| PDF generation | PDFKit |
| QR generation | `qrcode` |
| QR scanning | `html5-qrcode` |
| Charts | Recharts |
| Auth | `passport-jwt`, `jose` |
| CI/CD | GitHub Actions |
| Container registry | Azure Container Registry |
| Hosting | Azure App Service |

The backend follows **Clean Architecture** (hexagonal): domain entities and use-cases have zero framework dependencies, with NestJS and Prisma living exclusively in the infrastructure layer.

---

## Project structure

```
rave-tickets/
├── apps/
│   ├── backend/               # NestJS API
│   │   ├── src/
│   │   │   ├── domain/        # Entities, value objects, enums
│   │   │   ├── application/   # Use cases, ports (interfaces)
│   │   │   ├── infrastructure/# Prisma repos, PDF/Excel/QR services, Azure Storage
│   │   │   └── presentation/  # NestJS controllers, guards, DTOs
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       ├── migrations/
│   │       └── seed.ts
│   └── frontend/              # Next.js app
│       └── src/app/
│           ├── (auth)/        # Login
│           ├── (admin)/       # Dashboard, events, sales, tickets, users, reports
│           └── scanner/       # QR scanner view
├── infra/
│   ├── docker-compose.yml     # Local dev stack
│   └── azure/bicep/           # IaC for Azure provisioning
├── docs/                      # Architecture, data model, UML, wireframes, deploy guide
└── .github/workflows/
    ├── ci.yml                 # Lint + typecheck + test + build
    └── deploy.yml             # Build images → ACR → deploy to App Service
```

---

## Getting started (local Docker)

**Prerequisites:** Docker Desktop, Node.js 20+

```bash
# 1. Clone and install deps
git clone https://github.com/salvadorsin123/rave-tickets.git
cd rave-tickets
npm ci --prefix apps/backend
npm ci --prefix apps/frontend

# 2. Start the full stack (MSSQL + Azurite + backend + frontend)
cd infra
docker compose up --build
```

On first start the backend automatically runs `prisma db push` and seeds the database with an admin user.

Default credentials (change after first login):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rave.local` | `CambiameYa123!` |

> To create a `super_admin` user, set `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD` as environment variables before running the seed.

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger: http://localhost:3001/docs

---

## Environment variables

### Backend

| Variable | Description | Default (dev) |
|---|---|---|
| `DATABASE_URL` | SQL Server connection string | *(set by docker-compose)* |
| `JWT_ACCESS_SECRET` | Secret for access tokens | `dev-access-secret-cambiar` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `dev-refresh-secret-cambiar` |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob Storage connection | Azurite emulator |
| `AZURE_STORAGE_CONTAINER` | Container name for PDFs | `boletos-pdf` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:3000` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |
| `SEED_ADMIN_EMAIL` | Admin email for seed | `admin@rave.local` |
| `SEED_SUPER_ADMIN_EMAIL` | Super admin email for seed | `superadmin@rave.local` |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

---

## Running tests

```bash
cd apps/backend
npm test              # unit tests (Jest)
npm run test:e2e      # end-to-end tests
npm run test:cov      # with coverage report
```

---

## CI/CD

Every push to `main` triggers the CI workflow (lint → typecheck → tests → build for both apps). On success, the deploy workflow builds Docker images, pushes them to Azure Container Registry, and deploys to Azure App Service. Migrations run automatically when the backend container starts (`prisma migrate deploy`).

---

## Roles and permissions

| Permission | super_admin | admin | escaneador |
|---|---|---|---|
| `usuarios.gestionar` | ✓ | ✓ | |
| `eventos.gestionar` | ✓ | ✓ | |
| `ventas.registrar` | ✓ | ✓ | |
| `boletos.gestionar` | ✓ | ✓ | |
| `reportes.exportar` | ✓ | ✓ | |
| `auditoria.consultar` | ✓ | ✓ | |
| `escaneos.validar` | ✓ | ✓ | ✓ |

`super_admin` is the only role that can manage other admins.

---

## Docs

Detailed documentation lives in [`/docs`](docs/):

- [Architecture overview](docs/01-arquitectura.md)
- [Use cases](docs/02-casos-de-uso.md)
- [Data model (ER diagram)](docs/03-modelo-de-datos.md)
- [UML diagrams](docs/04-diagramas-uml.md)
- [Folder structure](docs/05-estructura-de-carpetas.md)
- [Wireframes](docs/06-wireframes.md)
- [Azure deployment guide](docs/07-despliegue-azure.md)
- [Security & scalability](docs/08-seguridad-y-escalabilidad.md)

---

## License

MIT
