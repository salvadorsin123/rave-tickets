'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useEventoContext } from '@/contexts/EventoContext';
import { useToast } from '@/components/ui/Toast';
import { Select, Input } from '@/components/ui/Field';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { EstadoBoletoBadge } from '@/components/ui/Badge';
import { RowMenu } from '@/components/ui/RowMenu';
import { BloquearFraudeModal } from './BloquearFraudeModal';
import { EstadoBoleto, ESTADO_BOLETO_LABEL } from '@/types/enums';
import type { BoletoResponse } from '@/types/models';

const ESTADOS_TERMINALES = new Set([
  EstadoBoleto.CANCELADO,
  EstadoBoleto.REEMBOLSADO,
  EstadoBoleto.BLOQUEADO_POR_FRAUDE,
]);

export function BoletosView() {
  const { eventoId, cargando: cargandoEventos } = useEventoContext();
  const { mostrar } = useToast();
  const [boletos, setBoletos] = useState<BoletoResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [boletoBloqueando, setBoletoBloqueando] = useState<BoletoResponse | null>(null);

  function cargar() {
    if (!eventoId) {
      setBoletos([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    apiClient
      .get<BoletoResponse[]>('boletos', { eventoId, estado: estado || undefined, busqueda: busqueda || undefined })
      .then(setBoletos)
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [eventoId, estado]);

  function onBuscarSubmit(e: React.FormEvent) {
    e.preventDefault();
    cargar();
  }

  async function descargarPdf(boleto: BoletoResponse) {
    try {
      await apiClient.download(`boletos/${boleto.id}/pdf`, undefined, `${boleto.folio}.pdf`);
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo descargar el PDF', 'error');
    }
  }

  async function cancelar(boleto: BoletoResponse) {
    if (!confirm(`¿Cancelar el boleto ${boleto.folio}?`)) return;
    try {
      await apiClient.patch(`boletos/${boleto.id}/cancelar`);
      mostrar('Boleto cancelado', 'success');
      cargar();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo cancelar el boleto', 'error');
    }
  }

  async function reembolsar(boleto: BoletoResponse) {
    if (!confirm(`¿Marcar como reembolsado el boleto ${boleto.folio}?`)) return;
    try {
      await apiClient.patch(`boletos/${boleto.id}/reembolsar`);
      mostrar('Boleto reembolsado', 'success');
      cargar();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo reembolsar el boleto', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-base-100">Boletos</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} className="!py-1.5">
            <option value="">Todos los estados</option>
            {Object.values(EstadoBoleto).map((e) => (
              <option key={e} value={e}>
                {ESTADO_BOLETO_LABEL[e]}
              </option>
            ))}
          </Select>
          <form onSubmit={onBuscarSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Buscar nombre o folio"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="!py-1.5"
            />
          </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargandoEventos || cargando ? (
          <PageSpinner />
        ) : !eventoId ? (
          <EmptyState message="Selecciona un evento para ver sus boletos." />
        ) : boletos.length === 0 ? (
          <EmptyState message="No se encontraron boletos con esos filtros." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Personas</th>
                <th className="px-4 py-3">Ingresadas</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {boletos.map((boleto) => (
                <tr key={boleto.id} className="border-b border-base-800 last:border-0 hover:bg-base-850/60">
                  <td className="px-4 py-3 font-medium text-base-100">{boleto.folio}</td>
                  <td className="px-4 py-3 text-base-300">{boleto.personasCompradas}</td>
                  <td className="px-4 py-3 text-base-300">{boleto.personasIngresadas}</td>
                  <td className="px-4 py-3">
                    <EstadoBoletoBadge estado={boleto.estado} label={ESTADO_BOLETO_LABEL[boleto.estado]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      actions={[
                        { label: 'Descargar PDF', onClick: () => descargarPdf(boleto), hidden: !boleto.pdfUrl },
                        {
                          label: 'Cancelar',
                          onClick: () => cancelar(boleto),
                          hidden: ESTADOS_TERMINALES.has(boleto.estado),
                        },
                        {
                          label: 'Reembolsar',
                          onClick: () => reembolsar(boleto),
                          hidden: ESTADOS_TERMINALES.has(boleto.estado),
                        },
                        {
                          label: 'Bloquear por fraude',
                          danger: true,
                          onClick: () => setBoletoBloqueando(boleto),
                          hidden: boleto.estado === EstadoBoleto.BLOQUEADO_POR_FRAUDE,
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

      <BloquearFraudeModal
        boleto={boletoBloqueando}
        onClose={() => setBoletoBloqueando(null)}
        onBloqueado={cargar}
      />
    </div>
  );
}
