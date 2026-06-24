'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { useEventoContext } from '@/contexts/EventoContext';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { RowMenu } from '@/components/ui/RowMenu';
import { EventoFormModal } from './EventoFormModal';
import { DuplicarConfigModal } from './DuplicarConfigModal';
import { EstadoEvento } from '@/types/enums';
import { ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { EventoEntity } from '@/types/models';

export function EventosView() {
  const { mostrar } = useToast();
  const { recargarEventos } = useEventoContext();
  const [eventos, setEventos] = useState<EventoEntity[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<EventoEntity | undefined>();
  const [eventoDuplicando, setEventoDuplicando] = useState<EventoEntity | null>(null);

  function cargar() {
    setCargando(true);
    apiClient
      .get<EventoEntity[]>('eventos')
      .then(setEventos)
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function onGuardado() {
    cargar();
    recargarEventos();
  }

  async function cerrarEvento(evento: EventoEntity) {
    if (!confirm(`¿Cerrar el evento "${evento.nombre}"? Ya no se podran registrar ventas.`)) return;
    try {
      await apiClient.patch(`eventos/${evento.id}/cerrar`);
      mostrar('Evento cerrado', 'success');
      onGuardado();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo cerrar el evento', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-base-100">Eventos</h1>
        <Button
          onClick={() => {
            setEventoEditando(undefined);
            setModalAbierto(true);
          }}
        >
          + Nuevo evento
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargando ? (
          <PageSpinner />
        ) : eventos.length === 0 ? (
          <EmptyState message="Aun no hay eventos registrados." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Lugar</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id} className="border-b border-base-800 last:border-0 hover:bg-base-850/60">
                  <td className="px-4 py-3 font-medium text-base-100">{evento.nombre}</td>
                  <td className="px-4 py-3 text-base-300">
                    {new Date(evento.fecha).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: ZONA_HORARIA_MX,
                    })}
                  </td>
                  <td className="px-4 py-3 text-base-300">{evento.lugar ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        evento.estado === EstadoEvento.ACTIVO
                          ? 'inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300'
                          : 'inline-flex rounded-full border border-base-500/40 bg-base-600/40 px-2.5 py-0.5 text-xs text-base-300'
                      }
                    >
                      {evento.estado === EstadoEvento.ACTIVO ? 'Activo' : 'Cerrado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      actions={[
                        {
                          label: 'Editar',
                          onClick: () => {
                            setEventoEditando(evento);
                            setModalAbierto(true);
                          },
                        },
                        { label: 'Duplicar configuración', onClick: () => setEventoDuplicando(evento) },
                        {
                          label: 'Cerrar evento',
                          danger: true,
                          hidden: evento.estado === EstadoEvento.CERRADO,
                          onClick: () => cerrarEvento(evento),
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

      <EventoFormModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={onGuardado}
        evento={eventoEditando}
      />

      {eventoDuplicando && (
        <DuplicarConfigModal
          open
          onClose={() => setEventoDuplicando(null)}
          eventoOrigen={eventoDuplicando}
          eventos={eventos}
        />
      )}
    </div>
  );
}
