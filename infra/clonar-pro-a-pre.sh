#!/bin/sh
# Refresca PRE con un snapshot reciente de PRODUCCION.
#
#   PASSWORD_PRE='...' ./clonar-pro-a-pre.sh [--con-datos-reales]
#
# Sobre PRO hace UNA sola cosa y es de solo lectura: un pg_dump y un tar del volumen de
# MinIO montado :ro. Todo lo destructivo ocurre exclusivamente contra rave-pre.
#
# Por defecto anonimiza los datos de compradores (ver anonimizar.sql) y reemplaza las
# contrasenas de todas las cuentas por PASSWORD_PRE. Con --con-datos-reales se omite el
# anonimizado: usalo solo para reproducir un bug que dependa de los datos exactos, y
# recuerda que PRE queda con datos personales de verdad.
#
# Esta es tambien la forma de probar una migracion antes de que toque produccion: clona,
# empuja a develop, y `prisma migrate deploy` corre contra datos con la forma real de PRO.

set -eu

. "$(cd "$(dirname "$0")" && pwd)/entorno.sh"

# El entorno destino no es un argumento: este script solo puede escribir en PRE.
resolver_entorno pre
leer_estado

ANONIMIZAR=si
[ "${1:-}" != "--con-datos-reales" ] || ANONIMIZAR=no

# Guarda de seguridad. Redundante por construccion, y aun asi vale las dos lineas: es lo
# unico que separa "refrescar staging" de "borrar produccion".
[ "$PROYECTO" = "rave-pre" ] || { echo "ERROR: destino inesperado '$PROYECTO'" >&2; exit 1; }

if [ "$ANONIMIZAR" = "si" ] && [ -z "${PASSWORD_PRE:-}" ]; then
  cat >&2 <<'FIN'
ERROR: falta PASSWORD_PRE.

Es la contrasena que tendran TODAS las cuentas en PRE despues del clonado. Generala y
pasala en la misma linea para que no quede en el historial ni en disco:

  PASSWORD_PRE="$(openssl rand -base64 18)" ./clonar-pro-a-pre.sh

Apuntala donde guardes tus credenciales: no se vuelve a mostrar.
FIN
  exit 2
fi

contenedor_pro() {
  docker ps --quiet \
    --filter "label=com.docker.compose.project=rave-pro" \
    --filter "label=com.docker.compose.service=$1" | head -1
}

DB_PRO=$(contenedor_pro db)
[ -n "$DB_PRO" ] || { echo "ERROR: no encuentro el contenedor db de rave-pro corriendo." >&2; exit 1; }

TEMPORAL=$(mktemp -d /var/tmp/clonar-pro-a-pre.XXXXXX)
trap 'rm -rf "$TEMPORAL"' EXIT INT TERM

echo "=================================================================="
echo " Clonando rave-pro  ->  rave-pre"
echo " Anonimizado: $ANONIMIZAR"
echo "=================================================================="

# --- 1. Leer de PRO (solo lectura) --------------------------------------------
echo "==> pg_dump de produccion"
docker exec -i "$DB_PRO" pg_dump -U rave -d ravedb --format=custom > "$TEMPORAL/pro.dump"

echo "==> tar del volumen de MinIO de produccion"
docker run --rm \
  -v rave-pro_minio-data:/data:ro \
  -v "$TEMPORAL":/salida \
  alpine tar czf /salida/minio.tar.gz -C /data .

# --- 2. Detener lo que escribe en PRE -----------------------------------------
# Solo los backends: son los unicos que tocan la base y el bucket. Los frontends pueden
# quedarse arriba devolviendo error un momento, que en PRE da igual.
echo "==> deteniendo backends de PRE"
compose stop backend-azul backend-verde 2>/dev/null || true
compose up -d --wait --wait-timeout 120 db minio

# --- 3. Restaurar la base en PRE ----------------------------------------------
echo "==> recreando ravedb en PRE"
compose exec -T db psql -U rave -d postgres -v ON_ERROR_STOP=1 \
  -c 'DROP DATABASE IF EXISTS ravedb WITH (FORCE);' \
  -c 'CREATE DATABASE ravedb OWNER rave;'

echo "==> restaurando el dump"
compose exec -T db pg_restore -U rave -d ravedb --no-owner --no-privileges < "$TEMPORAL/pro.dump"

# --- 4. Restaurar los objetos de MinIO en PRE ---------------------------------
# Se detiene MinIO para no reemplazarle el disco por debajo mientras corre.
echo "==> reemplazando el bucket de PRE"
compose stop minio
docker run --rm \
  -v rave-pre_minio-data:/data \
  -v "$TEMPORAL":/entrada:ro \
  alpine sh -c 'rm -rf /data/* /data/.minio.sys && tar xzf /entrada/minio.tar.gz -C /data'
compose up -d --wait --wait-timeout 120 minio

# --- 5. Anonimizar ------------------------------------------------------------
if [ "$ANONIMIZAR" = "si" ]; then
  echo "==> generando el hash bcrypt de PASSWORD_PRE"
  # Se corre dentro de la imagen del backend, que ya trae bcrypt con el mismo cost factor
  # que usa la app. La contrasena viaja por variable de entorno, no por argv: en argv
  # quedaria visible en `ps` para cualquier usuario del servidor.
  HASH=$(compose run --rm --no-deps -e PASSWORD_PRE --entrypoint node backend-azul \
    -e 'process.stdout.write(require("bcrypt").hashSync(process.env.PASSWORD_PRE, 12))')
  case "$HASH" in
    '$2'*) ;;
    *) echo "ERROR: no se genero un hash bcrypt valido" >&2; exit 1 ;;
  esac

  echo "==> anonimizando datos de compradores y contrasenas"
  compose exec -T db psql -U rave -d ravedb -v ON_ERROR_STOP=1 -v hash_password="$HASH" \
    < "$DIR_INFRA/anonimizar.sql"
else
  echo "==> SIN anonimizar: PRE queda con datos personales reales de produccion."
fi

# --- 6. Volver a levantar PRE -------------------------------------------------
echo "==> levantando el color activo de PRE (${COLOR_ACTIVO:-azul})"
compose up -d --wait --wait-timeout 300 \
  "backend-${COLOR_ACTIVO:-azul}" "frontend-${COLOR_ACTIVO:-azul}"

echo "=================================================================="
echo " PRE refrescado desde produccion."
if [ "$ANONIMIZAR" = "si" ]; then
  echo " Todas las cuentas de PRE usan ahora la PASSWORD_PRE que pasaste."
fi
echo " Produccion no fue modificada."
echo "=================================================================="
