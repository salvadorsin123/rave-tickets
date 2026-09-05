import { NextResponse } from 'next/server';

/**
 * Sonda de salud y de version. La usan tres cosas:
 * - el healthcheck del contenedor de frontend,
 * - infra/desplegar.sh, para confirmar que el color nuevo levanto con el sha esperado
 *   ANTES de mandarle trafico real,
 * - la verificacion externa post-despliegue contra el dominio publico.
 *
 * Es publica a proposito: el matcher del middleware excluye /api, y solo expone el nombre
 * del entorno y el sha desplegado, que en un repositorio publico no es informacion nueva.
 */

// Sin esto, Next.js renderiza la ruta en tiempo de BUILD y hornea el valor de las
// variables de entorno en la imagen. Como la misma imagen sirve a PRE y a PRO, eso haria
// que produccion reportara el entorno equivocado. Debe resolverse en cada peticion.
export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      env: process.env.APP_ENV ?? 'desconocido',
      version: process.env.APP_VERSION ?? 'desconocido',
    },
    {
      // El despliegue verifica esta respuesta a traves de Cloudflare; una version cacheada
      // haria que la verificacion aprobara un despliegue que no aterrizo.
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
