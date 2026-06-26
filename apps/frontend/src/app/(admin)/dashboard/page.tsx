import { DashboardView } from '@/components/dashboard/DashboardView';
import { getUsuarioActual } from '@/lib/current-user';
import { RolNombre } from '@/types/enums';

export default function DashboardPage() {
  const usuario = getUsuarioActual();
  return <DashboardView esSuperAdmin={usuario?.rol === RolNombre.SUPER_ADMIN} />;
}
