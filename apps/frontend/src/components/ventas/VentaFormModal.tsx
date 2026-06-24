'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import type { VentaConBoleto } from '@/types/models';

export function VentaFormModal({
  open,
  onClose,
  eventoId,
  onRegistrada,
}: {
  open: boolean;
  onClose: () => void;
  eventoId: string;
  onRegistrada: (resultado: VentaConBoleto) => void;
}) {
  const [nombreComprador, setNombreComprador] = useState('');
  const [email, setEmail] = useState('');
  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [montoTotal, setMontoTotal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setNombreComprador('');
    setEmail('');
    setCantidadPersonas(1);
    setMontoTotal('');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const resultado = await apiClient.post<VentaConBoleto>('ventas', {
        eventoId,
        nombreComprador,
        email: email || undefined,
        cantidadPersonas,
        montoTotal: montoTotal ? Number(montoTotal) : undefined,
      });
      onRegistrada(resultado);
      limpiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la venta');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        limpiar();
        onClose();
      }}
      title="Nueva venta"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre completo del comprador"
          required
          value={nombreComprador}
          onChange={(e) => setNombreComprador(e.target.value)}
        />
        <Input
          label="Correo (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cantidad de personas"
            type="number"
            min={1}
            required
            value={cantidadPersonas}
            onChange={(e) => setCantidadPersonas(Number(e.target.value))}
          />
          <Input
            label="Monto total (opcional)"
            type="number"
            min={0}
            step="0.01"
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-neon-red">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            Registrar venta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
