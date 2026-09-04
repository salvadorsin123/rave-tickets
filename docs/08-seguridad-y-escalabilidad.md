# Estrategia de seguridad y plan de escalabilidad

Complementa la sección 5 y 8 de [`01-arquitectura.md`](01-arquitectura.md) con las
decisiones concretas tomadas en la Fase 4 (infraestructura real, no solo principios).

## 1. Estrategia de seguridad

### Autenticación y sesión
- JWT de acceso (15 min) + refresh (7 días), secretos independientes y aleatorios
  (`openssl rand -base64 48`), guardados en `infra/.env.prod` en el servidor (ignorado por
  git) y nunca en el repositorio.
- El frontend nunca expone el JWT al navegador: actúa como BFF, guarda los tokens en
  cookies `httpOnly` + `Secure` + `SameSite=Lax` y los reenvía server-side (ver
  `apps/frontend/src/app/api/proxy`). Esto neutraliza el robo de token vía XSS, que es el
  riesgo principal de guardar JWT en `localStorage`.
- `SameSite=Lax` en cookies de sesión + el hecho de que la API solo acepta
  `Authorization: Bearer` (nunca lee cookies para autorizar) hace que un CSRF clásico
  (formulario cross-site) no pueda ejecutar acciones autenticadas: no hay cookie de sesión
  que el navegador adjunte automáticamente a una request maliciosa contra la API.

### Contraseñas y autorización
- bcrypt, cost factor 12, nunca se devuelve `passwordHash` en ninguna respuesta de la API.
- `RolesGuard` declarativo (`@Roles(...)`) en cada controller; rutas de escaneo aceptan
  `admin` y `escaneador`, el resto son admin-only.
- Restablecimiento de contraseña genera una temporal aleatoria de un solo uso que el admin
  comunica fuera de banda; nunca se envía por email en claro (no hay integración SMTP en
  el alcance actual — ver limitaciones).

### Datos del boleto / QR
- El QR solo contiene `{ uuid, token }`. El token de validación (256 bits) se genera con
  `crypto.randomBytes` y solo su hash SHA-256 se persiste en `Boleto.tokenValidacionHash`;
  el valor en claro existe únicamente dentro del QR/PDF generado una vez. Filtrar la base
  de datos completa no permite falsificar boletos.
- Estados terminales (`Cancelado`, `Reembolsado`, `BloqueadoPorFraude`) bloquean cualquier
  nuevo ingreso a nivel de dominio (`BoletoEntity.puedeRegistrarIngreso`), no solo en la UI.

### Transporte y cabeceras
- HTTPS forzado por Cloudflare: el túnel es el único ingreso público y solo sirve por TLS;
  el tráfico interno entre contenedores no sale de la red de Docker.
- `helmet()` en el backend (cabeceras de seguridad estándar: `X-Content-Type-Options`,
  `X-Frame-Options`, etc.).
- CORS restringido a `CORS_ORIGIN` (la URL real del frontend), no `*`.

### Rate limiting y abuso
- `@nestjs/throttler` global (`THROTTLE_TTL`/`THROTTLE_LIMIT`, configurable por entorno).
  Protege especialmente `/auth/login` (fuerza bruta de credenciales) y `/escaneos/validar`
  (intentos masivos de adivinar tokens válidos).
- El compare-and-swap en `incrementarIngresoAtomico` evita doble conteo cuando el mismo QR
  se escanea simultáneamente desde dos dispositivos — no es un control de seguridad per se,
  pero cierra una vía de fraude (reutilizar un boleto antes de que el primer escaneo
  termine de persistirse).

### Secretos e infraestructura
- Todos los secretos (contraseña de PostgreSQL, llaves de MinIO, secretos JWT) viven en
  `infra/.env.prod`, creado directamente en el servidor y listado en `.gitignore`. Nunca se
  commitean; las plantillas versionadas (`.env.prod.example`) van con los valores vacíos.
- **Superficie de red mínima**: `docker-compose.prod.yml` no publica ningún puerto al host.
  PostgreSQL, MinIO y el backend solo son alcanzables desde la red interna de Compose, y el
  frontend solo desde `cloudflared`. El servidor no necesita puertos de entrada abiertos
  porque el túnel establece una conexión saliente hacia Cloudflare.
- El backend usa una llave de servicio de MinIO acotada al bucket `boletos-pdf`, no las
  credenciales root del contenedor.
- La validación de arranque (`apps/backend/src/config/validar-env.ts`) rechaza en
  `NODE_ENV=production` los secretos de ejemplo del stack local, para que un despliegue mal
  configurado falle ruidosamente en vez de correr inseguro.

### Auditoría
- `AuditInterceptor` global registra toda mutación HTTP (`POST/PATCH/PUT/DELETE`) en
  `BitacoraAuditoria` con usuario, acción, entidad e IP, complementando el registro fino
  que ya hacen los casos de uso críticos (cancelar/reembolsar/bloquear boleto, cada
  escaneo). Queryable por el admin vía `/auditoria`.

### Limitaciones conocidas (a documentar para el equipo, no ocultarlas)
- No hay envío real de correo (reenvío de boleto y notificación de password temporal son
  manuales/descarga directa) — no estaba en el stack tecnológico obligatorio del enunciado.
- No hay MFA para administradores; razonable de agregar si el número de cuentas admin crece.
- El rol `Permiso`/`RolPermiso` existe en el modelo de datos pero la autorización actual es
  por rol (`admin`/`escaneador`), no por permiso granular — los permisos quedaron
  modelados para una extensión futura (ver `02-casos-de-uso.md`) sin sobre-construir un
  sistema de permisos que el alcance actual no necesita.

## 2. Plan de escalabilidad (eventos de miles de asistentes)

### Dónde está el cuello de botella real
En un rave de varios miles de asistentes, la carga se concentra en una ventana muy corta:
la entrada, donde decenas de escaneadores validan QR casi simultáneamente. Es un problema
de **escritura concurrente sobre pocas filas calientes** (la tabla `Boleto`), no de
volumen total de datos.

### Mitigaciones ya implementadas en el código
- **Compare-and-swap** en `BoletoPrismaRepository.incrementarIngresoAtomico` (UPDATE
  condicionado a `personasIngresadas` esperado) con reintento acotado en
  `ValidarEntradaUseCase` — evita locks largos y resuelve la mayoría de colisiones sin
  intervención manual.
- Índices en `Boleto.eventoId`, `Boleto.estado`, `Escaneo.boletoId`/`escaneadorId`/
  `fechaHora` (ver `schema.prisma`) para que la búsqueda por `uuid` (PK) y el filtrado de
  reportes no degraden con el volumen.
- Backend stateless (JWT sin sesión en memoria) → cualquier instancia puede atender
  cualquier request, prerequisito para escalar horizontalmente.

### Escalado horizontal (Docker Compose)
- Para un evento grande, levantar réplicas del backend en la misma VM:
  ```bash
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --scale backend=3
  ```
  El DNS interno de Compose reparte las conexiones que abre el frontend entre las réplicas.
- La VM "Always Free" da 2 OCPU / 12 GB; si un evento la satura, la salida es subir
  temporalmente a una instancia de pago (se cobra por hora y se puede volver a bajar) o
  mover PostgreSQL a un servicio gestionado.
- Recomendado: escalar **antes** del evento y verificar con una prueba de carga; la ventana
  de entrada de un rave dura pocos minutos y no da tiempo a reaccionar.

### Si la concurrencia de escaneo crece más allá de lo que CAS+reintentos absorbe
- Mover la validación de QR a **Redis** (un contenedor más en el stack) como capa de
  idempotencia: marcar `boletoId` como "en proceso" con `SETNX` antes de tocar la base,
  liberando el lock al terminar. Reduce la contención en la base a costa de una
  dependencia adicional — solo se justifica para eventos de >5,000 asistentes con entrada
  concentrada en pocos minutos.
- El `ResultadoEscaneo` y el estado del boleto seguirían siendo la fuente de verdad en la base;
  Redis solo arbitra el orden de llegada.

### Generación de PDF/QR como trabajo asíncrono
- Hoy `GenerarBoletoUseCase` genera PDF+QR de forma síncrona dentro de la request de
  `POST /ventas`. Para ventas masivas en ráfaga (preventa), esto se puede mover a un
  worker: encolar en **Redis** al registrar la venta, responder inmediatamente con el folio,
  y que un contenedor worker consuma la cola, genere el PDF y actualice `Boleto.pdfUrl`. El admin vería el boleto en estado "generando" brevemente.
  No se implementó en el código actual porque el volumen de venta manual (un admin
  tecleando ventas en taquilla) no lo justifica; sí se justificaría para una futura venta
  en línea masiva.

### Base de datos
- PostgreSQL 16 en contenedor alcanza de sobra para miles de boletos; para eventos
  recurrentes con histórico de varios años, particionar `Escaneo`/`BitacoraAuditoria` por
  fecha si el volumen de filas crece mucho (son las tablas que más crecen, ya que cada
  escaneo y cada mutación generan una fila).
- Backups: **no son automáticos**, es responsabilidad nuestra. `infra/respaldar.sh` hace
  `pg_dump` + copia del bucket de MinIO y se corre por cron; ver
  `docs/07-despliegue-oracle.md`. El RPO es la frecuencia del cron (24 h por defecto) y el
  RTO es el tiempo de restaurar el dump: ambos deben revisarse antes de un evento real, y
  conviene bajar la frecuencia a horas el día del evento.

### Monitoreo bajo carga
- No hay APM instalado. Lo mínimo disponible hoy: `docker compose logs -f backend` y
  `docker stats` en el servidor, más el healthcheck de cada contenedor (`docker compose ps`).
- Pendiente identificado: instrumentar la latencia de `/escaneos/validar` (debe mantenerse
  <1s, requisito explícito del enunciado) para detectar saturación antes de que el equipo en
  la puerta lo note por escaneos lentos. Opciones sin costo: exportar métricas a un
  contenedor Prometheus + Grafana en la misma VM, o Cloudflare Web Analytics para la capa
  de ingreso.
