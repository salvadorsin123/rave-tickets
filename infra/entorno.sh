# shellcheck shell=sh
# Biblioteca comun de los scripts de operacion. Se hace "source", no se ejecuta:
#
#   . "$(cd "$(dirname "$0")" && pwd)/entorno.sh" pre
#
# El entorno es un argumento OBLIGATORIO y sin valor por defecto. Es deliberado: no debe
# existir ninguna forma de operar produccion por olvidar una bandera.

resolver_entorno() {
  ENTORNO=${1:-}
  case "$ENTORNO" in
    pre | pro) ;;
    *)
      echo "Uso: $(basename "$0") <pre|pro> [...]" >&2
      echo "  pre = staging (pre.in-fluence.party)   pro = PRODUCCION (www.in-fluence.party)" >&2
      exit 2
      ;;
  esac

  DIR_INFRA=$(cd "$(dirname "$0")" && pwd)
  PROYECTO="rave-$ENTORNO"
  ARCHIVO_COMPOSE="$DIR_INFRA/docker-compose.stack.yml"
  ENV_FILE="$DIR_INFRA/.env.$ENTORNO"
  DIR_ESTADO="$DIR_INFRA/.estado"
  ARCHIVO_ESTADO="$DIR_ESTADO/$ENTORNO.env"
  ARCHIVO_UPSTREAM="$DIR_INFRA/caddy/upstream.conf"

  [ -f "$ENV_FILE" ] || {
    echo "ERROR: no existe $ENV_FILE" >&2
    echo "Copia .env.$ENTORNO.example y llenalo EN EL SERVIDOR (ver docs/09-entornos-pre-pro.md)." >&2
    exit 1
  }

  mkdir -p "$DIR_ESTADO"
  export ENTORNO PROYECTO DIR_INFRA ARCHIVO_COMPOSE ENV_FILE DIR_ESTADO ARCHIVO_ESTADO ARCHIVO_UPSTREAM
}

# Lee .estado/<entorno>.env si existe. Deja COLOR_ACTIVO vacio en el primer despliegue.
leer_estado() {
  COLOR_ACTIVO=""
  if [ -f "$ARCHIVO_ESTADO" ]; then
    # shellcheck disable=SC1090
    . "$ARCHIVO_ESTADO"
  fi
  # IMAGE_TAG del estado sirve para los comandos de lectura (ps, logs), que si no fallarian
  # por la interpolacion obligatoria del compose. Un despliegue lo sobreescribe con el sha
  # nuevo antes de llamar a compose().
  [ -n "${IMAGE_TAG:-}" ] || IMAGE_TAG=${IMAGE_TAG_ESTADO:-desconocido}
  export COLOR_ACTIVO IMAGE_TAG
}

escribir_estado() {
  cat > "$ARCHIVO_ESTADO" <<FIN
# Generado por infra/desplegar.sh — no editar a mano.
COLOR_ACTIVO=$1
IMAGE_TAG_ESTADO=$2
DESPLEGADO_EN=$(date -u +%Y-%m-%dT%H:%M:%SZ)
FIN
}

color_opuesto() {
  case "$1" in
    azul) echo verde ;;
    *) echo azul ;;
  esac
}

# Siempre con los dos perfiles: sin ellos, `docker compose ps` esconderia el color inactivo
# y daria una foto incompleta del stack. Para arrancar se nombran los servicios de forma
# explicita, asi que incluir ambos perfiles no levanta de mas.
#
# Nunca se usa `down` ni `--remove-orphans` en estos scripts: cualquiera de los dos se
# llevaria por delante los servicios compartidos o el color que esta sirviendo.
compose() {
  IMAGE_TAG="$IMAGE_TAG" APP_ENV="$ENTORNO" \
    docker compose \
    --project-name "$PROYECTO" \
    --file "$ARCHIVO_COMPOSE" \
    --env-file "$ENV_FILE" \
    --profile azul --profile verde \
    "$@"
}

# Valor de una variable del .env sin exponer el archivo completo.
leer_env() {
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1
}
