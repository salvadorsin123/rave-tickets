'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { ActivoBadge } from '@/components/ui/Badge';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal } from '@/components/ui/Modal';
import { CrearAdminModal } from './CrearAdminModal';
import { EditarAdminModal } from './EditarAdminModal';
import { CambiarRolModal } from './CambiarRolModal';
import { RolNombre } from '@/types/enums';
import type { UsuarioResponse } from '@/types/models';

const ROL_LABEL: Record<RolNombre, string> = {
  [RolNombre.SUPER_ADMIN]: 'Super Administrador',
  [RolNombre.ADMIN]: 'Administrador',
  [RolNombre.ESCANEADOR]: 'Escaneador',
};

export function AdministradoresView({ esSuperAdmin }: { esSuperAdmin: boolean }) {
  const { mostrar } = useToast();
  const [administradores, setAdministradores] = useState<UsuarioResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [adminEditando, setAdminEditando] = useState<UsuarioResponse | null>(null);
  const [adminCambiandoRol, setAdminCambiandoRol] = useState<UsuarioResponse | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<{ nombre: string; password: string } | null>(null);

  function cargar() {
    setCargando(true);
    apiClient
      .get<UsuarioResponse[]>('usuarios/administradores')
      .then(setAdministradores)
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function desactivar(admin: UsuarioResponse) {
    if (!confirm(`¿Desactivar a ${admin.nombre}? No podra iniciar sesion.`)) return;
    try {
      await apiClient.patch(`usuarios/administradores/${admin.id}/desactivar`);
      mostrar('Administrador desactivado', 'success');
      cargar();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo desactivar', 'error');
    }
  }

  async function reactivar(admin: UsuarioResponse) {
    if (!confirm(`¿Reactivar a ${admin.nombre}?`)) return;
    try {
      await apiClient.patch(`usuarios/administradores/${admin.id}/reactivar`);
      mostrar('Administrador reactivado', 'success');
      cargar();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo reactivar', 'error');
    }
  }

  async function restablecerPassword(admin: UsuarioResponse) {
    if (!confirm(`¿Restablecer la contraseña de ${admin.nombre}?`)) return;
    try {
      const { passwordTemporal: nueva } = await apiClient.patch<{ passwordTemporal: string }>(
        `usuarios/administradores/${admin.id}/restablecer-password`,
      );
      setPasswordTemporal({ nombre: admin.nombre, password: nueva });
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo restablecer la contraseña', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-base-100">Administradores</h1>
        <Button onClick={() => setModalCrear(true)}>+ Nuevo administrador</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargando ? (
          <PageSpinner />
        ) : administradores.length === 0 ? (
          <EmptyState message="Aun no hay administradores registrados." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {administradores.map((admin) => (
                <tr key={admin.id} className="border-b border-base-800 last:border-0 hover:bg-base-850/60">
                  <td className="px-4 py-3 font-medium text-base-100">{admin.nombre}</td>
                  <td className="px-4 py-3 text-base-300">{admin.email}</td>
                  <td className="px-4 py-3 text-base-300">{ROL_LABEL[admin.rol]}</td>
                  <td className="px-4 py-3">
                    <ActivoBadge activo={admin.activo} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      actions={[
                        { label: 'Editar', onClick: () => setAdminEditando(admin) },
                        {
                          label: 'Restablecer contraseña',
                          hidden: !esSuperAdmin,
                          onClick: () => restablecerPassword(admin),
                        },
                        { label: 'Cambiar rol', hidden: !esSuperAdmin, onClick: () => setAdminCambiandoRol(admin) },
                        {
                          label: 'Desactivar',
                          danger: true,
                          hidden: !esSuperAdmin || !admin.activo,
                          onClick: () => desactivar(admin),
                        },
                        {
                          label: 'Reactivar',
                          hidden: !esSuperAdmin || admin.activo,
                          onClick: () => reactivar(admin),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CrearAdminModal open={modalCrear} onClose={() => setModalCrear(false)} onCreado={cargar} />
      <EditarAdminModal admin={adminEditando} onClose={() => setAdminEditando(null)} onGuardado={cargar} />
      <CambiarRolModal admin={adminCambiandoRol} onClose={() => setAdminCambiandoRol(null)} onGuardado={cargar} />

      {passwordTemporal && (
        <Modal open onClose={() => setPasswordTemporal(null)} title="Contraseña restablecida">
          <p className="text-sm text-base-300">
            Comparte esta contraseña temporal con <strong>{passwordTemporal.nombre}</strong> por un canal seguro. No
            se mostrara de nuevo.
          </p>
          <p className="mt-3 rounded-lg border border-base-600 bg-base-850 px-3 py-2 text-center font-mono text-lg text-neon-cyan">
            {passwordTemporal.password}
          </p>
        </Modal>
      )}
    </div>
  );
}
