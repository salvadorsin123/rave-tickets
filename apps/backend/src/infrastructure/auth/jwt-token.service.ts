import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload, TokenServicePort } from '@application/ports/infrastructure.port';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  // Se resuelven al construir con getOrThrow: si falta un secreto, el arranque falla de
  // inmediato en vez de firmar/verificar tokens con `undefined` (que passport aceptaria
  // como cualquier valor y romperia la seguridad de forma silenciosa).
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExpiresIn = configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    this.refreshExpiresIn = configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  generarAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  generarRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  verificarRefreshToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.verify<TokenPayload>(token, { secret: this.refreshSecret });
    } catch {
      return null;
    }
  }
}
