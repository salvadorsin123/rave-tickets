'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useEventoContext } from '@/contexts/EventoContext';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { EstadoBoletoBadge } from '@/components/ui/Badge';
import { VentaFormModal } from './VentaFormModal';
import { VentaExitoModal } from './VentaExitoModal';
import { ESTADO_BOLETO_LABEL } from '@/types/enums';
import { ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { BoletoResponse, VentaConBoleto, VentaEntity } from '@/types/models';

function formatoMoneda(valor: number | null): string {
  if (valor == null) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
}

export function VentasView() {
  const { eventoId, eventos, cargando: cargandoEventos } = useEventoContext();
  const [ventas, setVentas] = useState<VentaEntity[]>([]);
  const [boletos, setBoletos] = useState<BoletoResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [resultadoExito, setResultadoExito] = useState<VentaConBoleto | null>(null);

  function cargar() {
    if (!eventoId) {
      setVentas([]);
      setBoletos([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    Promise.all([
      apiClient.get<VentaEntity[]>('ventas', { eventoId }),
      apiClient.get<BoletoResponse[]>('boletos', { eventoId }),
    ])
      .then(([v, b]) => {
        setVentas(v);
        setBoletos(b);
      })
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [eventoId]);

  const boletoPorVenta = new Map(boletos.map((b) => [b.ventaId, b]));
  const eventoActual = eventos.find((e) => e.id === eventoId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-base-100">Ventas</h1>
          {eventoActual && <p className="text-sm text-base-400">Evento: {eventoActual.nombre}</p>}
        </div>
        <Button onClick={() => setModalAbierto(true)} disabled={!eventoId}>
          + Nueva venta
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargandoEventos || cargando ? (
          <PageSpinner />
        ) : !eventoId ? (
          <EmptyState message="Selecciona un evento para ver sus ventas." />
        ) : ventas.length === 0 ? (
          <EmptyState message="Aun no hay ventas registradas para este evento." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Personas</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => {
                const boleto = boletoPorVenta.get(venta.id);
                return (
                  <tr key={venta.id} className="border-b border-base-800 last:border-0 hover:bg-base-850/60">
                    <td className="px-4 py-3 font-medium text-base-100">{boleto?.folio ?? '—'}</td>
                    <td className="px-4 py-3 text-base-200">{venta.nombreComprador}</td>
                    <td className="px-4 py-3 text-base-400">{venta.email ?? '—'}</td>
                    <td className="px-4 py-3 text-base-300">{venta.cantidadPersonas}</td>
                    <td className="px-4 py-3 text-base-300">{formatoMoneda(venta.montoTotal)}</td>
                    <td className="px-4 py-3 text-base-400">
                      {new Date(venta.fechaCompra).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: ZONA_HORARIA_MX,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {boleto && <EstadoBoletoBadge estado={boleto.estado} label={ESTADO_BOLETO_LABEL[boleto.estado]} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {eventoId && (
        <VentaFormModal
          open={modalAbierto}
          onClose={() => setModalAbierto(false)}
          eventoId={eventoId}
          onRegistrada={(resultado) => {
            setModalAbierto(false);
            setResultadoExito(resultado);
            cargar();
          }}
        />
      )}

      <VentaExitoModal resultado={resultadoExito} onClose={() => setResultadoExito(null)} />
    </div>
  );
}
