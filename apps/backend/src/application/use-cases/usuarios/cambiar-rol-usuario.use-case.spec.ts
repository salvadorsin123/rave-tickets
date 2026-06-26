import { ConflictException, NotFoundException } from '@nestjs/common';
import { CambiarRolUsuarioUseCase } from './cambiar-rol-usuario.use-case';
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

describe('CambiarRolUsuarioUseCase', () => {
  let usuarioRepository: jest.Mocked<UsuarioRepositoryPort>;
  let bitacoraRepository: jest.Mocked<BitacoraRepositoryPort>;
  let useCase: CambiarRolUsuarioUseCase;

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
    useCase = new CambiarRolUsuarioUseCase(usuarioRepository, bitacoraRepository);
  });

  it('lanza NotFoundException si el usuario no existe', async () => {
    usuarioRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('x', RolNombre.ADMIN, { ejecutadoPorId: 'actor-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('no hace nada si el rol nuevo es igual al actual', async () => {
    const objetivo = crearUsuario('admin-1', RolNombre.ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);

    const resultado = await useCase.execute('admin-1', RolNombre.ADMIN, {
      ejecutadoPorId: 'actor-1',
      ipAddress: null,
    });

    expect(resultado).toBe(objetivo);
    expect(usuarioRepository.cambiarRol).not.toHaveBeenCalled();
    expect(bitacoraRepository.registrar).not.toHaveBeenCalled();
  });

  it('asciende a un admin a super_admin y registra en bitacora', async () => {
    const objetivo = crearUsuario('admin-1', RolNombre.ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.cambiarRol.mockResolvedValue(crearUsuario('admin-1', RolNombre.SUPER_ADMIN));

    await useCase.execute('admin-1', RolNombre.SUPER_ADMIN, { ejecutadoPorId: 'actor-1', ipAddress: null });

    expect(usuarioRepository.cambiarRol).toHaveBeenCalledWith('admin-1', RolNombre.SUPER_ADMIN);
    expect(bitacoraRepository.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: 'actor-1',
        accion: 'ADMIN_ROL_CAMBIADO',
        entidadId: 'admin-1',
        detalles: 'admin -> super_admin',
      }),
    );
  });

  it('rechaza degradar al unico super_admin activo', async () => {
    const objetivo = crearUsuario('super-1', RolNombre.SUPER_ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([objetivo]);

    await expect(
      useCase.execute('super-1', RolNombre.ADMIN, { ejecutadoPorId: 'actor-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usuarioRepository.cambiarRol).not.toHaveBeenCalled();
  });

  it('permite degradar a un super_admin si quedan otros super_admin activos', async () => {
    const objetivo = crearUsuario('super-2', RolNombre.SUPER_ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([
      objetivo,
      crearUsuario('super-1', RolNombre.SUPER_ADMIN),
    ]);
    usuarioRepository.cambiarRol.mockResolvedValue(crearUsuario('super-2', RolNombre.ADMIN));

    await useCase.execute('super-2', RolNombre.ADMIN, { ejecutadoPorId: 'actor-1', ipAddress: null });

    expect(usuarioRepository.cambiarRol).toHaveBeenCalledWith('super-2', RolNombre.ADMIN);
  });

  it('rechaza degradar al unico admin activo hacia escaneador', async () => {
    const objetivo = crearUsuario('admin-1', RolNombre.ADMIN);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.findAllByRol.mockResolvedValue([objetivo]);

    await expect(
      useCase.execute('admin-1', RolNombre.ESCANEADOR, { ejecutadoPorId: 'actor-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('no exige el invariante de admin si el usuario esta inactivo', async () => {
    const objetivo = crearUsuario('admin-1', RolNombre.ADMIN, false);
    usuarioRepository.findById.mockResolvedValue(objetivo);
    usuarioRepository.cambiarRol.mockResolvedValue(crearUsuario('admin-1', RolNombre.ESCANEADOR, false));

    await useCase.execute('admin-1', RolNombre.ESCANEADOR, { ejecutadoPorId: 'actor-1', ipAddress: null });

    expect(usuarioRepository.findAllByRol).not.toHaveBeenCalled();
    expect(usuarioRepository.cambiarRol).toHaveBeenCalledWith('admin-1', RolNombre.ESCANEADOR);
  });
});
