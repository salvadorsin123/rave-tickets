# Estructura de Carpetas del Proyecto

Monorepo con dos aplicaciones independientes y artefactos de infraestructura compartidos.

```
RAVE/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   └── enums/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── ventas/
│   │   │   │   │   ├── boletos/
│   │   │   │   │   ├── eventos/
│   │   │   │   │   ├── escaneos/
│   │   │   │   │   └── usuarios/
│   │   │   │   ├── ports/
│   │   │   │   └── dtos/
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   └── prisma/
│   │   │   │   │       ├── schema.prisma
│   │   │   │   │       └── repositories/
│   │   │   │   ├── storage/        # MinIO (API S3)
│   │   │   │   ├── pdf/            # PDFKit
│   │   │   │   ├── qr/             # qrcode
│   │   │   │   └── auth/           # JWT, bcrypt
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   ├── guards/
│   │   │   │   ├── filters/
│   │   │   │   └── pipes/
│   │   │   ├── modules/            # Módulos NestJS (wiring de DI)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   └── e2e/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/
│       │   │   ├── (admin)/
│       │   │   │   ├── dashboard/
│       │   │   │   ├── eventos/
│       │   │   │   ├── ventas/
│       │   │   │   ├── boletos/
│       │   │   │   ├── escaneadores/
│       │   │   │   ├── reportes/
│       │   │   │   └── auditoria/
│       │   │   └── (scanner)/escanear/
│       │   ├── components/
│       │   │   └── ui/
│       │   ├── features/
│       │   │   ├── ventas/
│       │   │   ├── boletos/
│       │   │   ├── eventos/
│       │   │   ├── escaneos/
│       │   │   └── dashboard/
│       │   ├── lib/
│       │   │   ├── api-client.ts
│       │   │   └── auth.ts
│       │   └── types/
│       ├── public/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                     # Tipos/DTOs/enums compartidos FE-BE
│       ├── src/
│       │   ├── enums/
│       │   └── types/
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml          # Stack local de desarrollo
│   ├── docker-compose.prod.yml     # Stack de produccion (sin puertos publicados + cloudflared)
│   ├── .env.example                # Plantilla del stack local
│   ├── .env.prod.example           # Plantilla de secretos de produccion
│   └── respaldar.sh                # Respaldo de PostgreSQL + MinIO
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # Build + Test
│
├── docs/                           # Esta carpeta — documentación de arquitectura
├── project_requirements.md
└── README.md
```

## Notas

- `packages/shared` evita duplicar enums (`EstadoBoleto`, `ResultadoEscaneo`, etc.) y DTOs entre frontend y backend.
- `apps/backend/src/modules` es la capa de *wiring*: cada módulo NestJS importa sus controllers, use cases y registra las implementaciones concretas de los `ports` vía inyección de dependencias (no contiene lógica de negocio).
- Las migraciones de Prisma viven junto al schema (`apps/backend/src/infrastructure/persistence/prisma/migrations`), pero los scripts SQL "crudos" de referencia (para el entregable de Fase 1) se documentan en `infra/sql/migrations`.
