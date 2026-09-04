# Arquitectura del Sistema — Venta y Validación de Entradas (Rave)

## 1. Visión general

Sistema monolito modular dividido en dos aplicaciones desplegables de forma independiente:

- **Backend** (NestJS + TypeScript + Prisma + PostgreSQL) — API REST, lógica de negocio, generación de PDF/QR, autenticación.
- **Frontend** (Next.js + React + TypeScript + Tailwind) — Dashboard administrativo y vista de escaneo (PWA-ready para cámara móvil).

No existe portal de comprador. Todo el flujo de venta es manual, operado por el Administrador.

## 2. Arquitectura limpia (Clean Architecture) — Backend

```
apps/backend/src/
├── domain/               # Entidades, value objects, enums, reglas de negocio puras (sin dependencias externas)
│   ├── entities/
│   ├── value-objects/
│   └── enums/
├── application/          # Casos de uso, puertos (interfaces de repos/servicios), DTOs
│   ├── use-cases/
│   ├── ports/
│   └── dtos/
├── infrastructure/       # Implementaciones concretas: Prisma, storage S3, JWT, PDF, QR
│   ├── persistence/
│   │   └── prisma/
│   ├── storage/          # MinIO (API S3)
│   ├── pdf/              # PDFKit
│   ├── qr/               # qrcode
│   └── auth/
└── presentation/         # Controllers, Guards, Pipes, Filters
    ├── controllers/
    ├── guards/
    └── filters/
```

**Regla de dependencia:** `presentation → application → domain`, e `infrastructure` implementa los `ports` definidos en `application`. El dominio nunca importa de infraestructura ni de NestJS.

Principios SOLID aplicados vía:
- **Repositories** (puertos en `application/ports`, implementación en `infrastructure/persistence`).
- **Services** de aplicación que orquestan casos de uso (un caso de uso = una clase con método `execute()`).
- **DTOs + class-validator** para validación de entrada en `presentation`.
- **Guards** (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`) para autorización declarativa.

## 3. Módulos NestJS

| Módulo | Responsabilidad |
|---|---|
| `AuthModule` | Login, refresh token, hash de contraseñas (bcrypt) |
| `UsersModule` | CRUD de usuarios (admin/escaneador), roles, permisos |
| `EventsModule` | CRUD de eventos, cierre, duplicación de configuración |
| `SalesModule` | Registro de ventas |
| `TicketsModule` | Generación de boleto, PDF, QR, folio, estados, cancelación/reembolso |
| `ScansModule` | Validación de QR, registro de ingresos parciales, historial |
| `DashboardModule` | Estadísticas agregadas filtrables por evento |
| `ReportsModule` | Exportación Excel/CSV/PDF |
| `AuditModule` | Bitácora de auditoría (interceptor global) |
| `ConfigurationModule` | Configuraciones por evento (precios, plantillas) |

## 4. Frontend — estructura por capas

```
apps/frontend/src/
├── app/                  # App Router de Next.js (rutas)
│   ├── (auth)/login
│   ├── (admin)/dashboard, eventos, ventas, boletos, escaneadores, reportes, auditoria
│   └── (scanner)/escanear
├── components/           # UI reutilizable (Tailwind)
├── features/             # Lógica por dominio (hooks, llamadas API, stores) — mismo nombre que módulos backend
├── lib/                  # cliente HTTP, auth, utils
└── types/                # Tipos compartidos con backend (vía paquete shared o duplicados)
```

El **Escaneador** usa exclusivamente la ruta `/escanear`, con UI minimalista de pantalla completa (verde/rojo) optimizada para móvil, usando `getUserMedia` para cámara.

## 5. Seguridad

- **JWT** (access token corto + refresh token) emitido por `AuthModule`.
- **bcrypt** para hash de contraseñas (cost factor ≥ 12).
- **RolesGuard / PermissionsGuard** basados en tabla `Rol`/`Permiso`.
- **CSRF**: tokens de doble envío para rutas que usan cookies (si se opta por cookie httpOnly para refresh token).
- **Rate limiting**: `@nestjs/throttler` en endpoints de login y de escaneo.
- **Validación backend**: `class-validator` + `class-transformer` en todos los DTOs; nunca confiar en validación de frontend.
- **Auditoría**: interceptor global que escribe en `BitacoraAuditoria` en cada mutación (crear/editar/cancelar/reembolsar/escanear).
- **QR sin datos sensibles**: el payload del QR es `{ uuid, token }`; el token de validación es un secreto aleatorio (≥128 bits) almacenado con hash en BD, nunca el dato en claro fuera del PDF.

## 6. Infraestructura (alto nivel — runbook completo en `docs/07-despliegue-oracle.md`)

Todo el sistema corre como un solo stack de Docker Compose en una VM ARM "Always Free"
de Oracle Cloud. Ningún contenedor publica puertos al host: el único ingreso público es
el túnel de Cloudflare, que sale desde la VM (no hay puertos de entrada abiertos).

| Componente | Implementación |
|---|---|
| Frontend | Contenedor Next.js (standalone) |
| Backend | Contenedor NestJS |
| Base de datos | Contenedor PostgreSQL 16 con volumen persistente |
| Almacenamiento de PDFs | Contenedor MinIO (API S3) con volumen persistente |
| Secretos | Archivo `infra/.env.prod` en el servidor (fuera del repositorio) |
| Ingreso público / TLS | Cloudflare Tunnel (`cloudflared`) |
| CI/CD | GitHub Actions (build/test); despliegue por `git pull` en el servidor |

## 7. Comunicación Frontend-Backend

- API REST versionada (`/api/v1/...`), JSON.
- Autenticación vía header `Authorization: Bearer <token>`.
- Errores estandarizados: `{ statusCode, message, error, timestamp, path }` (exception filter global).

## 8. Escalabilidad (resumen — plan completo en Fase 4)

- Backend stateless → permite correr varias réplicas del contenedor detrás del mismo túnel.
- Índices en `Boleto.tokenValidacion`, `Boleto.folio`, `Venta.eventoId` para soportar escaneo masivo concurrente.
- Caché opcional (contenedor Redis) para validación de QR en eventos masivos, con invalidación inmediata al registrar ingreso.
- Generación de PDF/QR puede moverse a un *worker* asíncrono (cola en Redis + contenedor worker) si el volumen de ventas lo justifica.
