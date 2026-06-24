'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEventoContext } from '@/contexts/EventoContext';
import type { UsuarioAutenticado } from '@/types/models';

export function Topbar({ usuario, onMenuClick }: { usuario: UsuarioAutenticado; onMenuClick: () => void }) {
  const { eventos, eventoId, setEventoId, cargando } = useEventoContext();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const router = useRouter();

  async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b border-base-700 bg-base-900/80 px-4">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-base-300 hover:bg-base-800 lg:hidden"
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <div className="flex-1">
        <select
          value={eventoId ?? ''}
          onChange={(e) => setEventoId(e.target.value || null)}
          disabled={cargando || eventos.length === 0}
          className="rounded-lg border border-base-600 bg-base-850 px-3 py-1.5 text-sm text-base-100 focus:border-neon-violet focus:outline-none"
        >
          {eventos.length === 0 && <option value="">Sin eventos</option>}
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuAbierto((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-base-200 hover:bg-base-800"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neon-violet/20 text-neon-violet">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{usuario.nombre}</span>
        </button>
        {menuAbierto && (
          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-base-700 bg-base-900 py-1 shadow-lg">
            <div className="border-b border-base-700 px-3 py-2 text-xs text-base-400">{usuario.email}</div>
            <Link
              href="/perfil"
              onClick={() => setMenuAbierto(false)}
              className="block w-full px-3 py-2 text-left text-sm text-base-200 hover:bg-base-800"
            >
              Mi perfil
            </Link>
            <button
              onClick={cerrarSesion}
              className="w-full px-3 py-2 text-left text-sm text-rose-300 hover:bg-base-800"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
