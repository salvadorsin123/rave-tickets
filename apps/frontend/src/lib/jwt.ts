import { decodeJwt } from 'jose';
import { RolNombre } from '@/types/enums';

export interface AccessTokenPayload {
  sub: string;
  rol: RolNombre;
  exp: number;
  iat: number;
}

/**
 * Solo decodifica (no verifica firma): el backend es quien valida la firma en cada
 * request via JwtAuthGuard. Aqui solo se usa para decisiones de enrutamiento en el
 * middleware/UI (que ruta mostrar segun el rol), nunca para autorizar una accion.
 */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    return decodeJwt(token) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function estaExpirado(payload: AccessTokenPayload, margenSegundos = 10): boolean {
  return Date.now() / 1000 >= payload.exp - margenSegundos;
}
