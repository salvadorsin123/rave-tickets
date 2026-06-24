# Estrategia de seguridad y plan de escalabilidad

Complementa la sección 5 y 8 de [`01-arquitectura.md`](01-arquitectura.md) con las
decisiones concretas tomadas en la Fase 4 (infraestructura real, no solo principios).

## 1. Estrategia de seguridad

### Autenticación y sesión
- JWT de acceso (15 min) + refresh (7 días), secretos independientes y aleatorios
  (`openssl rand -base64 48`), guardados en Azure Key Vault y nunca en el repositorio.
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
- `httpsOnly: true` forzado en ambas Web Apps de Azure (TLS 1.2 mínimo en SQL Server y App
  Service).
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
- Todos los secretos (connection strings, JWT secrets) viven en Key Vault; las Web Apps los
  leen vía referencias `@Microsoft.KeyVault(...)` en `appSettings`, nunca como texto plano
  en el ARM/Bicep desplegado ni en variables de entorno commiteadas.
- Las Web Apps usan **identidad administrada** (`SystemAssigned`) para autenticarse contra
  ACR (pull de imágenes) y Key Vault (lectura de secretos) — cero credenciales de larga
  vida en el pipeline más allá del federated credential de OIDC para GitHub Actions.
- Azure SQL con firewall restringido (solo "Allow Azure Services"); en producción real se
  recomienda además una regla acotada a los rangos salientes de App Service o, idealmente,
  Private Endpoint + VNet integration (no incluido aquí para mantener el costo de
  referencia bajo, documentado como mejora futura).

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

### Escalado horizontal (App Service)
- `appServicePlanSku` es un parámetro del Bicep: para un evento grande, subir a
  `P1v3`/`P2v3` y habilitar autoscale por regla de CPU/memoria:
  ```bash
  az monitor autoscale create --resource-group rg-rave-prod \
    --resource <appServicePlanId> --min-count 2 --max-count 10 --count 2
  az monitor autoscale rule create --autoscale-name <name> --resource-group rg-rave-prod \
    --condition "CpuPercentage > 70 avg 5m" --scale out 2
  ```
- Recomendado: escalar el plan **antes** del evento (autoscale reactivo tarda minutos en
  activarse; la ventana de entrada de un rave dura eso mismo).

### Si la concurrencia de escaneo crece más allá de lo que CAS+reintentos absorbe
- Mover la validación de QR a **Redis** (Azure Cache for Redis) como capa de
  idempotencia: marcar `boletoId` como "en proceso" con `SETNX` antes de tocar SQL,
  liberando el lock al terminar. Reduce la contención en la base a costa de una
  dependencia adicional — solo se justifica para eventos de >5,000 asistentes con entrada
  concentrada en pocos minutos.
- El `ResultadoEscaneo` y el estado del boleto seguirían siendo la fuente de verdad en SQL;
  Redis solo arbitra el orden de llegada.

### Generación de PDF/QR como trabajo asíncrono
- Hoy `GenerarBoletoUseCase` genera PDF+QR de forma síncrona dentro de la request de
  `POST /ventas`. Para ventas masivas en ráfaga (preventa), esto se puede mover a un
  worker: encolar en **Azure Storage Queue** al registrar la venta, responder
  inmediatamente con el folio, y que una **Azure Function** consuma la cola, genere el PDF
  y actualice `Boleto.pdfUrl`. El admin vería el boleto en estado "generando" brevemente.
  No se implementó en el código actual porque el volumen de venta manual (un admin
  tecleando ventas en taquilla) no lo justifica; sí se justificaría para una futura venta
  en línea masiva.

### Base de datos
- Azure SQL `S0`/`S1` alcanza para miles de boletos; para eventos recurrentes con
  histórico de varios años, considerar `Hyperscale` o particionar `Escaneo`/
  `BitacoraAuditoria` por fecha si el volumen de filas crece mucho (son las tablas que más
  crecen, ya que cada escaneo y cada mutación generan una fila).
- Backups: Azure SQL hace point-in-time restore automático (7–35 días según SKU); no se
  requiere configuración adicional, pero sí decidir y documentar el RPO/RTO objetivo del
  evento real.

### Monitoreo bajo carga
- Application Insights ya está cableado (`APPLICATIONINSIGHTS_CONNECTION_STRING` en ambas
  Web Apps) — permite ver en vivo latencia de `/escaneos/validar` (debe mantenerse <1s,
  requisito explícito del enunciado) y detectar saturación antes de que el equipo en la
  puerta lo note por escaneos lentos.
