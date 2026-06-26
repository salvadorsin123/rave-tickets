import { AdministradoresView } from '@/components/administradores/AdministradoresView';
import { getUsuarioActual } from '@/lib/current-user';
import { RolNombre } from '@/types/enums';

export default function AdministradoresPage() {
  const usuario = getUsuarioActual();
  return <AdministradoresView esSuperAdmin={usuario?.rol === RolNombre.SUPER_ADMIN} />;
}
