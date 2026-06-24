'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { ResultadoEscaneoBadge } from '@/components/ui/Badge';
import { ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { EscaneoEntity } from '@/types/models';

const RESULTADO_LABEL: Record<string, string> = {
  Valido: 'Válido',
  YaUtilizado: 'Ya utilizado',
  Invalido: 'Inválido',
  Fraude: 'Fraude',
};

export function HistorialView() {
  const [escaneos, setEscaneos] = useState<EscaneoEntity[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient
      .get<EscaneoEntity[]>('escaneos/mio')
      .then(setEscaneos)
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-semibold text-base-100">Mi historial</h1>
      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900/80">
        {cargando ? (
          <PageSpinner />
        ) : escaneos.length === 0 ? (
          <EmptyState message="Aun no has registrado escaneos." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Personas</th>
                <th className="px-4 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {escaneos.map((escaneo) => (
                <tr key={escaneo.id} className="border-b border-base-800 last:border-0">
                  <td className="px-4 py-3 text-base-300">
                    {new Date(escaneo.fechaHora).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                      timeZone: ZONA_HORARIA_MX,
                    })}
                  </td>
                  <td className="px-4 py-3 text-base-300">{escaneo.personasIngresadasEnEsteEscaneo}</td>
                  <td className="px-4 py-3">
                    <ResultadoEscaneoBadge resultado={escaneo.resultado} label={RESULTADO_LABEL[escaneo.resultado]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
