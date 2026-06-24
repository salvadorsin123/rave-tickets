'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { EventoEntity } from '@/types/models';

export function DuplicarConfigModal({
  open,
  onClose,
  eventoOrigen,
  eventos,
}: {
  open: boolean;
  onClose: () => void;
  eventoOrigen: EventoEntity;
  eventos: EventoEntity[];
}) {
  const { mostrar } = useToast();
  const [eventoDestinoId, setEventoDestinoId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const opciones = eventos.filter((e) => e.id !== eventoOrigen.id);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eventoDestinoId) return;
    setGuardando(true);
    try {
      await apiClient.post(`eventos/${eventoOrigen.id}/duplicar-configuracion`, { eventoDestinoId });
      mostrar('Configuración duplicada correctamente', 'success');
      onClose();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo duplicar la configuración', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Duplicar configuración de "${eventoOrigen.nombre}"`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Select label="Evento destino" required value={eventoDestinoId} onChange={(e) => setEventoDestinoId(e.target.value)}>
          <option value="">Selecciona un evento</option>
          {opciones.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </Select>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando} disabled={!eventoDestinoId}>
            Duplicar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
