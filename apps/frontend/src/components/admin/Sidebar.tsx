'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { RolNombre } from '@/types/enums';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/eventos', label: 'Eventos', icon: '🎪' },
  { href: '/ventas', label: 'Ventas', icon: '🎫' },
  { href: '/boletos', label: 'Boletos', icon: '📄' },
  { href: '/escaneadores', label: 'Escaneadores', icon: '🛂' },
  { href: '/administradores', label: 'Administradores', icon: '🔑' },
  { href: '/reportes', label: 'Reportes', icon: '📈' },
  { href: '/auditoria', label: 'Auditoría', icon: '🛡️' },
];

export function Sidebar({ open, onClose, rol }: { open: boolean; onClose: () => void; rol: RolNombre }) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS.filter((item) => item.href !== '/auditoria' || rol === RolNombre.SUPER_ADMIN);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-base-700 bg-base-900 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center border-b border-base-700 px-5">
          {/* Chip blanco: el logo es negro sobre transparente y el fondo del sidebar es casi negro. */}
          <div className="rounded-lg bg-white px-3 py-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/branding/InfluencePNG.png" alt="IN FLUENCE" className="h-7 w-auto" />
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const activo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activo
                    ? 'bg-neon-violet/15 text-neon-violet shadow-neon'
                    : 'text-base-300 hover:bg-base-800 hover:text-base-100',
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-base-700 p-3">
          <Link
            href="/escanear"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neon-cyan hover:bg-base-800"
          >
            <span aria-hidden>📷</span>
            Modo escaneo
          </Link>
        </div>
      </aside>
    </>
  );
}
