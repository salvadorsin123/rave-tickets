import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { PasswordHasherPort, TokenServicePort } from '@application/ports/infrastructure.port';

function crearUsuario(activo = true): UsuarioEntity {
  return new UsuarioEntity(
    'usuario-1',
    'Ana Admin',
    'ana@rave.local',
    'hash-almacenado',
    'rol-1',
    RolNombre.ADMIN,
    activo,
    new Date(),
    new Date(),
  );
}

describe('LoginUseCase', () => {
  let usuarioRepository: jest.Mocked<UsuarioRepositoryPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let tokenService: jest.Mocked<TokenServicePort>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    usuarioRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAllByRol: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), comparar: jest.fn() };
    tokenService = {
      generarAccessToken: jest.fn().mockReturnValue('access-token'),
      generarRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verificarRefreshToken: jest.fn(),
    };

    useCase = new LoginUseCase(usuarioRepository, passwordHasher, tokenService);
  });

  it('lanza UnauthorizedException si el usuario no existe', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'no-existe@rave.local', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza UnauthorizedException si el usuario esta inactivo', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(crearUsuario(false));

    await expect(useCase.execute({ email: 'ana@rave.local', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza UnauthorizedException si la contrasena no coincide', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(crearUsuario());
    passwordHasher.comparar.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'ana@rave.local', password: 'incorrecta' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('devuelve tokens y datos del usuario cuando las credenciales son validas', async () => {
    usuarioRepository.findByEmail.mockResolvedValue(crearUsuario());
    passwordHasher.comparar.mockResolvedValue(true);

    const resultado = await useCase.execute({ email: 'ana@rave.local', password: 'correcta' });

    expect(resultado.accessToken).toBe('access-token');
    expect(resultado.refreshToken).toBe('refresh-token');
    expect(resultado.usuario).toEqual({
      id: 'usuario-1',
      nombre: 'Ana Admin',
      email: 'ana@rave.local',
      rol: RolNombre.ADMIN,
    });
    expect(tokenService.generarAccessToken).toHaveBeenCalledWith({ sub: 'usuario-1', rol: RolNombre.ADMIN });
  });
});
