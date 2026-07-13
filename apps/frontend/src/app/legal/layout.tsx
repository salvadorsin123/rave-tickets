import Link from 'next/link';
import { ReactNode } from 'react';

const navItems = [
  { href: '/legal/terminos', label: 'Términos y Condiciones' },
  { href: '/legal/privacidad', label: 'Aviso de Privacidad' },
  { href: '/legal/seguridad', label: 'Política de Seguridad' },
  { href: '/legal/cookies', label: 'Política de Cookies' },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-grid">
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="rounded-xl bg-white px-5 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/branding/InfluencePNG.png" alt="IN FLUENCE" className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-neon-violet">Información Legal</h1>
          </div>

          {/* Navigation */}
          <nav className="mb-8 flex flex-wrap justify-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-base-700 bg-base-900/80 px-4 py-2 text-sm transition-colors hover:border-neon-violet hover:bg-base-800 text-base-300 hover:text-neon-violet"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Content */}
          <div className="rounded-2xl border border-base-700 bg-base-900/90 p-8 shadow-neon prose-dark">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-col items-center gap-4 text-center text-xs text-base-400">
            <Link href="/login" className="text-neon-violet transition-colors hover:text-neon-cyan">
              Volver al acceso
            </Link>
            <p>© [AÑO] [RAZÓN SOCIAL]. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
