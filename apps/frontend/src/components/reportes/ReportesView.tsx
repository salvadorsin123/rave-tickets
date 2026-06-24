'use client';

import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { useEventoContext } from '@/contexts/EventoContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import clsx from 'clsx';
import { FormatoReporte, TipoReporte } from '@/types/enums';
import { inputDateMxAUtc } from '@/lib/fecha-mexico';

const TIPOS: { value: TipoReporte; label: string }[] = [
  { value: TipoReporte.VENTAS, label: 'Ventas' },
  { value: TipoReporte.BOLETOS, label: 'Boletos' },
  { value: TipoReporte.ESCANEOS, label: 'Escaneos' },
];

const FORMATOS: { value: FormatoReporte; label: string; extension: string }[] = [
  { value: FormatoReporte.EXCEL, label: 'Excel', extension: 'xlsx' },
  { value: FormatoReporte.CSV, label: 'CSV', extension: 'csv' },
  { value: FormatoReporte.PDF, label: 'PDF', extension: 'pdf' },
];

export function ReportesView() {
  const { eventoId, eventos } = useEventoContext();
  const { mostrar } = useToast();
  const [tipo, setTipo] = useState<TipoReporte>(TipoReporte.VENTAS);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [exportando, setExportando] = useState<FormatoReporte | null>(null);

  const eventoActual = eventos.find((e) => e.id === eventoId);

  async function exportar(formato: FormatoReporte, extension: string) {
    setExportando(formato);
    try {
      await apiClient.download(
        'reportes/exportar',
        {
          tipo,
          formato,
          eventoId: eventoId ?? undefined,
          desde: desde ? inputDateMxAUtc(desde) : undefined,
          hasta: hasta ? inputDateMxAUtc(hasta, true) : undefined,
        },
        `${tipo}.${extension}`,
      );
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo generar el reporte', 'error');
    } finally {
      setExportando(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-base-100">Reportes</h1>
        {eventoActual && <p className="text-sm text-base-400">Evento: {eventoActual.nombre}</p>}
      </div>

      <div className="rounded-xl border border-base-700 bg-base-900/80 p-5">
        <div className="mb-5 flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTipo(t.value)}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                tipo === t.value ? 'bg-neon-violet text-white shadow-neon' : 'bg-base-800 text-base-300 hover:bg-base-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {FORMATOS.map((f) => (
            <Button
              key={f.value}
              variant="secondary"
              loading={exportando === f.value}
              onClick={() => exportar(f.value, f.extension)}
            >
              Exportar {f.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
