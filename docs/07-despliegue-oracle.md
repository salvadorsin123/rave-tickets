# Despliegue en Oracle Cloud (Always Free) + Cloudflare Tunnel

Runbook paso a paso para poner RAVE en producción. Está pensado para copiar y pegar: cada
bloque se ejecuta tal cual, en el orden en que aparece.

## 0. Qué vas a montar y cuánto cuesta

```
Internet → Cloudflare (TLS, DNS, DDoS)
              │  (conexión saliente, iniciada por el servidor)
              ▼
        ┌──────────────────────── VM Ubuntu en Oracle Cloud ────────────────────────┐
        │  cloudflared → frontend (Next.js :3000) → backend (NestJS :3001)          │
        │                                              ├── db (PostgreSQL 16)       │
        │                                              └── minio (S3, PDFs/imágenes)│
        └──────────────────────────────────────────────────────────────────────────┘
```

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

```bash
cd ~
git clone https://github.com/salvadorsin123/rave-tickets.git
cd rave-tickets
```

## 5. Crear el túnel de Cloudflare

En el dashboard de Cloudflare: **Zero Trust → Networks → Tunnels → Create a tunnel**.

1. Tipo **Cloudflared**. Ponle un nombre (por ejemplo `rave-prod`).
2. En la pantalla de instalación, **copia el token** que aparece en el comando
   (`cloudflared service install <TOKEN>`). Ese `<TOKEN>` es tu `CLOUDFLARE_TUNNEL_TOKEN`.
   No instales nada en el servidor: el contenedor `cloudflared` del stack lo usa.
3. En **Public Hostnames**, agrega uno:

   | Campo | Valor |
   |---|---|
   | Subdomain | `boletos` (o el que prefieras) |
   | Domain | tu dominio |
   | Type | `HTTP` |
   | URL | `frontend:3000` |

   `frontend` es el nombre del servicio en Compose: `cloudflared` corre en la misma red de
   Docker y lo resuelve por DNS interno. Cloudflare crea solo el registro DNS.

> El túnel usa HTTP hacia el frontend porque ese tramo no sale del servidor. El TLS público
> lo termina Cloudflare, y el frontend detecta HTTPS por la cabecera `x-forwarded-proto` para
> marcar las cookies de sesión como `Secure`.

## 6. Crear los secretos de producción

```bash
cd ~/rave-tickets/infra
cp .env.prod.example .env.prod
chmod 600 .env.prod

# Genera cada secreto y pégalo en el archivo:
openssl rand -base64 48
```

Edita `.env.prod` con `nano .env.prod` y llena:

| Variable | Cómo llenarla |
|---|---|
| `DB_PASSWORD` | `openssl rand -base64 48` |
| `MINIO_ROOT_USER` | un nombre, p. ej. `raveroot` |
| `MINIO_ROOT_PASSWORD` | `openssl rand -base64 48` |
| `MINIO_APP_ACCESS_KEY` | un nombre, p. ej. `rave-backend` |
| `MINIO_APP_SECRET_KEY` | `openssl rand -base64 48` |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` (distinto al anterior) |
| `PUBLIC_HOSTNAME` | `boletos.tudominio.com`, **sin** `https://` |
| `CLOUDFLARE_TUNNEL_TOKEN` | el token del paso 5 |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | tu correo y una contraseña fuerte |
| `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | idem, para el super administrador |

Los secretos JWT deben tener ≥32 caracteres y ser distintos entre sí: el backend valida esto
al arrancar y se niega a correr si no se cumple.

## 7. Arrancar la base y el almacenamiento, y crear la llave de MinIO

El backend no usa las credenciales root de MinIO, sino una llave de servicio acotada al
bucket. Hay que crearla antes del primer arranque:

```bash
cd ~/rave-tickets/infra
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db minio

# Espera a que MinIO quede "healthy"
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Ahora, dentro del contenedor de MinIO (las variables ya están disponibles ahí):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec minio sh -c '
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

Y creas el usuario con las credenciales que pusiste en `.env.prod`:

```bash
set -a; . ./.env.prod; set +a
docker compose -f docker-compose.prod.yml --env-file .env.prod exec minio \
  mc admin user add local "$MINIO_APP_ACCESS_KEY" "$MINIO_APP_SECRET_KEY"
docker compose -f docker-compose.prod.yml --env-file .env.prod exec minio \
  mc admin policy attach local rave-boletos --user "$MINIO_APP_ACCESS_KEY"
```

## 8. Levantar el stack completo

```bash
cd ~/rave-tickets/infra
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

La primera construcción tarda: compila el backend de NestJS y el frontend de Next.js sobre
ARM. Con 12 GB de RAM no hace falta swap. Sigue el avance con:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f
```

Las migraciones de Prisma se aplican solas al arrancar el backend (`prisma migrate deploy`
en `docker-entrypoint.sh`). Falta sembrar roles, permisos y los usuarios iniciales — **esto
se corre una sola vez**:

```bash
set -a; . ./.env.prod; set +a
docker compose -f docker-compose.prod.yml --env-file .env.prod exec \
  -e SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" \
  -e SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
  -e SEED_SUPER_ADMIN_EMAIL="$SEED_SUPER_ADMIN_EMAIL" \
  -e SEED_SUPER_ADMIN_PASSWORD="$SEED_SUPER_ADMIN_PASSWORD" \
  backend npx prisma db seed
```

Después de sembrar, puedes borrar las líneas `SEED_*` de `.env.prod`. El seed usa `upsert`,
así que volver a correrlo no duplica nada.

## 9. Verificar

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps   # todo Up/healthy
curl -I https://boletos.tudominio.com                                # 200 y certificado válido
```

Y la prueba que de verdad importa, **desde un celular con datos móviles** (no desde el WiFi
de tu casa), que es el escenario real de la puerta de un evento:

1. Entrar a `https://boletos.tudominio.com` e iniciar sesión con el usuario del seed.
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
cd ~/rave-tickets/infra
chmod +x respaldar.sh
sudo mkdir -p /var/backups/rave && sudo chown $USER /var/backups/rave
./respaldar.sh                      # primera corrida manual
ls -lh /var/backups/rave
```

Programarlo a diario a las 3 AM:

```bash
crontab -e
# agrega esta línea:
0 3 * * * /home/ubuntu/rave-tickets/infra/respaldar.sh >> /var/log/rave-respaldo.log 2>&1
```

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

El despliegue es *pull*, no *push*: no hay workflow que despliegue solo. Desde el servidor:

```bash
cd ~/rave-tickets
git pull
cd infra
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

Las migraciones nuevas se aplican solas al reiniciar el backend. **Haz un respaldo antes de
una actualización que traiga migraciones** (`./respaldar.sh`).

El desarrollo sigue ocurriendo en tu PC, no en el servidor: nunca edites código aquí, o el
próximo `git pull` te lo va a pisar.

## 12. Solución de problemas

| Síntoma | Causa probable / qué revisar |
|---|---|
| El dominio da error 502 de Cloudflare | El frontend no está arriba, o el Public Hostname del túnel no apunta a `frontend:3000`. Revisa `docker compose ... ps` y `logs cloudflared`. |
| El backend reinicia en bucle | Casi siempre `.env.prod`: secretos JWT de menos de 32 caracteres, iguales entre sí, o valores de ejemplo. El log lo dice explícitamente. |
| Error al subir logo o generar PDF | La llave de servicio de MinIO no tiene la política adjunta (paso 7). Verifica con `mc admin policy entities local --user <access-key>`. |
| Sesión que se cae al recargar | Las cookies `Secure` no llegan: se está entrando por HTTP o sin pasar por el túnel. Entra siempre por el dominio, nunca por la IP. |
| `Out of capacity` al crear la VM | Shapes ARM agotadas en ese Availability Domain. Reintenta o cambia de AD. |
| La build se queda sin memoria | Improbable con 12 GB, pero si pasa: `docker builder prune` para liberar caché y reintenta. |

## 13. Plan B

Si Oracle nunca te da la instancia ARM, el mismo código corre en un PaaS gratuito repartido:
frontend en Cloudflare Pages, backend en Render, PostgreSQL en Neon y los archivos en
Cloudflare R2. No hace falta tocar el código: `MinioStorageService` habla API S3, así que R2
funciona cambiando solo las variables `MINIO_*`. El costo es que el backend gratuito de Render
se duerme tras 15 minutos de inactividad y tarda cerca de un minuto en despertar.
