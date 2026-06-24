import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
  const passwordAdmin = process.env.SEED_ADMIN_PASSWORD ?? 'CambiameYa123!';

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
