#!/bin/sh
# Respaldo del stack de produccion: dump logico de PostgreSQL + copia del volumen de MinIO.
# Pensado para correr por cron en el servidor. Ver docs/07-despliegue-oracle.md (seccion 10).
#
# Uso:
#   cd infra && ./respaldar.sh [directorio-destino]
#
# Sin argumento escribe en /var/backups/rave. Conserva los ultimos DIAS_RETENCION dias.

set -eu

DIRECTORIO_INFRA=$(cd "$(dirname "$0")" && pwd)
DESTINO=${1:-/var/backups/rave}
DIAS_RETENCION=${DIAS_RETENCION:-7}
SELLO=$(date +%Y%m%d-%H%M%S)

COMPOSE="docker compose -f $DIRECTORIO_INFRA/docker-compose.prod.yml --env-file $DIRECTORIO_INFRA/.env.prod"

mkdir -p "$DESTINO"

# --- PostgreSQL ---------------------------------------------------------------
# Dump logico (no copia del volumen): se restaura en cualquier Postgres 16, incluido el
# stack local de desarrollo, y no depende de la version exacta del binario ni del disco.
# -T porque cron no tiene TTY.
echo "==> pg_dump"
$COMPOSE exec -T db pg_dump -U rave -d ravedb --format=custom \
  > "$DESTINO/postgres-$SELLO.dump"

# --- MinIO --------------------------------------------------------------------
# Se copia el volumen completo con un contenedor efimero: no necesita credenciales ni
# exponer el puerto S3. El nombre del volumen lo forma Compose con el nombre del proyecto
# (la carpeta "infra"), por eso "infra_minio-data".
echo "==> volumen de MinIO"
docker run --rm \
  -v infra_minio-data:/data:ro \
  -v "$DESTINO":/respaldo \
  alpine tar czf "/respaldo/minio-$SELLO.tar.gz" -C /data .

# --- Retencion ----------------------------------------------------------------
echo "==> borrando respaldos de mas de $DIAS_RETENCION dias"
find "$DESTINO" -maxdepth 1 -name 'postgres-*.dump' -mtime "+$DIAS_RETENCION" -delete
find "$DESTINO" -maxdepth 1 -name 'minio-*.tar.gz' -mtime "+$DIAS_RETENCION" -delete

echo "Respaldo listo en $DESTINO (sello $SELLO)"
echo "IMPORTANTE: un respaldo que vive solo en el mismo servidor no protege contra perder"
echo "el servidor. Copialo fuera (ver seccion 10 del runbook)."
