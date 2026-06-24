import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { TOKEN_SERVICE, TokenServicePort } from '@application/ports/infrastructure.port';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = this.tokenService.verificarRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const usuario = await this.usuarioRepository.findById(payload.sub);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return { accessToken: this.tokenService.generarAccessToken({ sub: usuario.id, rol: usuario.rolNombre }) };
  }
}
