#!/bin/sh
# Despliegue azul/verde de un entorno.
#
#   ./desplegar.sh <pre|pro> <sha-de-40-hex>
#
# Levanta el color inactivo con la imagen del sha indicado, espera a que reporte salud y
# recien entonces conmuta el upstream de Caddy. Si algo falla antes de la conmutacion, el
# color que estaba sirviendo no se toco: el sitio sigue en linea con la version anterior.
#
# El color anterior se deja ENCENDIDO despues de conmutar, para que revertir.sh sea
# instantaneo. Se recicla solo en el despliegue siguiente.
#
# Ver docs/09-entornos-pre-pro.md.

set -eu

. "$(cd "$(dirname "$0")" && pwd)/entorno.sh"

resolver_entorno "${1:-}"
SHA=${2:-}

case "$SHA" in
  *[!0-9a-f]* | "") echo "ERROR: el segundo argumento debe ser un sha de git completo (40 hex), no '$SHA'" >&2; exit 2 ;;
esac
[ ${#SHA} -eq 40 ] || { echo "ERROR: el sha debe tener 40 caracteres, no ${#SHA}" >&2; exit 2; }

leer_estado
DESTINO=$(color_opuesto "${COLOR_ACTIVO:-}")
IMAGE_TAG=$SHA
export IMAGE_TAG
HOSTNAME_PUBLICO=$(leer_env PUBLIC_HOSTNAME)

echo "=================================================================="
echo " Entorno    : $ENTORNO ($PROYECTO) — https://$HOSTNAME_PUBLICO"
echo " Sirviendo  : ${COLOR_ACTIVO:-<ninguno, primer despliegue>}"
echo " Desplegando: $DESTINO con $SHA"
echo "=================================================================="

# --- 1. Traer las imagenes ----------------------------------------------------
# Antes que nada: si el sha no se publico en GHCR, es mejor fallar aqui, sin haber tocado
# ni la base ni los contenedores.
echo "==> pull de las imagenes $SHA"
compose pull "backend-$DESTINO" "frontend-$DESTINO"

# --- 2. Servicios compartidos -------------------------------------------------
echo "==> base de datos y almacenamiento"
compose up -d --wait --wait-timeout 180 db minio

# --- 3. Respaldo previo (solo produccion) -------------------------------------
# Se respalda SIEMPRE, no solo cuando hay migraciones pendientes: detectar "hay pendientes"
# implica parsear la salida de prisma, y equivocarse ahi significa migrar produccion sin
# red. El respaldo tarda segundos sobre este volumen, asi que no hay nada que optimizar.
if [ "$ENTORNO" = "pro" ]; then
  echo "==> respaldo previo obligatorio"
  "$DIR_INFRA/respaldar.sh" pro
fi

echo "==> migraciones pendientes (informativo)"
compose run --rm --no-deps --entrypoint npx "backend-$DESTINO" prisma migrate status || true

# --- 4. Levantar el color destino ---------------------------------------------
# El entrypoint del backend aplica las migraciones al arrancar. Prisma toma un advisory
# lock, asi que dos backends arrancando a la vez no se pisan.
echo "==> levantando $DESTINO"
compose up -d --wait --wait-timeout 300 "backend-$DESTINO" "frontend-$DESTINO"

# --- 5. Verificacion interna --------------------------------------------------
# Se le pregunta al propio contenedor por su version antes de mandarle una sola peticion
# real. Esto atrapa el caso de haber desplegado un tag equivocado.
echo "==> verificando la version de $DESTINO"
SALUD=$(compose exec -T "frontend-$DESTINO" node -e \
  "require('http').get('http://127.0.0.1:3000/api/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).on('error',e=>{console.error(e.message);process.exit(1)})")
VERSION=$(echo "$SALUD" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')

if [ "$VERSION" != "$SHA" ]; then
  echo "ERROR: $DESTINO reporta version '$VERSION', se esperaba '$SHA'" >&2
  echo "       No se conmuto nada. El sitio sigue sirviendo desde ${COLOR_ACTIVO:-<nada>}." >&2
  exit 1
fi
echo "    OK: $SALUD"

# --- 6. Conmutacion -----------------------------------------------------------
echo "==> conmutando Caddy hacia $DESTINO"
printf 'reverse_proxy frontend-%s:3000\n' "$DESTINO" > "$ARCHIVO_UPSTREAM"
compose up -d caddy cloudflared
# "caddy reload" es gradual: las peticiones en vuelo terminan contra el color anterior.
# En el primer despliegue el contenedor acaba de arrancar ya con esta config y el reload
# no hace nada, pero es inofensivo.
compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

# El estado se registra AQUI, no al final: a partir de este punto Caddy ya apunta al color
# nuevo, y el archivo de estado describe hacia donde apunta Caddy, no si el despliegue
# salio bien. Registrarlo despues de la verificacion externa dejaba un agujero: si esa
# verificacion fallaba, el estado quedaba sin escribir y `revertir.sh` no tenia a que
# volver — justo cuando mas falta hace.
COLOR_ANTERIOR=${COLOR_ACTIVO:-}
escribir_estado "$DESTINO" "$SHA"

# --- 7. Verificacion externa --------------------------------------------------
# La prueba que de verdad importa: la cadena completa Cloudflare -> caddy -> frontend
# devolviendo el sha nuevo desde fuera del servidor.
echo "==> verificando https://$HOSTNAME_PUBLICO/api/health"
if ! verificar_externa "$HOSTNAME_PUBLICO" "$SHA"; then
  echo "       Caddy YA apunta a $DESTINO. Si el sitio esta caido: ./revertir.sh $ENTORNO" >&2
  exit 1
fi

echo "=================================================================="
echo " Desplegado: $ENTORNO ahora sirve $DESTINO ($SHA)"
if [ -n "$COLOR_ANTERIOR" ]; then
  echo " $COLOR_ANTERIOR sigue encendido con la version anterior."
  echo " Revertir en menos de un segundo:  ./revertir.sh $ENTORNO"
fi
echo "=================================================================="
