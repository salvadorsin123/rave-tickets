export enum RolNombre {
  ADMIN = 'admin',
  ESCANEADOR = 'escaneador',
}

export enum EstadoEvento {
  ACTIVO = 'activo',
  CERRADO = 'cerrado',
}

export enum EstadoBoleto {
  PENDIENTE = 'Pendiente',
  PARCIALMENTE_UTILIZADO = 'ParcialmenteUtilizado',
  UTILIZADO = 'Utilizado',
  CANCELADO = 'Cancelado',
  REEMBOLSADO = 'Reembolsado',
  BLOQUEADO_POR_FRAUDE = 'BloqueadoPorFraude',
}

export enum ResultadoEscaneo {
  VALIDO = 'Valido',
  YA_UTILIZADO = 'YaUtilizado',
  INVALIDO = 'Invalido',
  FRAUDE = 'Fraude',
  SALIDA_VALIDA = 'SalidaValida',
  SIN_INGRESOS = 'SinIngresos',
}

export enum TipoEscaneo {
  ENTRADA = 'Entrada',
  SALIDA = 'Salida',
}

export enum TipoReporte {
  VENTAS = 'ventas',
  BOLETOS = 'boletos',
  ESCANEOS = 'escaneos',
}

export enum FormatoReporte {
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf',
}

export const ESTADO_BOLETO_LABEL: Record<EstadoBoleto, string> = {
  [EstadoBoleto.PENDIENTE]: 'Pendiente',
  [EstadoBoleto.PARCIALMENTE_UTILIZADO]: 'Parcialmente utilizado',
  [EstadoBoleto.UTILIZADO]: 'Utilizado',
  [EstadoBoleto.CANCELADO]: 'Cancelado',
  [EstadoBoleto.REEMBOLSADO]: 'Reembolsado',
  [EstadoBoleto.BLOQUEADO_POR_FRAUDE]: 'Bloqueado por fraude',
};
