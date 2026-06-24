# Despliegue en Azure

Esta guía cubre el *bootstrap* manual (una sola vez) y cómo el pipeline de CI/CD toma el
control después. La infraestructura vive como código en
[`infra/azure/bicep/main.bicep`](../infra/azure/bicep/main.bicep).

## 0. Prerrequisitos

- Suscripción de Azure con permisos de Owner/Contributor sobre un Resource Group.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) instalado (`az`).
- Repositorio en GitHub con Actions habilitado.
- Una base de datos accesible para generar la primera migración de Prisma (puede ser la
  propia Azure SQL recién creada, o un SQL Server local/Docker — ver paso 3).

## 1. Crear el Resource Group y desplegar la infraestructura base

```bash
az login
az group create --name rg-rave-prod --location mexicocentral

cp infra/azure/bicep/main.parameters.example.json infra/azure/bicep/main.parameters.json
# Edita main.parameters.json: contraseña de SQL y secretos JWT (usa valores aleatorios largos,
# por ejemplo `openssl rand -base64 48`). Este archivo NO debe commitearse (ya está en .gitignore).

az deployment group create \
  --resource-group rg-rave-prod \
  --template-file infra/azure/bicep/main.bicep \
  --parameters @infra/azure/bicep/main.parameters.json
```

Esto crea: Container Registry, Azure SQL (servidor + base `RaveDb`), Storage Account +
contenedor `boletos-pdf`, Key Vault con los secretos ya cargados, Log Analytics +
Application Insights, App Service Plan Linux, y dos Web Apps en modo contenedor
(`<env>-api`, `<env>-web`) — todavía sin imagen real (usan un tag `latest` que aún no
existe en el ACR; el primer deploy del pipeline las puebla).

Anota los outputs (`backendUrl`, `frontendUrl`, `acrLoginServer`, `sqlServerFqdn`).

## 2. Configurar OIDC para que GitHub Actions despliegue sin secretos de larga vida

```bash
az ad app create --display-name "rave-github-actions"
appId=$(az ad app list --display-name "rave-github-actions" --query "[0].appId" -o tsv)
az ad sp create --id "$appId"

az ad app federated-credential create --id "$appId" --parameters '{
  "name": "rave-main-branch",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<tu-org>/<tu-repo>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

az role assignment create --assignee "$appId" --role Contributor \
  --scope "/subscriptions/<subscription-id>/resourceGroups/rg-rave-prod"
```

En GitHub (Settings → Secrets and variables → Actions), crea:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `AZURE_CLIENT_ID` | `appId` de arriba |
| Secret | `AZURE_TENANT_ID` | tenant de la suscripción |
| Secret | `AZURE_SUBSCRIPTION_ID` | id de la suscripción |
| Variable | `ACR_LOGIN_SERVER` | output `acrLoginServer` (ej. `raveprodacr.azurecr.io`) |
| Variable | `AZURE_RESOURCE_GROUP` | `rg-rave-prod` |
| Variable | `AZURE_BACKEND_APP_NAME` | `rave-prod-api` |
| Variable | `AZURE_FRONTEND_APP_NAME` | `rave-prod-web` |

También crea el [Environment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
`production` en GitHub (usado por `deploy.yml`) — opcionalmente con reviewers requeridos
antes de desplegar.

## 3. Generar la primera migración de Prisma (paso manual único)

El repositorio **no incluye migraciones generadas** porque crearlas requiere una conexión
real a una base de datos (`prisma migrate dev` necesita poder conectarse para diffear el
schema). Antes del primer deploy a producción:

```bash
cd apps/backend
DATABASE_URL="sqlserver://<sqlServerFqdn>:1433;database=RaveDb;user=raveadmin;password=<password>;encrypt=true;trustServerCertificate=false" \
  npx prisma migrate dev --name init --create-only
# Revisa el SQL generado en prisma/migrations/, luego:
git add prisma/migrations
git commit -m "chore: primera migracion de Prisma"
git push
```

De ahí en adelante, cada cambio a `schema.prisma` debe ir acompañado de su migración
(`prisma migrate dev --name <descripcion>`) commiteada junto al código. El contenedor del
backend corre `prisma migrate deploy` automáticamente en cada arranque (ver
[`docker-entrypoint.sh`](../apps/backend/docker-entrypoint.sh)), así que desplegar una
imagen nueva ya aplica las migraciones pendientes — no hace falta un paso manual en cada
release.

## 4. Primer despliegue

Con las migraciones commiteadas, un `git push` a `main` dispara `ci.yml` (build + test) y,
si pasa, `deploy.yml` (build de imágenes, push a ACR, deploy a ambas Web Apps). También se
puede disparar manualmente desde la pestaña Actions (`workflow_dispatch`).

Verifica:

```bash
curl https://<AZURE_BACKEND_APP_NAME>.azurewebsites.net/docs   # Swagger del backend
curl https://<AZURE_FRONTEND_APP_NAME>.azurewebsites.net/login # Frontend
```

Y siembra el usuario administrador inicial (una sola vez, o cuando necesites resetear):

```bash
az webapp ssh --resource-group rg-rave-prod --name <AZURE_BACKEND_APP_NAME>
# dentro del contenedor:
SEED_ADMIN_EMAIL=admin@tudominio.com SEED_ADMIN_PASSWORD='unaPasswordSegura!' npx prisma db seed
```

## 5. Desarrollo y demo local (sin Azure)

```bash
cd infra
docker compose up --build
```

Levanta SQL Server, Azurite (emulador de Blob Storage), backend y frontend en
`localhost:3001` / `localhost:3000`, sembrando el admin automáticamente. Ver
[`infra/docker-compose.yml`](../infra/docker-compose.yml).

## 6. Rollback

Cada imagen se publica con dos tags: el SHA del commit y `latest`. Para revertir:

```bash
az webapp config container set --name <app> --resource-group rg-rave-prod \
  --container-image-name "<acrLoginServer>/rave-backend:<sha-anterior>"
```

(la migración de base de datos asociada a ese commit ya estará aplicada si se desplegó
antes; revertir el *schema* en sí requiere una migración de "down" explícita, que Prisma no
genera automáticamente — planifica los cambios de schema para ser aditivos cuando sea posible).

## 7. Notas sobre el frontend en Azure

El frontend usa Next.js con middleware, route handlers y SSR (no es un sitio estático), por
lo que se despliega como contenedor en App Service — **no** en Azure Static Web Apps, a
pesar de que el documento de arquitectura de la Fase 1 lo sugería como referencia de alto
nivel. SWA no ejecuta contenedores Docker arbitrarios y su soporte "hybrid" para Next.js usa
su propio adaptador/build (Azure Functions gestionadas), incompatible con el requisito
explícito del enunciado de entregar Dockerfiles para frontend y backend. App Service con
contenedor Linux cumple ambos objetivos (Next.js completo + Docker) sin esa fricción.
