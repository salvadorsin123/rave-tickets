#!/bin/sh
# Respaldo de un entorno: dump logico de PostgreSQL + copia del volumen de MinIO.
# Pensado para correr por cron y desde desplegar.sh. Ver docs/07-despliegue-oracle.md.
#
# Uso:
#   ./respaldar.sh <pre|pro> [directorio-destino]
#
# Sin directorio escribe en /var/backups/rave/<entorno>. Conserva DIAS_RETENCION dias.
#
# En la practica solo se respalda "pro": PRE es desechable por diseño — se regenera con
# clonar-pro-a-pre.sh en cualquier momento — y respaldarlo solo gastaria disco.

set -eu

. "$(cd "$(dirname "$0")" && pwd)/entorno.sh"

resolver_entorno "${1:-}"
leer_estado

DESTINO=${2:-/var/backups/rave/$ENTORNO}
DIAS_RETENCION=${DIAS_RETENCION:-7}
SELLO=$(date +%Y%m%d-%H%M%S)

mkdir -p "$DESTINO"

# --- PostgreSQL ---------------------------------------------------------------
# Dump logico (no copia del volumen): se restaura en cualquier Postgres 16, incluido el
# stack local de desarrollo, y no depende de la version exacta del binario ni del disco.
# -T porque cron no tiene TTY.
echo "==> pg_dump ($ENTORNO)"
compose exec -T db pg_dump -U rave -d ravedb --format=custom \
  > "$DESTINO/postgres-$SELLO.dump"

# --- MinIO --------------------------------------------------------------------
# Se copia el volumen completo con un contenedor efimero: no necesita credenciales ni
# exponer el puerto S3. Compose forma el nombre del volumen con el del proyecto.
echo "==> volumen de MinIO (${PROYECTO}_minio-data)"
docker run --rm \
  -v "${PROYECTO}_minio-data":/data:ro \
  -v "$DESTINO":/respaldo \
  alpine tar czf "/respaldo/minio-$SELLO.tar.gz" -C /data .

# --- Retencion ----------------------------------------------------------------
echo "==> borrando respaldos de mas de $DIAS_RETENCION dias"
find "$DESTINO" -maxdepth 1 -name 'postgres-*.dump' -mtime "+$DIAS_RETENCION" -delete
find "$DESTINO" -maxdepth 1 -name 'minio-*.tar.gz' -mtime "+$DIAS_RETENCION" -delete

echo "Respaldo de $ENTORNO listo en $DESTINO (sello $SELLO)"
echo "IMPORTANTE: un respaldo que vive solo en el mismo servidor no protege contra perder"
echo "el servidor. Copialo fuera (ver seccion 10 del runbook)."
