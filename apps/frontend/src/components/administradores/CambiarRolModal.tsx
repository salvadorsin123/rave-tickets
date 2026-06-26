'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { RolNombre } from '@/types/enums';
import type { UsuarioResponse } from '@/types/models';

export function CambiarRolModal({
  admin,
  onClose,
  onGuardado,
}: {
  admin: UsuarioResponse | null;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const { mostrar } = useToast();
  const [rol, setRol] = useState<RolNombre>(RolNombre.ADMIN);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!admin) return;
    setRol(admin.rol);
  }, [admin]);

  if (!admin) return null;
  const adminActual = admin;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await apiClient.patch(`usuarios/administradores/${adminActual.id}/cambiar-rol`, { rol });
      mostrar('Rol actualizado', 'success');
      onGuardado();
      onClose();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo cambiar el rol', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Cambiar rol — ${admin.nombre}`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Select label="Rol" value={rol} onChange={(e) => setRol(e.target.value as RolNombre)}>
          <option value={RolNombre.ADMIN}>Administrador</option>
          <option value={RolNombre.SUPER_ADMIN}>Super Administrador</option>
          <option value={RolNombre.ESCANEADOR}>Escaneador (revoca acceso de admin)</option>
        </Select>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
