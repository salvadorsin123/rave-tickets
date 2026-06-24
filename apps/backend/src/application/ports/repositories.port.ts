import { BitacoraAuditoriaEntity } from '@domain/entities/bitacora-auditoria.entity';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { ConfiguracionEntity } from '@domain/entities/configuracion.entity';
import { EscaneoEntity } from '@domain/entities/escaneo.entity';
import { EventoEntity } from '@domain/entities/evento.entity';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { VentaEntity } from '@domain/entities/venta.entity';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';
import { EstadoEvento } from '@domain/enums/estado-evento.enum';
import { RolNombre } from '@domain/enums/rol.enum';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
export const EVENTO_REPOSITORY = Symbol('EVENTO_REPOSITORY');
export const VENTA_REPOSITORY = Symbol('VENTA_REPOSITORY');
export const BOLETO_REPOSITORY = Symbol('BOLETO_REPOSITORY');
export const ESCANEO_REPOSITORY = Symbol('ESCANEO_REPOSITORY');
export const CONFIGURACION_REPOSITORY = Symbol('CONFIGURACION_REPOSITORY');
export const BITACORA_REPOSITORY = Symbol('BITACORA_REPOSITORY');

export interface CrearUsuarioData {
  nombre: string;
  email: string;
  passwordHash: string;
  rolNombre: RolNombre;
}

export interface UsuarioRepositoryPort {
  findById(id: string): Promise<UsuarioEntity | null>;
  findByEmail(email: string): Promise<UsuarioEntity | null>;
  findAllByRol(rolNombre: RolNombre): Promise<UsuarioEntity[]>;
  create(data: CrearUsuarioData): Promise<UsuarioEntity>;
  update(usuario: UsuarioEntity): Promise<UsuarioEntity>;
}

export interface CrearEventoData {
  nombre: string;
  descripcion: string | null;
  fecha: Date;
  lugar: string | null;
  logoUrl: string | null;
  imagenFondoUrl: string | null;
  precioBase: number | null;
  creadoPorId: string;
}

export interface FiltroEventos {
  estado?: EstadoEvento;
}

export interface EventoRepositoryPort {
  findById(id: string): Promise<EventoEntity | null>;
  findAll(filtro?: FiltroEventos): Promise<EventoEntity[]>;
  create(data: CrearEventoData): Promise<EventoEntity>;
  update(evento: EventoEntity): Promise<EventoEntity>;
}

export interface CrearVentaData {
  eventoId: string;
  nombreComprador: string;
  email: string | null;
  cantidadPersonas: number;
  montoTotal: number | null;
  registradoPorId: string;
}

export interface FiltroVentas {
  eventoId?: string;
  desde?: Date;
  hasta?: Date;
}

export interface VentaRepositoryPort {
  findById(id: string): Promise<VentaEntity | null>;
  findAll(filtro?: FiltroVentas): Promise<VentaEntity[]>;
  create(data: CrearVentaData): Promise<VentaEntity>;
  countByYear(anio: number): Promise<number>;
}

export interface CrearBoletoData {
  folio: string;
  ventaId: string;
  eventoId: string;
  tokenValidacionHash: string;
  personasCompradas: number;
}

export interface FiltroBoletos {
  eventoId?: string;
  estado?: EstadoBoleto;
  busqueda?: string;
}

export interface BoletoRepositoryPort {
  findById(id: string): Promise<BoletoEntity | null>;
  findByVentaId(ventaId: string): Promise<BoletoEntity | null>;
  findAll(filtro?: FiltroBoletos): Promise<BoletoEntity[]>;
  create(data: CrearBoletoData): Promise<BoletoEntity>;
  asignarPdfUrl(boletoId: string, pdfUrl: string): Promise<void>;
  actualizarEstado(boleto: BoletoEntity): Promise<void>;
  /**
   * Compare-and-swap: solo aplica el cambio si `personasIngresadasEsperadas`
   * coincide con el valor actual en BD. Devuelve false si hubo una escritura
   * concurrente (el llamador debe reintentar releyendo el boleto). Sirve tanto
   * para incrementos (entrada) como decrementos (salida): el metodo solo
   * escribe el valor absoluto `nuevasPersonasIngresadas` que el llamador calculo.
   */
  actualizarIngresoAtomico(
    boletoId: string,
    personasIngresadasEsperadas: number,
    nuevasPersonasIngresadas: number,
    nuevoEstado: EstadoBoleto,
  ): Promise<boolean>;
}

export interface CrearEscaneoData {
  boletoId: string;
  escaneadorId: string;
  personasIngresadasEnEsteEscaneo: number;
  resultado: string;
  tipo: string;
  ipAddress: string | null;
  deviceInfo: string | null;
}

export interface FiltroEscaneos {
  escaneadorId?: string;
  boletoId?: string;
  eventoId?: string;
}

export interface EscaneoRepositoryPort {
  create(data: CrearEscaneoData): Promise<EscaneoEntity>;
  findAll(filtro?: FiltroEscaneos): Promise<EscaneoEntity[]>;
  primerIngresoDe(boletoId: string): Promise<EscaneoEntity | null>;
  contarPorEscaneador(escaneadorId: string): Promise<number>;
  topEscaneadores(eventoId?: string, limite?: number): Promise<{ escaneadorId: string; total: number }[]>;
}

export interface ConfiguracionRepositoryPort {
  findByEvento(eventoId: string | null): Promise<ConfiguracionEntity[]>;
  upsert(eventoId: string | null, clave: string, valor: string | null): Promise<ConfiguracionEntity>;
  duplicar(eventoOrigenId: string, eventoDestinoId: string): Promise<void>;
}

export interface RegistrarBitacoraData {
  usuarioId: string | null;
  accion: string;
  entidadAfectada: string;
  entidadId: string | null;
  detalles: string | null;
  ipAddress: string | null;
}

export interface FiltroBitacora {
  entidadAfectada?: string;
  entidadId?: string;
  usuarioId?: string;
  desde?: Date;
  hasta?: Date;
}

export interface BitacoraRepositoryPort {
  registrar(data: RegistrarBitacoraData): Promise<void>;
  findAll(filtro?: FiltroBitacora): Promise<BitacoraAuditoriaEntity[]>;
}
