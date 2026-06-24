import { NextRequest, NextResponse } from 'next/server';
import { loginContraBackend } from '@/lib/backend-auth';
import {
  ACCESS_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  cookieBaseOptions,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  USER_COOKIE,
  userCookieOptions,
} from '@/lib/auth-cookies';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let email: unknown;
  let password: unknown;
  try {
    ({ email, password } = await request.json());
  } catch {
    return NextResponse.json({ message: 'Cuerpo de la peticion invalido' }, { status: 400 });
  }

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ message: 'Email y contrasena son obligatorios' }, { status: 400 });
  }

  let resultado: Awaited<ReturnType<typeof loginContraBackend>>;
  try {
    resultado = await loginContraBackend(email, password);
  } catch {
    return NextResponse.json({ message: 'No se pudo conectar con el servidor' }, { status: 503 });
  }

  if (!resultado.ok) {
    return NextResponse.json({ message: resultado.mensaje }, { status: resultado.status });
  }

  const response = NextResponse.json({ usuario: resultado.body.usuario });
  response.cookies.set(ACCESS_COOKIE, resultado.body.accessToken, {
    ...cookieBaseOptions(request),
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE, resultado.body.refreshToken, {
    ...cookieBaseOptions(request),
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set(USER_COOKIE, JSON.stringify(resultado.body.usuario), {
    ...userCookieOptions(request),
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
  return response;
}
