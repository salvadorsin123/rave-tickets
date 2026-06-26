import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth-cookies';
import { decodeAccessToken } from '@/lib/jwt';
import { RolNombre, esAdminOMas } from '@/types/enums';

const ADMIN_PATHS = ['/dashboard', '/eventos', '/ventas', '/boletos', '/escaneadores', '/administradores', '/reportes'];
const SUPER_ADMIN_PATHS = ['/auditoria'];
const SCANNER_PATHS = ['/escanear', '/historial'];

function rutaHomeDe(rol: RolNombre): string {
  return esAdminOMas(rol) ? '/dashboard' : '/escanear';
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const payload = accessToken ? decodeAccessToken(accessToken) : null;
  const autenticado = Boolean(payload ?? refreshToken);

  if (pathname === '/login') {
    if (autenticado && payload) {
      return NextResponse.redirect(new URL(rutaHomeDe(payload.rol), request.url));
    }
    return NextResponse.next();
  }

  if (!autenticado) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const esRutaAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const esRutaSuperAdmin = SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p));
  const esRutaEscaneador = SCANNER_PATHS.some((p) => pathname.startsWith(p));

  if (payload && esRutaAdmin && !esAdminOMas(payload.rol)) {
    return NextResponse.redirect(new URL('/escanear', request.url));
  }

  if (payload && esRutaSuperAdmin && payload.rol !== RolNombre.SUPER_ADMIN) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/' && payload) {
    return NextResponse.redirect(new URL(rutaHomeDe(payload.rol), request.url));
  }

  if (!esRutaAdmin && !esRutaEscaneador && pathname !== '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // branding/ y robots.txt deben ser accesibles sin sesion: el logo se usa en la propia
  // pagina de login (que se ve antes de autenticarse), y robots.txt lo piden crawlers
  // anonimos -- con el matcher anterior ambos quedaban atrapados en una redireccion a /login.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|branding|robots.txt).*)'],
};
