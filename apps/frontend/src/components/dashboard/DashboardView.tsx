'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { useEventoContext } from '@/contexts/EventoContext';
import { StatCard } from '@/components/ui/Card';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { EstadisticasDashboard } from '@/types/models';

function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
    valor,
  );
}

interface DashboardViewProps {
  esSuperAdmin: boolean;
}

export function DashboardView({ esSuperAdmin }: DashboardViewProps) {
  const { eventoId } = useEventoContext();
  const [stats, setStats] = useState<EstadisticasDashboard | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    apiClient
      .get<EstadisticasDashboard>('dashboard', { eventoId: eventoId ?? undefined })
      .then(setStats)
      .finally(() => setCargando(false));
  }, [eventoId]);

  if (cargando) return <PageSpinner />;
  if (!stats) return <EmptyState message="No hay datos para mostrar todavia." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ventas totales" value={stats.ventasTotales} accent="violet" />
        <StatCard label="Ingresos totales" value={formatoMoneda(stats.ingresosTotales)} accent="cyan" />
        <StatCard label="Boletos vendidos" value={stats.boletosVendidos} accent="pink" />
        <StatCard label="% Asistencia" value={`${stats.porcentajeAsistencia.toFixed(0)}%`} accent="green" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Asistentes esperados" value={stats.asistentesEsperados} />
        <StatCard label="Asistentes ingresados" value={stats.asistentesIngresados} accent="green" />
        <StatCard label="Boletos pendientes" value={stats.boletosPendientes} accent="amber" />
        <StatCard label="Cancelados / reembolsados" value={stats.boletosCancelados + stats.boletosReembolsados} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-200">Ventas por día</h3>
          {stats.ventasPorDia.length === 0 ? (
            <EmptyState message="Sin ventas registradas." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#241a3a" />
                <XAxis dataKey="etiqueta" stroke="#9087a8" fontSize={12} />
                <YAxis stroke="#9087a8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#120e1f', border: '1px solid #33254f', borderRadius: 8 }} />
                <Bar dataKey="total" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-200">Ventas por hora</h3>
          {stats.ventasPorHora.length === 0 ? (
            <EmptyState message="Sin ventas registradas." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.ventasPorHora}>
                <CartesianGrid strokeDasharray="3 3" stroke="#241a3a" />
                <XAxis dataKey="etiqueta" stroke="#9087a8" fontSize={12} />
                <YAxis stroke="#9087a8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#120e1f', border: '1px solid #33254f', borderRadius: 8 }} />
                <Bar dataKey="total" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-200">Top escaneadores</h3>
          {stats.topEscaneadores.length === 0 ? (
            <EmptyState message="Aun no hay escaneos." />
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.topEscaneadores.map((e, i) => (
                <li key={e.escaneadorId} className="flex items-center justify-between text-sm">
                  <span className="text-base-300">
                    {i + 1}. {e.nombre}
                  </span>
                  <span className="font-semibold text-neon-cyan">{e.total} escaneos</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-200">Ingresos por evento</h3>
          {stats.ingresosPorEvento.length === 0 ? (
            <EmptyState message="Sin datos." />
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.ingresosPorEvento.map((e) => (
                <li key={e.eventoId} className="flex items-center justify-between text-sm">
                  <span className="text-base-300">{e.nombreEvento}</span>
                  <span className="font-semibold text-neon-violet">{formatoMoneda(e.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {esSuperAdmin && (
        <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-200">Actividad reciente</h3>
          {stats.actividadReciente.length === 0 ? (
            <EmptyState message="Sin actividad reciente." />
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {stats.actividadReciente.map((a, i) => (
                <li key={i} className="flex gap-3 text-base-300">
                  <span className="shrink-0 text-base-500">
                    {new Date(a.fechaHora).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: ZONA_HORARIA_MX,
                    })}
                  </span>
                  <span>{a.descripcion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
