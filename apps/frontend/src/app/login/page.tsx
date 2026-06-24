import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4">
      <div className="w-full max-w-sm rounded-2xl border border-base-700 bg-base-900/90 p-8 shadow-neon">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* Chip blanco: el logo es negro sobre transparente y el fondo de la tarjeta es casi negro. */}
          <div className="rounded-xl bg-white px-5 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/branding/InfluencePNG.png" alt="IN FLUENCE" className="h-16 w-auto" />
          </div>
          <p className="text-sm text-base-400">Acceso para administradores y escaneadores</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
