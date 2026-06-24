'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { ResultadoEscaneoBadge } from '@/components/ui/Badge';
import { ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { EscaneoEntity, UsuarioResponse } from '@/types/models';

const RESULTADO_LABEL: Record<string, string> = {
  Valido: 'Válido',
  YaUtilizado: 'Ya utilizado',
  Invalido: 'Inválido',
  Fraude: 'Fraude',
};

export function ActividadModal({ escaneador, onClose }: { escaneador: UsuarioResponse | null; onClose: () => void }) {
  const [escaneos, setEscaneos] = useState<EscaneoEntity[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!escaneador) return;
    setCargando(true);
    apiClient
      .get<EscaneoEntity[]>(`usuarios/escaneadores/${escaneador.id}/actividad`)
      .then(setEscaneos)
      .finally(() => setCargando(false));
  }, [escaneador]);

  if (!escaneador) return null;

  return (
    <Modal open onClose={onClose} title={`Actividad de ${escaneador.nombre}`} widthClassName="max-w-2xl">
      {cargando ? (
        <PageSpinner />
      ) : escaneos.length === 0 ? (
        <EmptyState message="Este escaneador aun no ha registrado escaneos." />
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700 text-left text-xs uppercase text-base-400">
                <th className="px-3 py-2">Fecha y hora</th>
                <th className="px-3 py-2">Personas</th>
                <th className="px-3 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {escaneos.map((escaneo) => (
                <tr key={escaneo.id} className="border-b border-base-800 last:border-0">
                  <td className="px-3 py-2 text-base-300">
                    {new Date(escaneo.fechaHora).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                      timeZone: ZONA_HORARIA_MX,
                    })}
                  </td>
                  <td className="px-3 py-2 text-base-300">{escaneo.personasIngresadasEnEsteEscaneo}</td>
                  <td className="px-3 py-2">
                    <ResultadoEscaneoBadge resultado={escaneo.resultado} label={RESULTADO_LABEL[escaneo.resultado]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
