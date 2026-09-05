import type { Metadata, Viewport } from 'next';
import { BannerEntorno } from '@/components/BannerEntorno';
import './globals.css';

/**
 * La misma imagen de Docker sirve a PRE y a PRO, y la unica diferencia entre ambos son
 * variables de entorno. Sin `force-dynamic`, Next.js renderizaria en tiempo de BUILD las
 * rutas que no leen cookies (/login y /legal/*) y hornearia ahi el APP_ENV del build, con
 * lo que produccion podria mostrar el banner de PRE o al reves.
 *
 * El costo es nulo en la practica: el resto de la aplicacion ya se renderiza por peticion
 * porque lee la sesion desde cookies.
 */
export const dynamic = 'force-dynamic';

const TITULO_BASE = 'RAVE — Sistema de Boletos';

export function generateMetadata(): Metadata {
  const entorno = process.env.APP_ENV ?? 'desconocido';
  return {
    title: entorno === 'pro' ? TITULO_BASE : `[${entorno.toUpperCase()}] ${TITULO_BASE}`,
    description: 'Venta y validacion de entradas para eventos rave',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d0a17',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-base-950 font-sans antialiased">
        <BannerEntorno />
        {children}
      </body>
    </html>
  );
}
