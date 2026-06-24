'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { RolNombre } from '@/types/enums';
import type { UsuarioAutenticado } from '@/types/models';

export function ScannerShell({ usuario, children }: { usuario: UsuarioAutenticado; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-base-950">
        <header className="border-b border-base-700 bg-base-900/90 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {/* Chip blanco: el logo es negro sobre transparente y el fondo del header es casi negro. */}
              <div className="shrink-0 rounded-md bg-white px-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/branding/InfluencePNG.png" alt="IN FLUENCE" className="h-5 w-auto" />
              </div>
              <span className="truncate text-sm font-semibold text-base-100">{usuario.nombre}</span>
            </div>
            <button
              onClick={cerrarSesion}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-base-800"
            >
              Salir
            </button>
          </div>
          <nav className="-mx-4 mt-2 flex items-center gap-1 overflow-x-auto whitespace-nowrap px-4">
            <Link
              href="/escanear"
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname === '/escanear' ? 'bg-neon-violet/20 text-neon-violet' : 'text-base-300 hover:bg-base-800'
              }`}
            >
              Escanear
            </Link>
            <Link
              href="/historial"
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname === '/historial' ? 'bg-neon-violet/20 text-neon-violet' : 'text-base-300 hover:bg-base-800'
              }`}
            >
              Mi historial
            </Link>
            <Link
              href="/mi-perfil"
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname === '/mi-perfil' ? 'bg-neon-violet/20 text-neon-violet' : 'text-base-300 hover:bg-base-800'
              }`}
            >
              Mi perfil
            </Link>
            {usuario.rol === RolNombre.ADMIN && (
              <Link
                href="/dashboard"
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-neon-cyan hover:bg-base-800"
              >
                Panel admin
              </Link>
            )}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </ToastProvider>
  );
}
