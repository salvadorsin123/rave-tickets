import clsx from 'clsx';
import { EstadoBoleto, ResultadoEscaneo } from '@/types/enums';

const ESTADO_BOLETO_CLASSES: Record<EstadoBoleto, string> = {
  [EstadoBoleto.PENDIENTE]: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  [EstadoBoleto.PARCIALMENTE_UTILIZADO]: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  [EstadoBoleto.UTILIZADO]: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  [EstadoBoleto.CANCELADO]: 'bg-base-600/40 text-base-200 border-base-500/40',
  [EstadoBoleto.REEMBOLSADO]: 'bg-base-600/40 text-base-200 border-base-500/40',
  [EstadoBoleto.BLOQUEADO_POR_FRAUDE]: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const RESULTADO_ESCANEO_CLASSES: Record<ResultadoEscaneo, string> = {
  [ResultadoEscaneo.VALIDO]: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  [ResultadoEscaneo.YA_UTILIZADO]: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  [ResultadoEscaneo.INVALIDO]: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  [ResultadoEscaneo.FRAUDE]: 'bg-rose-600/25 text-rose-200 border-rose-600/40',
};

function BadgeBase({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', className)}>
      {children}
    </span>
  );
}

export function EstadoBoletoBadge({ estado, label }: { estado: EstadoBoleto; label: string }) {
  return <BadgeBase className={ESTADO_BOLETO_CLASSES[estado]}>{label}</BadgeBase>;
}

export function ResultadoEscaneoBadge({ resultado, label }: { resultado: ResultadoEscaneo; label: string }) {
  return <BadgeBase className={RESULTADO_ESCANEO_CLASSES[resultado]}>{label}</BadgeBase>;
}

export function ActivoBadge({ activo }: { activo: boolean }) {
  return (
    <BadgeBase
      className={
        activo
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-base-600/40 text-base-300 border-base-500/40'
      }
    >
      {activo ? 'Activo' : 'Inactivo'}
    </BadgeBase>
  );
}
