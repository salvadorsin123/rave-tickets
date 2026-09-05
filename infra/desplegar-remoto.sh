#!/bin/sh
# Punto de entrada UNICO de la llave SSH que usa GitHub Actions.
#
# Se instala fuera de los clones, en /home/ubuntu/bin/desplegar-remoto.sh, y se ata a la
# llave en ~/.ssh/authorized_keys con:
#
#   command="/home/ubuntu/bin/desplegar-remoto.sh",restrict ssh-ed25519 AAAA... deploy@ci
#
# `command=` hace que la llave SOLO pueda ejecutar este script, sin importar que comando
# pida el cliente; el comando pedido llega en $SSH_ORIGINAL_COMMAND y aqui se valida antes
# de usarlo. `restrict` apaga port forwarding, agent forwarding y pty.
#
# Con eso, lo peor que permite la llave si se filtrara es desplegar un commit del propio
# repositorio: no da shell, no lee archivos y no ejecuta nada mas.
#
# Comandos aceptados:
#   desplegar <pre|pro> <sha-40-hex>
#   revertir  <pre|pro>

set -eu

registrar() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> /home/ubuntu/despliegues.log
}

rechazar() {
  registrar "RECHAZADO: $1"
  echo "ERROR: $1" >&2
  exit 2
}

# Se lee el comando pedido pero NO se ejecuta: se parsea y se valida campo por campo.
set -- ${SSH_ORIGINAL_COMMAND:-}
ACCION=${1:-}
ENTORNO=${2:-}
SHA=${3:-}

case "$ENTORNO" in
  pre | pro) ;;
  *) rechazar "entorno invalido: '$ENTORNO'" ;;
esac

RUTA="/home/ubuntu/rave-$ENTORNO"
[ -d "$RUTA/.git" ] || rechazar "no existe el clon $RUTA"

case "$ACCION" in
  desplegar)
    case "$SHA" in
      *[!0-9a-f]* | "") rechazar "sha invalido" ;;
    esac
    [ ${#SHA} -eq 40 ] || rechazar "el sha debe tener 40 caracteres"

    registrar "desplegar $ENTORNO $SHA"
    cd "$RUTA"
    git fetch --prune origin
    # --force descarta cambios locales en archivos versionados, pero NO borra los ignorados
    # (.env.<entorno>, .estado/, caddy/upstream.conf): esos sobreviven al checkout.
    git checkout --force "$SHA" || rechazar "el sha $SHA no existe en origin"
    exec ./infra/desplegar.sh "$ENTORNO" "$SHA"
    ;;

  revertir)
    [ -z "$SHA" ] || rechazar "revertir no acepta un tercer argumento"
    registrar "revertir $ENTORNO"
    cd "$RUTA"
    exec ./infra/revertir.sh "$ENTORNO"
    ;;

  *)
    rechazar "accion no permitida: '$ACCION'"
    ;;
esac
