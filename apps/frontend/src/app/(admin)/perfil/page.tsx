import { getUsuarioActual } from '@/lib/current-user';
import { PerfilContent } from '@/components/perfil/PerfilContent';

export default function PerfilPage() {
  return <PerfilContent usuario={getUsuarioActual()} />;
}
