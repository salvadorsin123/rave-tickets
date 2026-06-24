import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/current-user';
import { ScannerShell } from '@/components/scanner/ScannerShell';

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  const usuario = getUsuarioActual();
  if (!usuario) {
    redirect('/login');
  }

  return <ScannerShell usuario={usuario}>{children}</ScannerShell>;
}
