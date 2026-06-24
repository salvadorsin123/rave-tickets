import { createHash, randomBytes } from 'crypto';

/**
 * El valor plano viaja unicamente dentro del QR del PDF; en base de datos
 * solo se persiste el hash (no reversible), nunca el token en claro.
 */
export class TokenValidacion {
  private constructor(
    public readonly valorPlano: string,
    public readonly hash: string,
  ) {}

  static generar(): TokenValidacion {
    const valorPlano = randomBytes(32).toString('hex');
    return new TokenValidacion(valorPlano, TokenValidacion.hashear(valorPlano));
  }

  static hashear(valorPlano: string): string {
    return createHash('sha256').update(valorPlano).digest('hex');
  }

  coincideCon(hashAlmacenado: string): boolean {
    return this.hash === hashAlmacenado;
  }
}
