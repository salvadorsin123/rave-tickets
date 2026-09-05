# Entornos PRE y PRO

Guía operativa del día a día. Para el montaje inicial del servidor ver
[`07-despliegue-oracle.md`](07-despliegue-oracle.md).

## 1. El mapa

Dos entornos aislados en la misma VM, con la misma topología y el mismo archivo de Compose:

| | PRE | PRO |
|---|---|---|
| Dominio | `pre.in-fluence.party` (detrás de Cloudflare Access) | `www.in-fluence.party` |
| Rama | `develop` | `main` |
| Despliegue | automático al hacer push | automático **con aprobación manual** |
| Proyecto Compose | `rave-pre` | `rave-pro` |
| Clon en el servidor | `/home/ubuntu/rave-pre` | `/home/ubuntu/rave-pro` |
| Datos | copia anonimizada de PRO | los reales |
| Respaldos | ninguno (es desechable) | cron diario a las 3 AM |

```
Internet ─→ Cloudflare ─→ cloudflared ─→ caddy ─→ frontend-<color> ─→ backend-<color>
                                                                          ├── db
   (un stack completo por entorno, sin nada compartido entre ellos)        └── minio
```

Nada se comparte entre entornos: ni volúmenes, ni red, ni secretos. **Los secretos son
distintos a propósito.** Si PRE y PRO compartieran `JWT_ACCESS_SECRET`, un token emitido en
staging sería válido en producción.

Como ningún servicio publica puertos al host —el ingreso es siempre el túnel— no hay
conflictos de puertos posibles entre los dos stacks.

## 2. El ciclo de trabajo

```
rama de trabajo → PR a develop → merge → PRE despliega solo → verificas en PRE
                                                                    │
                              PR de develop a main → merge → aprobar → PRO
```

1. **Trabajas en tu PC** contra el stack local (`infra/docker-compose.yml`).
2. **Push a `develop`.** CI corre lint, typecheck, tests y build; si pasa, publica las
   imágenes ARM64 a GHCR y despliega a PRE.
3. **Verificas en PRE.** Si el cambio trae migraciones, este es el paso que importa: PRE
   tiene datos con la forma real de producción (ver sección 4).
4. **PR de `develop` a `main` y merge.** CI vuelve a correr y el job `Desplegar a
   PRODUCCION` queda **en pausa** esperando tu aprobación en la pestaña Actions.
5. **Apruebas.** El servidor despliega a PRO **la misma imagen que ya corrió en PRE** —
   mismo tag, no una reconstrucción.

Nunca se compila en el servidor. Las imágenes se construyen en runners ARM64 de GitHub, así
que un build ya no le quita CPU a producción.

## 3. Despliegue azul/verde

Cada entorno tiene dos copias del par frontend+backend, `azul` y `verde`, tras un *profile*
de Compose. Solo una recibe tráfico; Caddy decide cuál.

`infra/desplegar.sh <entorno> <sha>` hace, en orden:

1. `pull` de las imágenes. Si el sha no está publicado, falla aquí sin haber tocado nada.
2. En PRO, **respaldo obligatorio** antes de seguir.
3. Levanta el color inactivo. El backend aplica las migraciones al arrancar.
4. Le pregunta su versión al contenedor nuevo y confirma que coincide con el sha pedido.
5. Reescribe `caddy/upstream.conf` y hace `caddy reload`. La recarga de Caddy es gradual:
   las peticiones en vuelo terminan contra el color anterior.
6. Verifica desde fuera que el dominio público ya devuelve el sha nuevo.

**Si algo falla antes del paso 5, el sitio nunca dejó de servir la versión anterior.**

El color viejo se deja encendido, así que revertir es inmediato:

```bash
cd /home/ubuntu/rave-pro && ./infra/revertir.sh pro
```

Eso reescribe el upstream y recarga Caddy: menos de un segundo, sin descargar ni reconstruir
nada. Si el color viejo ya no está arriba (por ejemplo, tras dos despliegues seguidos), la
salida te lo dice y hay que redesplegar el sha anterior con el workflow **Desplegar
(manual)** en la pestaña Actions.

### La regla que esto impone: migraciones compatibles hacia atrás

Durante la conmutación —y después de una reversión— conviven código viejo y esquema nuevo.
Revertir **no** deshace una migración.

- **Libre:** agregar tablas, agregar columnas nullable o con default, agregar índices.
- **En dos despliegues separados:** renombrar o borrar una columna, volver `NOT NULL` una
  columna existente, cambiar un tipo.

  El patrón es *expand/contract*: primero despliegas la columna nueva y el código que
  escribe en ambas; cuando esa versión ya es la estable, un segundo despliegue borra la
  vieja.

## 4. Probar migraciones antes de que toquen producción

Este es el motivo principal de que PRE exista. Una migración que funciona contra la base
vacía del `seed` puede fallar contra datos reales — por un `NOT NULL` sobre una columna con
filas existentes, por un índice único con duplicados, o simplemente por tardar demasiado.

```bash
# 1. Refresca PRE con datos de produccion (PRO solo se lee)
cd /home/ubuntu/rave-pre
PASSWORD_PRE="$(openssl rand -base64 18)" ./infra/clonar-pro-a-pre.sh

# 2. Empuja tu rama a develop y deja que el pipeline despliegue

# 3. Mira que la migracion aplico
docker compose -p rave-pre -f infra/docker-compose.stack.yml --env-file infra/.env.pre \
  --profile azul --profile verde logs backend-azul | grep -i migration
```

Si la migración falla, falla en PRE y producción ni se entera.

**Anota la `PASSWORD_PRE`**: pasa a ser la contraseña de todas las cuentas en PRE y no se
vuelve a mostrar. Se pasa en la misma línea del comando para que no quede en el historial
del shell ni en ningún archivo.

`clonar-pro-a-pre.sh` anonimiza por defecto: nombres y correos de compradores, IPs de
escaneos, y el contenido de la bitácora de auditoría (que guarda copia de los cuerpos de las
peticiones, y por tanto de los datos de cada comprador). Conserva los correos del staff —si
se ofuscan no puedes iniciar sesión— y conserva los hashes de validación de los boletos, lo
que te permite **escanear en PRE un PDF real emitido por producción** y probar el flujo de
puerta completo.

`--con-datos-reales` omite el anonimizado. Úsalo solo para reproducir un bug que dependa de
los datos exactos, y recuerda que PRE queda con datos personales de verdad.

## 5. Cómo saber en qué entorno estás

Cuatro señales, a propósito redundantes:

1. **El dominio.** `pre.` vs `www.`
2. **El banner.** PRE pinta una barra ámbar arriba con el entorno y el sha corto. PRO no
   pinta nada.
3. **El título de la pestaña.** `[PRE] RAVE — Sistema de Boletos`. Sobrevive al scroll.
4. **`/api/health`.** `{"ok":true,"env":"pre","version":"<sha>"}` — es lo que usan los
   scripts, y también la forma más rápida de confirmar qué versión está desplegada:

   ```bash
   curl -s https://www.in-fluence.party/api/health
   ```

Al operar por SSH: contenedores `rave-pre-*` frente a `rave-pro-*`, y todos los scripts
exigen el entorno como primer argumento **sin valor por defecto** — no existe forma de
tocar producción por olvidar una bandera.

Como la misma imagen sirve a los dos entornos, todo esto se resuelve en runtime leyendo
`APP_ENV`. Por eso el layout raíz declara `dynamic = 'force-dynamic'`: sin eso, Next.js
generaría `/login` y `/legal/*` en tiempo de build y hornearía ahí el entorno equivocado.

## 6. Comandos de operación

Todos los scripts viven en `infra/` y reciben el entorno como primer argumento:

```bash
cd /home/ubuntu/rave-pro          # o rave-pre

./infra/desplegar.sh pro <sha>    # normalmente lo hace el pipeline, no tú
./infra/revertir.sh pro           # vuelta al color anterior
./infra/respaldar.sh pro          # respaldo manual
```

Para inspeccionar el stack conviene un alias por entorno:

```bash
alias dcpro='docker compose -p rave-pro -f /home/ubuntu/rave-pro/infra/docker-compose.stack.yml --env-file /home/ubuntu/rave-pro/infra/.env.pro --profile azul --profile verde'
dcpro ps
dcpro logs -f backend-azul
```

Los perfiles hacen falta en cada invocación: sin ellos, `ps` esconde los servicios de color
y da una foto incompleta.

**Nunca uses `docker compose down` en estos stacks.** Se llevaría por delante la base, MinIO
y el color que está sirviendo. Los scripts usan `up`, `stop` y `rm` por servicio justamente
por eso.

## 7. Qué toca cada quién

| Acción | Quién |
|---|---|
| Desplegar a PRE | el pipeline, al hacer push a `develop` |
| Aprobar el despliegue a PRO | tú, en la pestaña Actions |
| Refrescar PRE con datos de PRO | tú, manualmente, cuando lo necesites |
| Revertir | tú, por SSH |
| Respaldar PRO | cron, a diario |

El acceso del pipeline al servidor está acotado: usa una llave SSH dedicada, atada en
`authorized_keys` a `/home/ubuntu/bin/desplegar-remoto.sh` con `command=` y `restrict`. Esa
llave no da shell ni puede leer archivos; solo puede pedir el despliegue de un commit del
propio repositorio, y el wrapper valida el entorno y el sha antes de actuar.

## 8. Solución de problemas

| Síntoma | Qué revisar |
|---|---|
| El despliegue falla en el `pull` | La imagen no se publicó: mira el job `Publicar imagenes arm64`. También puede ser que el paquete de GHCR sea privado y el servidor no tenga credenciales. |
| Falla en "verificando la version" | El color nuevo levantó con otra imagen. No se conmutó nada: el sitio sigue bien. Revisa qué tag se pidió. |
| Falla en la verificación externa | Caddy **ya** conmutó. Si el sitio está caído, `./infra/revertir.sh <entorno>`. Suele ser el túnel apuntando al servicio equivocado: debe ser `http://caddy:80`, no `frontend:3000`. |
| La sesión se cae al recargar, solo tras meter Caddy | Caddy está pisando `X-Forwarded-Proto` y el frontend deja de marcar las cookies como `Secure`. Verifica que el Caddyfile tenga `trusted_proxies static private_ranges`. |
| El despliegue a PRE falla diciendo que Access intercepta `/api/health` | Falta la aplicación de Access sobre `pre.in-fluence.party/api/health` con política **Bypass / Everyone** (sección 5 del runbook). Sin ella, Access responde el login en vez del JSON y la verificación externa nunca puede pasar. |
| `revertir.sh` dice que el color anterior no está corriendo | Ya hubo dos despliegues. Usa el workflow **Desplegar (manual)** con el sha al que quieres volver. |
| PRE quedó inconsistente | Es desechable: `clonar-pro-a-pre.sh` lo reconstruye desde producción. |
| El job de PRO no arranca | Está esperando aprobación. Pestaña Actions → el run → *Review deployments*. |
