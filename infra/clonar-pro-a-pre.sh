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

RUTA_PRO=${RUTA_PRO:-/home/ubuntu/rave-pro}
ENV_PRO="$RUTA_PRO/infra/.env.pro"
[ -f "$ENV_PRO" ] || { echo "ERROR: no existe $ENV_PRO (define RUTA_PRO si el clon esta en otro lado)" >&2; exit 1; }

contenedor_pro() {
  docker ps --quiet \
    --filter "label=com.docker.compose.project=rave-pro" \
    --filter "label=com.docker.compose.service=$1" | head -1
}

leer_env_de() {
  sed -n "s/^$2=//p" "$1" | head -1
}

nombre_de() {
  docker inspect -f '{{.Name}}' "$1" | sed 's|^/||'
}

DB_PRO=$(contenedor_pro db)
[ -n "$DB_PRO" ] || { echo "ERROR: no encuentro el contenedor db de rave-pro corriendo." >&2; exit 1; }
MINIO_PRO=$(contenedor_pro minio)
[ -n "$MINIO_PRO" ] || { echo "ERROR: no encuentro el contenedor minio de rave-pro corriendo." >&2; exit 1; }
MINIO_PRE=$(docker ps --quiet --filter "label=com.docker.compose.project=rave-pre" --filter "label=com.docker.compose.service=minio" | head -1)
[ -n "$MINIO_PRE" ] || { echo "ERROR: el minio de PRE no esta corriendo." >&2; exit 1; }

TEMPORAL=$(mktemp -d /var/tmp/clonar-pro-a-pre.XXXXXX)
trap 'rm -rf "$TEMPORAL"' EXIT INT TERM

echo "=================================================================="
echo " Clonando rave-pro  ->  rave-pre"
echo " Anonimizado: $ANONIMIZAR"
echo "=================================================================="

# --- 1. Leer de PRO (solo lectura) --------------------------------------------
echo "==> pg_dump de produccion"
docker exec -i "$DB_PRO" pg_dump -U rave -d ravedb --format=custom > "$TEMPORAL/pro.dump"

# --- 2. Detener lo que escribe en PRE -----------------------------------------
# Solo los backends: son los unicos que tocan la base y el bucket. Los frontends pueden
# quedarse arriba devolviendo error un momento, que en PRE da igual.
echo "==> deteniendo backends de PRE"
# Se anota cuales estaban corriendo para volver a levantar exactamente esos. Levantar solo
# el color activo dejaba al inactivo a medias (su frontend arriba, su backend caido), y eso
# desarma la reversion: revertir.sh conmutaria a un color donde las paginas cargan pero
# toda llamada a la API da 502.
BACKENDS_ACTIVOS=$(compose ps --format '{{.Service}} {{.State}}' 2>/dev/null \
  | sed -n 's/^\(backend-[a-z]*\) running$/\1/p' | tr '\n' ' ')
compose stop backend-azul backend-verde 2>/dev/null || true
compose up -d --wait --wait-timeout 120 db minio

# --- 3. Restaurar la base en PRE ----------------------------------------------
echo "==> recreando ravedb en PRE"
compose exec -T db psql -U rave -d postgres -v ON_ERROR_STOP=1 \
  -c 'DROP DATABASE IF EXISTS ravedb WITH (FORCE);' \
  -c 'CREATE DATABASE ravedb OWNER rave;'

echo "==> restaurando el dump"
compose exec -T db pg_restore -U rave -d ravedb --no-owner --no-privileges < "$TEMPORAL/pro.dump"

# --- 4. Copiar los objetos de MinIO a PRE -------------------------------------
# Por la API S3, NO copiando el volumen. Copiar el volumen entero arrastra
# /data/.minio.sys, que es la base de identidades de MinIO: PRE terminaria con el usuario y
# la llave secreta de PRODUCCION, y su backend moriria al arrancar con
# "SignatureDoesNotMatch" contra su propio almacenamiento, porque su .env.pre tiene otras.
# (Tarlo entero si sirve para respaldar y restaurar la MISMA instancia, que es lo que hace
# respaldar.sh; entre dos instancias distintas, no.)
echo "==> copiando los objetos del bucket por la API S3"
COPIADOR=$(docker run -d --rm --network rave-pro_default --entrypoint sleep minio/mc 600)
trap 'docker rm -f "$COPIADOR" >/dev/null 2>&1; rm -rf "$TEMPORAL"' EXIT INT TERM
docker network connect rave-pre_default "$COPIADOR"

# Se direcciona por nombre de contenedor, no por el alias "minio": ese alias existe en las
# dos redes y desde un contenedor conectado a ambas seria ambiguo.
# Las credenciales van por stdin (heredoc), no como argumentos, para que no queden visibles
# en `ps` mientras corre el comando.
docker exec -i "$COPIADOR" sh -s <<FIN
set -e
mc alias set origen  http://$(nombre_de "$MINIO_PRO"):9000 '$(leer_env_de "$ENV_PRO" MINIO_ROOT_USER)' '$(leer_env_de "$ENV_PRO" MINIO_ROOT_PASSWORD)' > /dev/null
mc alias set destino http://$(nombre_de "$MINIO_PRE"):9000 '$(leer_env MINIO_ROOT_USER)' '$(leer_env MINIO_ROOT_PASSWORD)' > /dev/null
mc mb --ignore-existing destino/boletos-pdf > /dev/null
mc mirror --overwrite --remove origen/boletos-pdf destino/boletos-pdf
echo "    objetos en PRE: \$(mc ls --recursive destino/boletos-pdf | wc -l)"
FIN
docker rm -f "$COPIADOR" >/dev/null
trap 'rm -rf "$TEMPORAL"' EXIT INT TERM

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
# Se restauran exactamente los backends que estaban corriendo, no solo el activo.
[ -n "$BACKENDS_ACTIVOS" ] || BACKENDS_ACTIVOS="backend-${COLOR_ACTIVO:-azul}"
echo "==> levantando de vuelta:$BACKENDS_ACTIVOS"
# shellcheck disable=SC2086
compose up -d --wait --wait-timeout 300 $BACKENDS_ACTIVOS "frontend-${COLOR_ACTIVO:-azul}"

echo "=================================================================="
echo " PRE refrescado desde produccion."
if [ "$ANONIMIZAR" = "si" ]; then
  echo " Todas las cuentas de PRE usan ahora la PASSWORD_PRE que pasaste."
fi
echo " Produccion no fue modificada."
echo "=================================================================="
