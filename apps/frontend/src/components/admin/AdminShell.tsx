'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { EventoProvider } from '@/contexts/EventoContext';
import { ToastProvider } from '@/components/ui/Toast';
import type { UsuarioAutenticado } from '@/types/models';

export function AdminShell({ usuario, children }: { usuario: UsuarioAutenticado; children: React.ReactNode }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <ToastProvider>
      <EventoProvider>
        <div className="flex min-h-screen bg-grid">
          <Sidebar open={sidebarAbierto} onClose={() => setSidebarAbierto(false)} rol={usuario.rol} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar usuario={usuario} onMenuClick={() => setSidebarAbierto(true)} />
            <main className="flex-1 p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </EventoProvider>
    </ToastProvider>
  );
}
