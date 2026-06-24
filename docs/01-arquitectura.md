# Arquitectura del Sistema — Venta y Validación de Entradas (Rave)

## 1. Visión general

Sistema monolito modular dividido en dos aplicaciones desplegables de forma independiente:

- **Backend** (NestJS + TypeScript + Prisma + Azure SQL) — API REST, lógica de negocio, generación de PDF/QR, autenticación.
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
├── infrastructure/       # Implementaciones concretas: Prisma, Azure Blob, JWT, PDF, QR
│   ├── persistence/
│   │   └── prisma/
│   ├── storage/          # Azure Blob Storage
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

## 6. Infraestructura Azure (alto nivel — detalle en Fase 4)

| Componente | Servicio Azure |
|---|---|
| Frontend | Azure Static Web Apps |
| Backend | Azure App Service (contenedor Linux) |
| Base de datos | Azure SQL Database |
| Almacenamiento de PDFs | Azure Blob Storage |
| Secretos | Azure Key Vault |
| Monitoreo | Azure Application Insights |
| CI/CD | GitHub Actions → Build/Test/Deploy |

## 7. Comunicación Frontend-Backend

- API REST versionada (`/api/v1/...`), JSON.
- Autenticación vía header `Authorization: Bearer <token>`.
- Errores estandarizados: `{ statusCode, message, error, timestamp, path }` (exception filter global).

## 8. Escalabilidad (resumen — plan completo en Fase 4)

- Backend stateless → permite escalar horizontalmente en App Service (autoscale por CPU/memoria).
- Índices en `Boleto.tokenValidacion`, `Boleto.folio`, `Venta.eventoId` para soportar escaneo masivo concurrente.
- Caché opcional (Redis/Azure Cache) para validación de QR en eventos masivos, con invalidación inmediata al registrar ingreso.
- Generación de PDF/QR puede moverse a un *worker* asíncrono (Azure Queue + Function) si el volumen de ventas lo justifica.
