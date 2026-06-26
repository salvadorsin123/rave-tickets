'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { inputDateMxAUtc, ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { BitacoraAuditoriaEntity } from '@/types/models';

export function AuditoriaView() {
  const [registros, setRegistros] = useState<BitacoraAuditoriaEntity[]>([]);
  const [cargando, setCargando] = useState(true);
  const [entidadAfectada, setEntidadAfectada] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  function cargar() {
    setCargando(true);
    apiClient
      .get<BitacoraAuditoriaEntity[]>('auditoria', {
        entidadAfectada: entidadAfectada || undefined,
        desde: desde ? inputDateMxAUtc(desde) : undefined,
        hasta: hasta ? inputDateMxAUtc(hasta, true) : undefined,
      })
      .then(setRegistros)
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    cargar();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-base-100">Auditoría</h1>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <Input
          label="Entidad"
          placeholder="Boleto, Evento, Usuario..."
          value={entidadAfectada}
          onChange={(e) => setEntidadAfectada(e.target.value)}
        />
        <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargando ? (
          <PageSpinner />
        ) : registros.length === 0 ? (
          <EmptyState message="No hay registros de auditoria con esos filtros." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id} className="border-b border-base-800 last:border-0 hover:bg-base-850/60">
                  <td className="px-4 py-3 text-base-300">
                    {new Date(registro.fechaHora).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                      timeZone: ZONA_HORARIA_MX,
                    })}
                  </td>
                  <td className="px-4 py-3 text-base-300">
                    {registro.usuarioNombre ?? registro.usuarioEmail ?? 'Sistema'}
                  </td>
                  <td className="px-4 py-3 font-medium text-base-100">{registro.accion}</td>
                  <td className="px-4 py-3 text-base-300">
                    {registro.entidadAfectada}
                    {registro.entidadId && <span className="text-base-500"> · {registro.entidadId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 text-base-500">{registro.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
