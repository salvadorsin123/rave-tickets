#!/bin/sh
# Vuelve al color anterior de un entorno.
#
#   ./revertir.sh <pre|pro>
#
# desplegar.sh deja el color viejo encendido justo para esto: revertir no reconstruye ni
# descarga nada, solo reescribe el upstream de Caddy y lo recarga. Tarda menos de un
# segundo y no toca la base de datos.
#
# OJO con las migraciones: si el despliegue que se esta revirtiendo aplico una migracion,
# el esquema NO vuelve atras. Por eso toda migracion debe ser compatible hacia atras
# (agregar columnas/tablas: libre; renombrar o borrar: en dos despliegues separados).
# Ver docs/09-entornos-pre-pro.md.

set -eu

. "$(cd "$(dirname "$0")" && pwd)/entorno.sh"

resolver_entorno "${1:-}"
leer_estado

[ -n "${COLOR_ACTIVO:-}" ] || {
  echo "ERROR: no hay estado registrado para $ENTORNO; no hay nada a lo que volver." >&2
  exit 1
}

ANTERIOR=$(color_opuesto "$COLOR_ACTIVO")
HOSTNAME_PUBLICO=$(leer_env PUBLIC_HOSTNAME)

echo "==> $ENTORNO: sirviendo $COLOR_ACTIVO, se intenta volver a $ANTERIOR"

# El color anterior tiene que seguir arriba ENTERO. Se comprueban los dos servicios, no
# solo el frontend: el healthcheck del frontend pega a /api/health, que se responde a si
# mismo sin tocar el backend. Con el backend caido el sitio pareceria sano —las paginas
# cargan— y cada llamada a la API daria 502.
ESTADOS=$(compose ps --format '{{.Service}} {{.State}}' 2>/dev/null)
for SERVICIO in "backend-$ANTERIOR" "frontend-$ANTERIOR"; do
  ESTADO=$(echo "$ESTADOS" | sed -n "s/^$SERVICIO //p")
  [ "$ESTADO" = "running" ] || {
    echo "ERROR: $SERVICIO no esta corriendo (estado: '${ESTADO:-ausente}')." >&2
    echo "       El color $ANTERIOR esta incompleto, conmutar hacia el dejaria el sitio roto." >&2
    echo "       Para volver a una version anterior hay que desplegarla:" >&2
    echo "         ./desplegar.sh $ENTORNO <sha-anterior>" >&2
    exit 1
  }
done

SALUD=$(compose exec -T "frontend-$ANTERIOR" node -e \
  "require('http').get('http://127.0.0.1:3000/api/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).on('error',e=>{console.error(e.message);process.exit(1)})")
VERSION=$(echo "$SALUD" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')
[ -n "$VERSION" ] || { echo "ERROR: frontend-$ANTERIOR no reporta version: $SALUD" >&2; exit 1; }

echo "==> conmutando Caddy hacia $ANTERIOR ($VERSION)"
printf 'reverse_proxy frontend-%s:3000\n' "$ANTERIOR" > "$ARCHIVO_UPSTREAM"
compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

echo "==> verificando https://$HOSTNAME_PUBLICO/api/health"
verificar_externa "$HOSTNAME_PUBLICO" "$VERSION" || exit 1

escribir_estado "$ANTERIOR" "$VERSION"

echo "Revertido: $ENTORNO sirve $ANTERIOR ($VERSION). $COLOR_ACTIVO sigue encendido."
