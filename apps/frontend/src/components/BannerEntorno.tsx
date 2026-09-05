/**
 * Aviso permanente de que esto NO es produccion.
 *
 * La misma imagen de Docker sirve a PRE y a PRO, asi que la distincion tiene que resolverse
 * en runtime: se lee APP_ENV, que inyecta el compose desde el .env del entorno. En PRO no
 * renderiza nada.
 *
 * Se complementa con el prefijo "[PRE]" del titulo (ver app/layout.tsx): la barra se pierde
 * al hacer scroll, la pestaña del navegador no.
 */
export function BannerEntorno() {
  const entorno = process.env.APP_ENV ?? 'desconocido';
  if (entorno === 'pro') {
    return null;
  }

  const version = process.env.APP_VERSION ?? 'desconocido';
  const versionCorta = version.slice(0, 7);

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-3 border-b border-neon-amber/40 bg-neon-amber/15 px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-widest text-neon-amber backdrop-blur"
    >
      <span>{entorno} — datos de prueba</span>
      <span className="font-mono text-[0.65rem] normal-case tracking-normal opacity-70">{versionCorta}</span>
    </div>
  );
}
