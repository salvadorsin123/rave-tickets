import { NextRequest, NextResponse } from 'next/server';
import { refrescarAccessToken } from '@/lib/backend-auth';
import { ACCESS_COOKIE, ACCESS_TOKEN_MAX_AGE_SECONDS, cookieBaseOptions, REFRESH_COOKIE } from '@/lib/auth-cookies';

function backendUrl(): string {
  return process.env.BACKEND_URL ?? 'http://localhost:3001';
}

async function reenviar(
  request: NextRequest,
  segments: string[],
  accessToken: string | undefined,
  cuerpoSolicitud: ArrayBuffer | undefined,
): Promise<Response> {
  const path = segments.join('/');
  const destino = `${backendUrl()}/${path}${request.nextUrl.search}`;

  return fetch(destino, {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: cuerpoSolicitud,
    cache: 'no-store',
  });
}

async function manejar(request: NextRequest, segments: string[]): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const tieneCuerpo = !['GET', 'HEAD', 'DELETE'].includes(request.method);
  // Se lee una sola vez: el body de un Request solo puede consumirse una vez, y este mismo
  // buffer se reutiliza si hace falta reintentar tras refrescar el access token. arrayBuffer()
  // (no text()) preserva bytes binarios intactos -- necesario para subidas multipart/form-data
  // (imagenes), que con text() llegaban corruptas al re-codificarse como UTF-8.
  const cuerpoSolicitud = tieneCuerpo ? await request.arrayBuffer() : undefined;

  let respuestaBackend: Response;
  try {
    respuestaBackend = await reenviar(request, segments, accessToken, cuerpoSolicitud);
  } catch {
    return NextResponse.json(
      { statusCode: 503, message: 'No se pudo conectar con el servidor', error: 'ServiceUnavailable' },
      { status: 503 },
    );
  }
  let nuevoAccessToken: string | null = null;

  if (respuestaBackend.status === 401 && refreshToken) {
    nuevoAccessToken = await refrescarAccessToken(refreshToken).catch(() => null);
    if (nuevoAccessToken) {
      try {
        respuestaBackend = await reenviar(request, segments, nuevoAccessToken, cuerpoSolicitud);
      } catch {
        return NextResponse.json(
          { statusCode: 503, message: 'No se pudo conectar con el servidor', error: 'ServiceUnavailable' },
          { status: 503 },
        );
      }
    }
  }

  const contentType = respuestaBackend.headers.get('content-type') ?? 'application/json';
  const contentDisposition = respuestaBackend.headers.get('content-disposition');
  // 204/205/304 no pueden llevar body segun la spec de Fetch: Response lanza si se le pasa
  // un ArrayBuffer (aunque sea de 0 bytes) junto con uno de estos status. Hay que pasar null.
  const SIN_CUERPO = new Set([204, 205, 304]);
  const cuerpo = SIN_CUERPO.has(respuestaBackend.status) ? null : await respuestaBackend.arrayBuffer();

  const response = new NextResponse(cuerpo, {
    status: respuestaBackend.status,
    headers: {
      'Content-Type': contentType,
      ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
    },
  });

  if (nuevoAccessToken) {
    response.cookies.set(ACCESS_COOKIE, nuevoAccessToken, {
      ...cookieBaseOptions(request),
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  } else if (respuestaBackend.status === 401) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }

  return response;
}

interface RouteContext {
  params: { path: string[] };
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  return manejar(request, ctx.params.path);
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  return manejar(request, ctx.params.path);
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return manejar(request, ctx.params.path);
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  return manejar(request, ctx.params.path);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  return manejar(request, ctx.params.path);
}
