-- Anonimizado de PRE tras restaurar un snapshot de produccion.
-- Lo invoca clonar-pro-a-pre.sh; no correr a mano contra PRO (el script tiene una guarda,
-- este archivo no).
--
-- Se ejecuta con:  psql -v hash_password='<bcrypt>' -f anonimizar.sql
--
-- Criterio: se borra todo dato personal de COMPRADORES, y se conservan las cuentas de
-- staff (son tuyas, y si se ofuscan los correos no puedes iniciar sesion en PRE).

\set ON_ERROR_STOP on

BEGIN;

-- --- Compradores --------------------------------------------------------------
-- Valores derivados del id para que sigan siendo unicos y estables entre clonados.
UPDATE "Venta"
SET "nombreComprador" = 'Comprador ' || upper(substr(md5(id::text), 1, 8)),
    email = CASE WHEN email IS NULL THEN NULL
                 ELSE 'comprador+' || substr(md5(id::text), 1, 8) || '@ejemplo.invalid'
            END;

-- --- Bitacora de auditoria ----------------------------------------------------
-- "detalles" guarda el cuerpo de cada peticion mutante, asi que para POST /ventas contiene
-- copia literal del nombre y correo del comprador. Anonimizar solo la tabla Venta dejaria
-- los datos personales intactos aqui.
UPDATE "BitacoraAuditoria"
SET detalles = CASE WHEN detalles IS NULL THEN NULL ELSE '{"anonimizado":true}' END,
    "ipAddress" = NULL;

-- --- Escaneos -----------------------------------------------------------------
-- La IP y el user-agent identifican al dispositivo de quien escaneo.
UPDATE "Escaneo"
SET "ipAddress" = NULL,
    "deviceInfo" = NULL;

-- --- Cuentas de staff ---------------------------------------------------------
-- Contrasena unica y conocida para PRE: es lo que hace el entorno realmente usable
-- (puedes entrar como cualquier rol sin conocer las contrasenas de produccion).
-- tokenVersion se incrementa para invalidar cualquier sesion heredada del snapshot.
UPDATE "Usuario"
SET "passwordHash" = :'hash_password',
    "tokenVersion" = "tokenVersion" + 1;

COMMIT;

-- Nota deliberada: Boleto.tokenValidacionHash NO se toca. Conservarlo permite escanear en
-- PRE un PDF real emitido por produccion y probar el flujo de puerta completo sin tocar
-- PRO. El hash no permite reconstruir el token, asi que no agrega exposicion.
