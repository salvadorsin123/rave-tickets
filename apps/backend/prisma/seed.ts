import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD_SEED_POR_DEFECTO = 'CambiameYa123!';

/**
 * Resuelve la contrasena de un usuario sembrado. En produccion exige una propia (definida por
 * env y distinta de la de ejemplo) para no crear cuentas con una contrasena publica conocida;
 * fuera de produccion cae al valor de ejemplo para conveniencia de desarrollo.
 */
function resolverPasswordSeed(nombreVar: 'SEED_ADMIN_PASSWORD' | 'SEED_SUPER_ADMIN_PASSWORD'): string {
  const valor = process.env[nombreVar];
  if (process.env.NODE_ENV === 'production') {
    if (!valor || valor === PASSWORD_SEED_POR_DEFECTO) {
      throw new Error(`${nombreVar} debe definirse con una contrasena propia en produccion (no la de ejemplo)`);
    }
    return valor;
  }
  return valor ?? PASSWORD_SEED_POR_DEFECTO;
}

const PERMISOS = [
  { nombre: 'usuarios.gestionar', descripcion: 'Crear, editar y desactivar escaneadores' },
  { nombre: 'eventos.gestionar', descripcion: 'Crear, editar y cerrar eventos' },
  { nombre: 'ventas.registrar', descripcion: 'Registrar ventas en efectivo y generar boletos' },
  { nombre: 'boletos.gestionar', descripcion: 'Cancelar, reembolsar y bloquear boletos' },
  { nombre: 'reportes.exportar', descripcion: 'Exportar reportes de ventas, boletos y escaneos' },
  { nombre: 'auditoria.consultar', descripcion: 'Consultar la bitacora de auditoria' },
  { nombre: 'escaneos.validar', descripcion: 'Validar entradas mediante codigo QR' },
];

const ROLES_PERMISOS: Record<string, string[]> = {
  super_admin: PERMISOS.map((p) => p.nombre),
  admin: PERMISOS.map((p) => p.nombre),
  escaneador: ['escaneos.validar'],
};

async function main(): Promise<void> {
  for (const permiso of PERMISOS) {
    await prisma.permiso.upsert({
      where: { nombre: permiso.nombre },
      update: {},
      create: permiso,
    });
  }

  for (const nombreRol of Object.keys(ROLES_PERMISOS)) {
    const rol = await prisma.rol.upsert({
      where: { nombre: nombreRol },
      update: {},
      create: { nombre: nombreRol },
    });

    for (const nombrePermiso of ROLES_PERMISOS[nombreRol]) {
      const permiso = await prisma.permiso.findUniqueOrThrow({ where: { nombre: nombrePermiso } });
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: rol.id, permisoId: permiso.id } },
        update: {},
        create: { rolId: rol.id, permisoId: permiso.id },
      });
    }
  }

  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'admin' } });
  const emailAdmin = process.env.SEED_ADMIN_EMAIL ?? 'admin@rave.local';
  const passwordAdmin = resolverPasswordSeed('SEED_ADMIN_PASSWORD');

  await prisma.usuario.upsert({
    where: { email: emailAdmin },
    update: {},
    create: {
      nombre: 'Administrador',
      email: emailAdmin,
      passwordHash: await bcrypt.hash(passwordAdmin, 12),
      rolId: rolAdmin.id,
      activo: true,
    },
  });

  // Nunca se reasigna el rol del admin sembrado arriba (podria correr de nuevo contra
  // una base de produccion con datos reales) -- el primer super_admin es un usuario
  // nuevo y separado, creado solo si todavia no existe ninguno.
  const rolSuperAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'super_admin' } });
  const yaExisteSuperAdmin = await prisma.usuario.findFirst({ where: { rolId: rolSuperAdmin.id } });
  if (!yaExisteSuperAdmin) {
    const emailSuperAdmin = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@rave.local';
    const passwordSuperAdmin = resolverPasswordSeed('SEED_SUPER_ADMIN_PASSWORD');

    await prisma.usuario.upsert({
      where: { email: emailSuperAdmin },
      update: {},
      create: {
        nombre: 'Administrador',
        email: emailSuperAdmin,
        passwordHash: await bcrypt.hash(passwordSuperAdmin, 12),
        rolId: rolSuperAdmin.id,
        activo: true,
      },
    });
    console.log(`Super admin sembrado: ${emailSuperAdmin} (cambiar password tras el primer login).`);
  }

  console.log(`Seed completado. Usuario admin: ${emailAdmin} (cambiar password tras el primer login).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
