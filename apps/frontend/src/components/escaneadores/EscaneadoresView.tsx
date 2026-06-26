'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { ActivoBadge } from '@/components/ui/Badge';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal } from '@/components/ui/Modal';
import { CrearEscaneadorModal } from './CrearEscaneadorModal';
import { EditarEscaneadorModal } from './EditarEscaneadorModal';
import { ActividadModal } from './ActividadModal';
import type { UsuarioResponse } from '@/types/models';

export function EscaneadoresView() {
  const { mostrar } = useToast();
  const [escaneadores, setEscaneadores] = useState<UsuarioResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [escaneadorEditando, setEscaneadorEditando] = useState<UsuarioResponse | null>(null);
  const [escaneadorActividad, setEscaneadorActividad] = useState<UsuarioResponse | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<{ nombre: string; password: string } | null>(null);

  function cargar() {
    setCargando(true);
    apiClient
      .get<UsuarioResponse[]>('usuarios/escaneadores')
      .then(setEscaneadores)
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function desactivar(escaneador: UsuarioResponse) {
    if (!confirm(`¿Desactivar a ${escaneador.nombre}? No podra iniciar sesion.`)) return;
    try {
      await apiClient.patch(`usuarios/escaneadores/${escaneador.id}/desactivar`);
      mostrar('Escaneador desactivado', 'success');
      cargar();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo desactivar', 'error');
    }
  }

  async function reactivar(escaneador: UsuarioResponse) {
    if (!confirm(`¿Reactivar a ${escaneador.nombre}?`)) return;
    try {
      await apiClient.patch(`usuarios/escaneadores/${escaneador.id}/reactivar`);
      mostrar('Escaneador reactivado', 'success');
      cargar();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo reactivar', 'error');
    }
  }

  async function restablecerPassword(escaneador: UsuarioResponse) {
    if (!confirm(`¿Restablecer la contraseña de ${escaneador.nombre}?`)) return;
    try {
      const { passwordTemporal: nueva } = await apiClient.patch<{ passwordTemporal: string }>(
        `usuarios/escaneadores/${escaneador.id}/restablecer-password`,
      );
      setPasswordTemporal({ nombre: escaneador.nombre, password: nueva });
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo restablecer la contraseña', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-base-100">Escaneadores</h1>
        <Button onClick={() => setModalCrear(true)}>+ Nuevo escaneador</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargando ? (
          <PageSpinner />
        ) : escaneadores.length === 0 ? (
          <EmptyState message="Aun no hay escaneadores registrados." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {escaneadores.map((escaneador) => (
                <tr key={escaneador.id} className="border-b border-base-800 last:border-0 hover:bg-base-850/60">
                  <td className="px-4 py-3 font-medium text-base-100">{escaneador.nombre}</td>
                  <td className="px-4 py-3 text-base-300">{escaneador.email}</td>
                  <td className="px-4 py-3">
                    <ActivoBadge activo={escaneador.activo} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      actions={[
                        { label: 'Editar', onClick: () => setEscaneadorEditando(escaneador) },
                        { label: 'Ver actividad', onClick: () => setEscaneadorActividad(escaneador) },
                        { label: 'Restablecer contraseña', onClick: () => restablecerPassword(escaneador) },
                        {
                          label: 'Desactivar',
                          danger: true,
                          hidden: !escaneador.activo,
                          onClick: () => desactivar(escaneador),
                        },
                        {
                          label: 'Reactivar',
                          hidden: escaneador.activo,
                          onClick: () => reactivar(escaneador),
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

      <CrearEscaneadorModal open={modalCrear} onClose={() => setModalCrear(false)} onCreado={cargar} />
      <EditarEscaneadorModal escaneador={escaneadorEditando} onClose={() => setEscaneadorEditando(null)} onGuardado={cargar} />
      <ActividadModal escaneador={escaneadorActividad} onClose={() => setEscaneadorActividad(null)} />

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
