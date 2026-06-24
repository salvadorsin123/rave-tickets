import { CambiarPasswordForm } from '@/components/perfil/CambiarPasswordForm';
import type { UsuarioAutenticado } from '@/types/models';

export function PerfilContent({ usuario }: { usuario: UsuarioAutenticado | null }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-base-100">Mi perfil</h1>
        {usuario && (
          <p className="text-sm text-base-400">
            {usuario.nombre} · {usuario.email}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase text-base-400">Cambiar contraseña</h2>
        <CambiarPasswordForm />
      </div>
    </div>
  );
}
