# Despliegue en Oracle Cloud (Always Free) + Cloudflare Tunnel

Runbook paso a paso para poner RAVE en producción. Está pensado para copiar y pegar: cada
bloque se ejecuta tal cual, en el orden en que aparece.

## 0. Qué vas a montar y cuánto cuesta

```
Internet → Cloudflare (TLS, DNS, DDoS)
              │  (conexión saliente, iniciada por el servidor)
              ▼
        ┌──────────────────────── VM Ubuntu en Oracle Cloud ────────────────────────┐
        │  cloudflared → caddy → frontend-<color> (Next.js) → backend-<color> (Nest)│
        │                                                       ├── db (PostgreSQL) │
        │                                                       └── minio (S3)      │
        │                                                                           │
        │  Este stack existe DOS veces: rave-pro y rave-pre, sin nada compartido.    │
        └──────────────────────────────────────────────────────────────────────────┘
```

Caddy es el borde interno y existe por una sola razón: es donde se conmuta de color en un
despliegue sin cortar el tráfico. Ver [`09-entornos-pre-pro.md`](09-entornos-pre-pro.md)
para la operación diaria de los dos entornos; este documento cubre el montaje del servidor.

Ningún contenedor publica puertos al host y **el servidor no necesita puertos de entrada
abiertos**: el túnel sale desde la VM hacia Cloudflare. Eso elimina el paso más frágil de un
self-hosting clásico (abrir 80/443 en la Security List de Oracle *y* en el iptables de Ubuntu)
y deja la base de datos y el almacenamiento inalcanzables desde internet.

| Concepto | Costo |
|---|---|
| VM `VM.Standard.A1.Flex` (2 OCPU ARM / 12 GB) en Oracle "Always Free" | $0 |
| Cloudflare Tunnel + DNS (plan Free) | $0 |
| Dominio | lo que ya pagaste al registrarlo |
| **Total recurrente** | **$0** |

> Oracle recortó el Always Free de 4 OCPU/24 GB a 2 OCPU/12 GB en junio de 2026, sin aviso
> público. 12 GB sobran para este stack, pero da por hecho que los límites pueden volver a
> cambiar: por eso la sección 10 (respaldos fuera del servidor) no es opcional.

## 1. Prerrequisitos

- Cuenta de Oracle Cloud Free Tier. Piden tarjeta **solo para verificar identidad**; mientras
  uses recursos "Always Free" no se cobra. Al registrarte eliges una región de origen y
  **no se puede cambiar después**: elige la más cercana a donde ocurren tus eventos.
- Dominio ya delegado a Cloudflare (ya lo tienes) y acceso al dashboard de Cloudflare.
- Un cliente SSH. En Windows 10/11, el que trae PowerShell (`ssh`) sirve.

## 2. Crear la máquina virtual

En la consola de Oracle Cloud: **Compute → Instances → Create instance**.

| Campo | Valor |
|---|---|
| Image | Canonical Ubuntu (la LTS más reciente disponible) |
| Shape | `VM.Standard.A1.Flex` — **Ampere (ARM)**, 2 OCPU, 12 GB |
| Boot volume | 50 GB es suficiente (el Always Free da hasta 200 GB en total) |
| SSH keys | *Generate a key pair for me* y **descarga la llave privada** |

Guarda la llave privada en un lugar seguro (por ejemplo `C:\Users\<tu-usuario>\.ssh\rave.key`)
y anota la **IP pública** de la instancia.

> **Si sale "Out of capacity":** es lo normal en las shapes ARM gratuitas. Reintenta más tarde,
> o prueba otro *Availability Domain* dentro de la misma región. No cambies a una shape que no
> sea Always Free sin darte cuenta — ahí sí se cobra.

## 3. Conectarte y preparar el servidor

Desde tu PC (PowerShell):

```powershell
icacls C:\Users\<tu-usuario>\.ssh\rave.key /inheritance:r /grant:r "$($env:USERNAME):(R)"
ssh -i C:\Users\<tu-usuario>\.ssh\rave.key ubuntu@<IP-PUBLICA>
```

Ya dentro del servidor, actualiza el sistema e instala Docker Engine + el plugin de Compose
desde el repositorio oficial (el `docker.io` de Ubuntu trae versiones viejas):

```bash
sudo apt-get update && sudo apt-get upgrade -y

sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
```

Cierra la sesión SSH y vuelve a entrar para que tome el grupo `docker`. Verifica:

```bash
docker run --rm hello-world
docker compose version
```

## 4. Clonar el repositorio

Un clon por entorno: cada uno queda en un commit distinto, y un solo directorio no puede
estar en dos a la vez.

```bash
cd ~
git clone https://github.com/salvadorsin123/rave-tickets.git rave-pro
git clone https://github.com/salvadorsin123/rave-tickets.git rave-pre
cd rave-pre && git checkout develop && cd ~
```

## 5. Crear los túneles de Cloudflare

Un túnel por entorno. En el dashboard: **Zero Trust → Networks → Tunnels → Create a tunnel**.

1. Tipo **Cloudflared**. Nómbralos `rave-prod` y `rave-pre`.
2. En la pantalla de instalación, **copia el token** que aparece en el comando
   (`cloudflared service install <TOKEN>`). Ese `<TOKEN>` es tu `CLOUDFLARE_TUNNEL_TOKEN`.
   No instales nada en el servidor: el contenedor `cloudflared` del stack lo usa.
3. En **Public Hostnames**, agrega uno a cada túnel:

   | Campo | `rave-prod` | `rave-pre` |
   |---|---|---|
   | Subdomain | `www` | `pre` |
   | Domain | `in-fluence.party` | `in-fluence.party` |
   | Type | `HTTP` | `HTTP` |
   | URL | `caddy:80` | `caddy:80` |

   **`caddy:80`, no `frontend:3000`.** Caddy es el borde interno que permite conmutar de
   color sin cortar el tráfico; si el túnel apunta directo a un frontend, el despliegue
   azul/verde deja de funcionar. `caddy` es el nombre del servicio en Compose, y cada túnel
   resuelve el de su propia red de Docker.

4. **Protege PRE con Cloudflare Access.** En **Zero Trust → Access → Applications**, crea
   una aplicación *self-hosted* sobre `pre.in-fluence.party` con una política de PIN por
   correo limitada al tuyo. Es gratis hasta 50 usuarios. PRE contiene una copia de los datos
   de producción y no puede quedar abierto en internet.

5. **Y una segunda aplicación de Access que exceptúe la sonda de salud.** Sobre
   `pre.in-fluence.party/api/health`, con política **Bypass / Everyone**. Access gana por
   ruta más específica, así que esta excepción aplica solo a esa URL.

   Hace falta porque `desplegar.sh` verifica desde internet que el dominio ya sirve el sha
   nuevo, y sin la excepción Access interceptaría ese `curl` y devolvería la pantalla de
   login: todos los despliegues a PRE fallarían en el último paso. La sonda solo expone el
   nombre del entorno y el sha desplegado, que en un repositorio público no es información
   nueva. El script detecta este caso concreto y lo dice con nombre y apellido.

> El túnel usa HTTP hacia Caddy porque ese tramo no sale del servidor. El TLS público lo
> termina Cloudflare, y el frontend detecta HTTPS por la cabecera `x-forwarded-proto` para
> marcar las cookies de sesión como `Secure`. Por eso el Caddyfile declara
> `trusted_proxies static private_ranges`: sin eso Caddy reescribiría esa cabecera con su
> propio protocolo (http) y las sesiones dejarían de funcionar sin dar ningún error visible.

## 6. Crear los secretos de cada entorno

```bash
cd ~/rave-pro/infra
cp .env.pro.example .env.pro
chmod 600 .env.pro
```

Y lo mismo en `~/rave-pre/infra` con `.env.pre.example` → `.env.pre`.

Edita el archivo con `nano .env.pro` y llena:

| Variable | Cómo llenarla |
|---|---|
| `DB_PASSWORD` | `openssl rand -hex 32` — **hex, no base64** (ver nota abajo) |
| `MINIO_ROOT_USER` | un nombre, p. ej. `raveroot` |
| `MINIO_ROOT_PASSWORD` | `openssl rand -hex 32` |
| `MINIO_APP_ACCESS_KEY` | un nombre, p. ej. `rave-backend` |
| `MINIO_APP_SECRET_KEY` | `openssl rand -hex 32` |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (distinto al anterior) |
| `PUBLIC_HOSTNAME` | `www.in-fluence.party`, **sin** `https://` |
| `CLOUDFLARE_TUNNEL_TOKEN` | el token del paso 5 |
| `APP_ENV` | `pro` o `pre` — ya viene puesto en cada plantilla |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | tu correo y una contraseña fuerte |
| `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | idem, para el super administrador |

Los secretos JWT deben tener ≥32 caracteres y ser distintos entre sí: el backend valida esto
al arrancar y se niega a correr si no se cumple.

> **Ningún valor puede repetirse entre `.env.pro` y `.env.pre`.** No es formalismo: un
> `JWT_ACCESS_SECRET` compartido haría que un token emitido en staging fuera válido en
> producción. Genera los secretos de PRE por separado, no los copies.

> **Por qué hex y no base64 para `DB_PASSWORD`:** esa contraseña se interpola dentro de una
> URL de conexión (`postgresql://rave:${DB_PASSWORD}@db:5432/ravedb`). La salida de
> `openssl rand -base64` puede contener `/` y `+`, y un `/` rompe el parseo de la URL — el
> backend fallaría al conectar con un error confuso. `openssl rand -hex 32` da 256 bits de
> entropía usando solo `0-9a-f`, seguro dentro de una URL. Los secretos JWT sí pueden ser
> base64 porque se usan como texto, no dentro de una URL.

## 7. Arrancar la base y el almacenamiento, y crear la llave de MinIO

Los comandos de Compose para estos stacks son largos (nombre de proyecto, archivo, env-file
y los dos perfiles de color), así que conviene un alias por entorno. Repite el bloque
cambiando `pro` por `pre` cuando montes el segundo entorno:

```bash
alias dcpro='docker compose -p rave-pro -f ~/rave-pro/infra/docker-compose.stack.yml --env-file ~/rave-pro/infra/.env.pro --profile azul --profile verde'
```

El backend no usa las credenciales root de MinIO, sino una llave de servicio acotada al
bucket. Hay que crearla antes del primer arranque:

```bash
cd ~/rave-pro/infra
IMAGE_TAG=pendiente dcpro up -d db minio

# Espera a que MinIO quede "healthy"
IMAGE_TAG=pendiente dcpro ps
```

`IMAGE_TAG` es obligatorio porque el Compose lo exige, pero aquí da igual su valor: `db` y
`minio` usan imágenes públicas fijas y no dependen de él.

Ahora, dentro del contenedor de MinIO (las variables ya están disponibles ahí):

```bash
IMAGE_TAG=pendiente dcpro exec minio sh -c '
  mc alias set local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" &&
  mc mb --ignore-existing local/boletos-pdf &&
  cat > /tmp/politica.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::boletos-pdf"] },
    { "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": ["arn:aws:s3:::boletos-pdf/*"] }
  ]
}
EOF
  mc admin policy create local rave-boletos /tmp/politica.json'
```

Y creas el usuario con las credenciales que pusiste en `.env.pro`:

```bash
set -a; . ./.env.pro; set +a
IMAGE_TAG=pendiente dcpro exec minio \
  mc admin user add local "$MINIO_APP_ACCESS_KEY" "$MINIO_APP_SECRET_KEY"
IMAGE_TAG=pendiente dcpro exec minio \
  mc admin policy attach local rave-boletos --user "$MINIO_APP_ACCESS_KEY"
```

## 8. Dar acceso al pipeline y levantar el stack

El despliegue lo hace GitHub Actions por SSH. La llave es dedicada (no reutilices la de
administración) y se genera **en tu PC**, no en el servidor: así la parte privada nunca
existe en la VM y no hay que acordarse de borrarla.

En tu PC (PowerShell):

```powershell
ssh-keygen -t ed25519 -f $HOME\.ssh\rave-ci -N '""' -C "deploy@ci"
Get-Content $HOME\.ssh\rave-ci.pub
```

En el servidor, instala el wrapper y autoriza **solo la parte pública**, pegándola donde
dice `<PEGA-AQUI-LA-PUBLICA>`:

```bash
mkdir -p ~/bin && cp ~/rave-pro/infra/desplegar-remoto.sh ~/bin/ && chmod +x ~/bin/desplegar-remoto.sh

printf 'command="/home/ubuntu/bin/desplegar-remoto.sh",restrict %s\n' \
  '<PEGA-AQUI-LA-PUBLICA>' >> ~/.ssh/authorized_keys
```

`command=` hace que esa llave **solo** pueda ejecutar el wrapper, ignorando cualquier
comando que pida el cliente; `restrict` apaga port forwarding, agent forwarding y pty. El
wrapper valida el entorno y el sha antes de actuar, así que lo peor que permite la llave si
se filtrara es desplegar un commit de tu propio repositorio.

En GitHub, **Settings → Secrets and variables → Actions**, crea tres secretos:

| Secreto | Valor |
|---|---|
| `SSH_HOST` | la IP pública de la VM |
| `SSH_DEPLOY_KEY` | el contenido de `$HOME\.ssh\rave-ci` (la privada, de tu PC) |
| `SSH_KNOWN_HOSTS` | la salida de `ssh-keyscan -t ed25519 <IP>` |

En **Settings → Environments**, crea el entorno `produccion` y márcale **Required
reviewers** contigo. Eso es la puerta manual: el job de PRO se detiene y espera tu
aprobación. Crea también `pre`, sin revisores. En repositorios públicos esto no tiene costo.

Por último, marca como **públicos** los dos paquetes de GHCR la primera vez que se publiquen
(**Packages → el paquete → Package settings → Change visibility**), para que el servidor
pueda hacer `pull` sin credenciales. No contienen secretos: toda la configuración es de
runtime.

Con eso, el primer despliegue:

```bash
cd ~/rave-pro
./infra/desplegar.sh pro "$(git rev-parse HEAD)"
```

Las migraciones de Prisma se aplican solas al arrancar el backend (`prisma migrate deploy`
en `docker-entrypoint.sh`). Falta sembrar roles, permisos y los usuarios iniciales — **esto
se corre una sola vez**:

```bash
cd ~/rave-pro/infra
set -a; . ./.env.pro; set +a
IMAGE_TAG="$(git -C ~/rave-pro rev-parse HEAD)" dcpro exec \
  -e SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" \
  -e SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
  -e SEED_SUPER_ADMIN_EMAIL="$SEED_SUPER_ADMIN_EMAIL" \
  -e SEED_SUPER_ADMIN_PASSWORD="$SEED_SUPER_ADMIN_PASSWORD" \
  backend-azul npx prisma db seed
```

Después de sembrar, puedes borrar las líneas `SEED_*` de `.env.pro`. El seed usa `upsert`,
así que volver a correrlo no duplica nada.

## 9. Verificar

```bash
IMAGE_TAG=pendiente dcpro ps                        # todo Up/healthy
curl -s https://www.in-fluence.party/api/health     # {"ok":true,"env":"pro","version":"<sha>"}
```

Y la prueba que de verdad importa, **desde un celular con datos móviles** (no desde el WiFi
de tu casa), que es el escenario real de la puerta de un evento:

1. Entrar a `https://www.in-fluence.party` e iniciar sesión con el usuario del seed.
2. Crear un evento y subirle logo e imagen de fondo → ejercita MinIO.
3. Registrar una venta y descargar el PDF del boleto → ejercita MinIO + PostgreSQL.
4. Abrir la vista de escáner y escanear el QR de ese PDF → debe salir verde la primera vez y
   rojo la segunda.

Prueba también que sobrevive a un reinicio (`sudo reboot`): con `restart: unless-stopped`
todo debe volver solo, sin que tengas que entrar por SSH.

## 10. Respaldos

**Esto no es automático y es el único punto de falla real del stack.** El repositorio incluye
`infra/respaldar.sh`, que hace `pg_dump` de PostgreSQL y una copia del volumen de MinIO,
conservando 7 días.

```bash
cd ~/rave-pro
sudo mkdir -p /var/backups/rave && sudo chown $USER /var/backups/rave
./infra/respaldar.sh pro             # primera corrida manual
ls -lh /var/backups/rave/pro
```

Programarlo a diario a las 3 AM:

```bash
crontab -e
# agrega esta línea:
0 3 * * * /home/ubuntu/rave-pro/infra/respaldar.sh pro >> /var/log/rave-respaldo.log 2>&1
```

Solo se respalda PRO. PRE es desechable por diseño: `clonar-pro-a-pre.sh` lo reconstruye
desde producción cuando haga falta, y respaldarlo solo gastaría disco.

`desplegar.sh` corre además un respaldo **automático antes de cada despliegue a PRO**, sin
importar si el cambio trae migraciones o no.

**Sácalos del servidor.** Un respaldo que vive en la misma VM no te protege de perder la VM.
La opción gratuita más simple es Cloudflare R2 (10 GB gratis permanentes, misma cuenta de
Cloudflare): crea un bucket, genera un token de API S3, instala `rclone` y agrega al cron un
`rclone copy /var/backups/rave r2:rave-respaldos`.

**Prueba la restauración antes de necesitarla** — un respaldo que nunca se restauró no es un
respaldo. Copia un `.dump` a tu PC y levántalo contra el stack local:

```bash
docker compose exec -T db pg_restore -U rave -d ravedb --clean --if-exists < postgres-<sello>.dump
```

## 11. Actualizar la aplicación

Ya no se actualiza a mano ni se compila en el servidor. Push a `develop` despliega a PRE;
merge a `main` deja el despliegue a PRO esperando tu aprobación en la pestaña Actions. El
ciclo completo, la reversión y cómo refrescar PRE están en
[`09-entornos-pre-pro.md`](09-entornos-pre-pro.md).

El desarrollo sigue ocurriendo en tu PC, no en el servidor: nunca edites código aquí, o el
próximo despliegue te lo va a pisar.

## 12. Solución de problemas

| Síntoma | Causa probable / qué revisar |
|---|---|
| El dominio da error 502 de Cloudflare | El Public Hostname del túnel debe apuntar a `caddy:80` (no a `frontend:3000`), o Caddy apunta a un color apagado. Revisa `dcpro ps` y `dcpro logs cloudflared caddy`. |
| El backend reinicia en bucle | Casi siempre el `.env` del entorno: secretos JWT de menos de 32 caracteres, iguales entre sí, o valores de ejemplo. El log lo dice explícitamente. |
| La sesión se cae al recargar, solo después de meter Caddy | Caddy está pisando `X-Forwarded-Proto` y el frontend deja de marcar las cookies como `Secure`. El Caddyfile debe tener `trusted_proxies static private_ranges`. |
| `falta IMAGE_TAG` al correr un comando de Compose | Ese Compose exige el tag de forma explícita para que nadie despliegue "lo que hubiera". Para comandos de lectura basta `IMAGE_TAG=pendiente dcpro ps`. |
| Error al subir logo o generar PDF | La llave de servicio de MinIO no tiene la política adjunta (paso 7). Verifica con `mc admin policy entities local --user <access-key>`. |
| Sesión que se cae al recargar | Las cookies `Secure` no llegan: se está entrando por HTTP o sin pasar por el túnel. Entra siempre por el dominio, nunca por la IP. |
| `Out of capacity` al crear la VM | Shapes ARM agotadas en ese Availability Domain. Reintenta o cambia de AD/fault domain. |
| `E: The package cache file is corrupted` al instalar Docker | En el primer arranque las actualizaciones automáticas de Ubuntu corren en paralelo y chocan con tu `apt`. Espera a que `cloud-init status` diga `done`, y luego `sudo rm -f /var/cache/apt/*.bin && sudo apt-get clean && sudo apt-get update`. |
| `bad interpreter: /bin/sh^M` en un script | Finales de línea CRLF. El repo tiene `.gitattributes` con `eol=lf` para evitarlo; si aparece, es que se editó el archivo con una herramienta que ignoró esa configuración. |
| La build se queda sin memoria | Improbable con 12 GB, pero si pasa: `docker builder prune` para liberar caché y reintenta. |

## 13. Estado actual del despliegue

Lo aprovisionado el 2026-09-04 en la tenancy, todo en la región `mx-queretaro-1`
(la *home region*, única donde los recursos Always Free no se cobran):

| Recurso | Nombre / valor |
|---|---|
| VCN | `rave-vcn`, `10.0.0.0/16` |
| Internet Gateway | `rave-igw`, ruta `0.0.0.0/0` |
| Subred pública | `rave-subnet`, `10.0.0.0/24` |
| Instancia | `rave-prod`, `VM.Standard.A1.Flex`, 2 OCPU / 12 GB, Ubuntu 26.04 LTS aarch64 |
| Disco | 50 GB (el sistema de archivos raíz crece solo al arrancar) |
| Puertos abiertos a internet | **solo 22 (SSH)** e ICMP — el ingreso público es el túnel |
| Llave SSH | `~/.ssh/rave-oracle` en la máquina de desarrollo |

**Producción está en línea desde el 2026-09-04** en `https://www.in-fluence.party`: Docker
Engine + Compose instalados, stack corriendo, migraciones aplicadas, siembra hecha, MinIO
con su llave de servicio acotada, respaldos por cron verificados como restaurables, y
reinicio de la VM probado con recuperación automática.

Estructura en el servidor tras la migración a dos entornos:

| Ruta | Qué es |
|---|---|
| `/home/ubuntu/rave-pro` | clon en el sha de `main`, con `infra/.env.pro` y `infra/.estado/` |
| `/home/ubuntu/rave-pre` | clon en el sha de `develop`, con `infra/.env.pre` |
| `/home/ubuntu/bin/desplegar-remoto.sh` | wrapper al que está atada la llave SSH del pipeline |
| `/var/backups/rave/pro` | respaldos, retención 7 días |

**Pendiente real:** los respaldos siguen viviendo en la misma VM. Un respaldo que no sale
del servidor no protege contra perder el servidor — ver la nota de la sección 10 sobre
Cloudflare R2 + `rclone`.

## 14. Plan B

Si Oracle nunca te da la instancia ARM, el mismo código corre en un PaaS gratuito repartido:
frontend en Cloudflare Pages, backend en Render, PostgreSQL en Neon y los archivos en
Cloudflare R2. No hace falta tocar el código: `MinioStorageService` habla API S3, así que R2
funciona cambiando solo las variables `MINIO_*`. El costo es que el backend gratuito de Render
se duerme tras 15 minutos de inactividad y tarda cerca de un minuto en despertar.
