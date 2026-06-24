export const DASHBOARD_QUERY = Symbol('DASHBOARD_QUERY');

export interface VentasPorPeriodo {
  etiqueta: string;
  total: number;
}

export interface IngresoPorEvento {
  eventoId: string;
  nombreEvento: string;
  total: number;
}

export interface EscaneadorRanking {
  escaneadorId: string;
  nombre: string;
  total: number;
}

export interface ActividadReciente {
  descripcion: string;
  fechaHora: Date;
}

export interface EstadisticasDashboard {
  ventasTotales: number;
  ingresosTotales: number;
  boletosVendidos: number;
  asistentesEsperados: number;
  asistentesIngresados: number;
  porcentajeAsistencia: number;
  boletosPendientes: number;
  boletosCancelados: number;
  boletosReembolsados: number;
  ventasPorDia: VentasPorPeriodo[];
  ventasPorHora: VentasPorPeriodo[];
  ingresosPorEvento: IngresoPorEvento[];
  topEscaneadores: EscaneadorRanking[];
  actividadReciente: ActividadReciente[];
}

export interface DashboardQueryPort {
  obtenerEstadisticas(eventoId?: string): Promise<EstadisticasDashboard>;
}
