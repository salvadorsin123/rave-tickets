import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
  TOKEN_SERVICE,
  TokenServicePort,
} from '@application/ports/infrastructure.port';
import { LoginDto, LoginResponseDto } from '@application/dtos/auth.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const usuario = await this.usuarioRepository.findByEmail(dto.email);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordValida = await this.passwordHasher.comparar(dto.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = { sub: usuario.id, rol: usuario.rolNombre };
    return {
      accessToken: this.tokenService.generarAccessToken(payload),
      refreshToken: this.tokenService.generarRefreshToken(payload),
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rolNombre },
    };
  }
}
