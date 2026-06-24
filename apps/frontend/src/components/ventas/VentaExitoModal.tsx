'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import type { VentaConBoleto } from '@/types/models';

export function VentaExitoModal({ resultado, onClose }: { resultado: VentaConBoleto | null; onClose: () => void }) {
  const { mostrar } = useToast();
  const [descargando, setDescargando] = useState(false);

  if (!resultado) return null;
  const resultadoActual = resultado;

  async function descargarPdf() {
    setDescargando(true);
    try {
      await apiClient.download(
        `boletos/${resultadoActual.boleto.id}/pdf`,
        undefined,
        `${resultadoActual.boleto.folio}.pdf`,
      );
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo descargar el PDF', 'error');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Venta registrada">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">🎫</span>
        <p className="text-lg font-bold text-neon-green">Folio {resultado.boleto.folio}</p>
        <p className="text-sm text-base-300">
          {resultado.venta.nombreComprador} · {resultado.venta.cantidadPersonas}{' '}
          {resultado.venta.cantidadPersonas === 1 ? 'persona' : 'personas'}
        </p>
        <p className="text-xs text-base-500">El PDF con el código QR ya fue generado y almacenado.</p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={descargarPdf} loading={descargando}>
            Descargar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
