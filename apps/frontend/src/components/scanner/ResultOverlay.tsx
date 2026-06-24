import { ResultadoEscaneo } from '@/types/enums';
import { ZONA_HORARIA_MX } from '@/lib/fecha-mexico';
import type { ResultadoValidacionDto } from '@/types/models';

const ESTILOS: Record<ResultadoEscaneo, { bg: string; titulo: string; icono: string }> = {
  [ResultadoEscaneo.VALIDO]: { bg: 'bg-emerald-600 shadow-neon-green', titulo: 'ENTRADA VÁLIDA', icono: '✅' },
  [ResultadoEscaneo.YA_UTILIZADO]: { bg: 'bg-amber-600 shadow-neon-red', titulo: 'YA FUE UTILIZADA', icono: '❌' },
  [ResultadoEscaneo.INVALIDO]: { bg: 'bg-rose-600 shadow-neon-red', titulo: 'QR NO VÁLIDO', icono: '❌' },
  [ResultadoEscaneo.FRAUDE]: { bg: 'bg-rose-800 shadow-neon-red', titulo: 'BLOQUEADO — POSIBLE FRAUDE', icono: '🚫' },
  [ResultadoEscaneo.SALIDA_VALIDA]: { bg: 'bg-cyan-600 shadow-neon-green', titulo: 'SALIDA REGISTRADA', icono: '🚪' },
  [ResultadoEscaneo.SIN_INGRESOS]: { bg: 'bg-amber-600 shadow-neon-red', titulo: 'NADIE DENTRO', icono: '⚠️' },
};

export function ResultOverlay({ resultado }: { resultado: ResultadoValidacionDto }) {
  const estilo = ESTILOS[resultado.resultado];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6 text-center text-white ${estilo.bg}`}>
      <span className="text-6xl">{estilo.icono}</span>
      <h1 className="text-2xl font-extrabold tracking-wide">{estilo.titulo}</h1>

      {resultado.boleto && (
        <div className="mt-2 flex flex-col gap-1 text-lg">
          <span className="font-semibold">{resultado.boleto.nombreComprador}</span>
          <span>Boleto {resultado.boleto.folio}</span>
          <span>
            {resultado.boleto.personasIngresadas} / {resultado.boleto.personasCompradas} personas
          </span>
          <span className="text-sm opacity-80">
            Compra: {new Date(resultado.boleto.fechaCompra).toLocaleDateString('es-MX', { timeZone: ZONA_HORARIA_MX })}
          </span>
        </div>
      )}

      {resultado.primerIngreso && (
        <div className="mt-2 flex flex-col gap-1 text-base opacity-90">
          <span>Primer ingreso:</span>
          <span>{new Date(resultado.primerIngreso.fechaHora).toLocaleString('es-MX', { timeZone: ZONA_HORARIA_MX })}</span>
          <span>Escaneador: {resultado.primerIngreso.escaneadorNombre}</span>
        </div>
      )}

      {!resultado.boleto && !resultado.primerIngreso && <p className="text-base opacity-90">{resultado.mensaje}</p>}
    </div>
  );
}
