#!/bin/sh
set -e

# Aplica migraciones pendientes contra DATABASE_URL antes de arrancar el servidor.
# Requiere que ya existan migraciones generadas en prisma/migrations (ver docs/07-despliegue-azure.md):
# `prisma migrate deploy` solo aplica migraciones existentes, nunca las genera.
npx prisma migrate deploy

exec "$@"
