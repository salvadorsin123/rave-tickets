import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '@application/ports/infrastructure.port';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Ademas de la firma/expiracion (ya validadas por passport-jwt), confirma contra la BD
   * que el usuario sigue activo y que la version de sesion coincide. Asi un restablecimiento
   * de contrasena, cambio de rol o desactivacion revoca de inmediato los tokens vigentes,
   * sin esperar a que expire el access token.
   */
  async validate(payload: TokenPayload): Promise<TokenPayload> {
    const usuario = await this.usuarioRepository.findById(payload.sub);
    if (!usuario || !usuario.activo || usuario.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Sesion invalida');
    }
    return { sub: usuario.id, rol: usuario.rolNombre, tokenVersion: usuario.tokenVersion };
  }
}
