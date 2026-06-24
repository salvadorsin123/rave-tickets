import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getUsuarioActual } from '@/lib/current-user';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuario = getUsuarioActual();
  if (!usuario) {
    redirect('/login');
  }

  return <AdminShell usuario={usuario}>{children}</AdminShell>;
}
