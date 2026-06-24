import { getUsuarioActual } from '@/lib/current-user';
import { PerfilContent } from '@/components/perfil/PerfilContent';

export default function MiPerfilPage() {
  return (
    <div className="p-4">
      <PerfilContent usuario={getUsuarioActual()} />
    </div>
  );
}
