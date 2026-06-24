export enum EstadoBoleto {
  PENDIENTE = 'Pendiente',
  PARCIALMENTE_UTILIZADO = 'ParcialmenteUtilizado',
  UTILIZADO = 'Utilizado',
  CANCELADO = 'Cancelado',
  REEMBOLSADO = 'Reembolsado',
  BLOQUEADO_POR_FRAUDE = 'BloqueadoPorFraude',
}

export const ESTADOS_TERMINALES: ReadonlySet<EstadoBoleto> = new Set([
  EstadoBoleto.CANCELADO,
  EstadoBoleto.REEMBOLSADO,
  EstadoBoleto.BLOQUEADO_POR_FRAUDE,
]);
