'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { UsuarioResponse } from '@/types/models';

export function EditarEscaneadorModal({
  escaneador,
  onClose,
  onGuardado,
}: {
  escaneador: UsuarioResponse | null;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const { mostrar } = useToast();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!escaneador) return;
    setNombre(escaneador.nombre);
    setEmail(escaneador.email);
    setActivo(escaneador.activo);
  }, [escaneador]);

  if (!escaneador) return null;
  const escaneadorActual = escaneador;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await apiClient.patch(`usuarios/escaneadores/${escaneadorActual.id}`, { nombre, email, activo });
      mostrar('Escaneador actualizado', 'success');
      onGuardado();
      onClose();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo actualizar el escaneador', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Editar — ${escaneador.nombre}`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select label="Estado" value={activo ? '1' : '0'} onChange={(e) => setActivo(e.target.value === '1')}>
          <option value="1">Activo</option>
          <option value="0">Inactivo</option>
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
