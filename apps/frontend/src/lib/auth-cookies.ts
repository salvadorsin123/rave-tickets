import { NextRequest } from 'next/server';

export const ACCESS_COOKIE = 'rave_at';
export const REFRESH_COOKIE = 'rave_rt';
/** Solo datos no sensibles (id/nombre/email/rol) para que la UI los muestre sin decodificar el JWT en el cliente. */
export const USER_COOKIE = 'rave_user';

export const ACCESS_TOKEN_MAX_AGE_SECONDS = Number(process.env.ACCESS_TOKEN_MAX_AGE_SECONDS ?? 900);
export const REFRESH_TOKEN_MAX_AGE_SECONDS = Number(process.env.REFRESH_TOKEN_MAX_AGE_SECONDS ?? 604800);

/**
 * NODE_ENV=production no implica HTTPS: en docker-compose local el sitio se sirve por HTTP
 * plano con esa misma env var. Un navegador real descarta silenciosamente las cookies
 * `Secure` servidas sobre HTTP, rompiendo la sesion sin error visible. Por eso la deteccion
 * de HTTPS se hace por request (cabecera que pone el proxy de Azure), no por NODE_ENV.
 */
export function esConexionSegura(request: NextRequest): boolean {
  return request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:';
}

export function cookieBaseOptions(request: NextRequest) {
  return {
    httpOnly: true,
    secure: esConexionSegura(request),
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function userCookieOptions(request: NextRequest) {
  return {
    httpOnly: false,
    secure: esConexionSegura(request),
    sameSite: 'lax' as const,
    path: '/',
  };
}
