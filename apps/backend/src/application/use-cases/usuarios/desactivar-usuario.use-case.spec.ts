import { ConflictException, NotFoundException } from '@nestjs/common';
import { DesactivarUsuarioUseCase } from './desactivar-usuario.use-case';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { BitacoraRepositoryPort, UsuarioRepositoryPort } from '@application/ports/repositories.port';

function crearUsuario(id: string, rol: RolNombre, activo = true): UsuarioEntity {
  return new UsuarioEntity(
    id,
    'Nombre',
    `${id}@rave.local`,
    'hash',
    'rol-1',
    rol,
    activo,
    new Date(),
    new Date(),
  );
}

describe('DesactivarUsuarioUseCase', () => {
  let usuarioRepository: jest.Mocked<UsuarioRepositoryPort>;
  let bitacoraRepository: jest.Mocked<BitacoraRepositoryPort>;
  let useCase: DesactivarUsuarioUseCase;

  beforeEach(() => {
    usuarioRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAllByRol: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      cambiarRol: jest.fn(),
    };
    bitacoraRepository = { registrar: jest.fn(), findAll: jest.fn() };
    useCase = new DesactivarUsuarioUseCase(usuarioRepository, bitacoraRepository);
  });

  it('lanza NotFoundException si el usuario no existe', async () => {
    usuarioRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('x', {
        ejecutadoPorId: 'actor-1',
        ipAddress: null,
        rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('desactiva y registra bitacora cuando quedan otros admins activos', async () => {
    const objetivo = crearUsuario('admin-2', RolNombre.ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([objetivo, crearUsuario('admin-1', RolNombre.ADMIN)]);

    await useCase.execute('admin-2', {
      ejecutadoPorId: 'actor-1',
      ipAddress: null,
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });

    expect(objetivo.activo).toBe(false);
    // Invalida sesiones vigentes: el token viejo deja de validar contra la nueva version.
    expect(objetivo.tokenVersion).toBe(1);
    expect(usuarioRepository.update).toHaveBeenCalledWith(objetivo);
    expect(bitacoraRepository.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'actor-1', accion: 'ADMIN_DESACTIVADO', entidadId: 'admin-2' }),
    );
  });

  it('rechaza desactivar al unico admin activo', async () => {
    const objetivo = crearUsuario('admin-1', RolNombre.ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([objetivo]);

    await expect(
      useCase.execute('admin-1', {
        ejecutadoPorId: 'actor-1',
        ipAddress: null,
        rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usuarioRepository.update).not.toHaveBeenCalled();
  });

  it('rechaza desactivar al unico super_admin activo, independientemente del conteo de admins', async () => {
    const objetivo = crearUsuario('super-1', RolNombre.SUPER_ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([objetivo]);

    await expect(
      useCase.execute('super-1', {
        ejecutadoPorId: 'actor-1',
        ipAddress: null,
        rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza (como no encontrado) desactivar a un usuario fuera de rolesPermitidos', async () => {
    // Regresion: la ruta de escaneadores acota rolesPermitidos a [ESCANEADOR]; un admin no
    // debe poder desactivar a un super_admin colando su id por ese endpoint.
    const objetivo = crearUsuario('super-1', RolNombre.SUPER_ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);

    await expect(
      useCase.execute('super-1', {
        ejecutadoPorId: 'actor-1',
        ipAddress: null,
        rolesPermitidos: [RolNombre.ESCANEADOR],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(usuarioRepository.update).not.toHaveBeenCalled();
  });

  it('permite desactivar a un super_admin si quedan otros activos', async () => {
    const objetivo = crearUsuario('super-2', RolNombre.SUPER_ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([
      objetivo,
      crearUsuario('super-1', RolNombre.SUPER_ADMIN),
    ]);

    await useCase.execute('super-2', {
      ejecutadoPorId: 'actor-1',
      ipAddress: null,
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });

    expect(objetivo.activo).toBe(false);
  });
});
