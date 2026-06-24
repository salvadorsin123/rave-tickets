import { EstadoBoleto, EstadoEvento, ResultadoEscaneo, RolNombre } from './enums';

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: RolNombre;
}

export interface UsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: RolNombre;
  activo: boolean;
}

export interface EventoEntity {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  lugar: string | null;
  logoUrl: string | null;
  imagenFondoUrl: string | null;
  estado: EstadoEvento;
  precioBase: number | null;
  creadoPorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VentaEntity {
  id: string;
  eventoId: string;
  nombreComprador: string;
  email: string | null;
  cantidadPersonas: number;
  montoTotal: number | null;
  registradoPorId: string;
  fechaCompra: string;
}

export interface BoletoResponse {
  id: string;
  folio: string;
  ventaId: string;
  eventoId: string;
  personasCompradas: number;
  personasIngresadas: number;
  estado: EstadoBoleto;
  pdfUrl: string | null;
}

export interface VentaConBoleto {
  venta: VentaEntity;
  boleto: BoletoResponse;
}

export interface EscaneoEntity {
  id: string;
  boletoId: string;
  escaneadorId: string;
  personasIngresadasEnEsteEscaneo: number;
  resultado: ResultadoEscaneo;
  fechaHora: string;
  ipAddress: string | null;
  deviceInfo: string | null;
}

export interface BitacoraAuditoriaEntity {
  id: string;
  usuarioId: string | null;
  accion: string;
  entidadAfectada: string;
  entidadId: string | null;
  detalles: string | null;
  fechaHora: string;
  ipAddress: string | null;
}

export interface ResultadoValidacionDto {
  resultado: ResultadoEscaneo;
  mensaje: string;
  boleto?: {
    folio: string;
    nombreComprador: string;
    personasCompradas: number;
    personasIngresadas: number;
    fechaCompra: string;
  };
  primerIngreso?: {
    fechaHora: string;
    escaneadorNombre: string;
  };
}

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
  fechaHora: string;
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

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
