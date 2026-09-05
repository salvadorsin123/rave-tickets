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
│   ├── docker-compose.stack.yml    # Stack de PRE y PRO (sin puertos publicados, azul/verde)
│   ├── caddy/Caddyfile             # Borde interno: donde se conmuta de color
│   ├── .env.example                # Plantilla del stack local
│   ├── .env.pro.example            # Plantilla de secretos de produccion
│   ├── .env.pre.example            # Plantilla de secretos de staging
│   ├── entorno.sh                  # Biblioteca comun: resuelve proyecto/env-file por entorno
│   ├── desplegar.sh                # Despliegue azul/verde con verificacion y conmutacion
│   ├── revertir.sh                 # Vuelta al color anterior (un caddy reload)
│   ├── desplegar-remoto.sh         # Wrapper que acota lo que puede hacer la llave SSH del CI
│   ├── clonar-pro-a-pre.sh         # Snapshot de PRO -> PRE
│   ├── anonimizar.sql              # Borra datos de compradores tras clonar
│   └── respaldar.sh                # Respaldo de PostgreSQL + MinIO por entorno
│
├── .github/
│   ├── actions/desplegar/          # Accion compuesta: despliegue por SSH
│   └── workflows/
│       ├── ci.yml                  # Verificar -> publicar imagenes -> desplegar
│       └── desplegar-manual.yml    # Redespliegue de un sha arbitrario
│
├── docs/                           # Esta carpeta — documentación de arquitectura
├── project_requirements.md
└── README.md
```

## Notas

- `packages/shared` evita duplicar enums (`EstadoBoleto`, `ResultadoEscaneo`, etc.) y DTOs entre frontend y backend.
- `apps/backend/src/modules` es la capa de *wiring*: cada módulo NestJS importa sus controllers, use cases y registra las implementaciones concretas de los `ports` vía inyección de dependencias (no contiene lógica de negocio).
- Las migraciones de Prisma viven junto al schema (`apps/backend/src/infrastructure/persistence/prisma/migrations`), pero los scripts SQL "crudos" de referencia (para el entregable de Fase 1) se documentan en `infra/sql/migrations`.
