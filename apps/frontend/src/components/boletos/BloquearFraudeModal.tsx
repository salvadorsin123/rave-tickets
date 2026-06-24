'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { BoletoResponse } from '@/types/models';

export function BloquearFraudeModal({
  boleto,
  onClose,
  onBloqueado,
}: {
  boleto: BoletoResponse | null;
  onClose: () => void;
  onBloqueado: () => void;
}) {
  const { mostrar } = useToast();
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!boleto) return null;
  const boletoActual = boleto;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await apiClient.patch(`boletos/${boletoActual.id}/bloquear-fraude`, { motivo: motivo || undefined });
      mostrar(`Boleto ${boletoActual.folio} bloqueado por fraude`, 'success');
      onBloqueado();
      onClose();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo bloquear el boleto', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Bloquear por fraude — ${boleto.folio}`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-base-400">
          Esta accion es irreversible: el boleto quedara bloqueado y no admitira mas ingresos.
        </p>
        <Textarea
          label="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej. QR duplicado detectado en dos accesos simultaneos"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" loading={guardando}>
            Bloquear boleto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
