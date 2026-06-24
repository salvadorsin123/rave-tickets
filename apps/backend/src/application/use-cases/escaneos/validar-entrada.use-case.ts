import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  BOLETO_REPOSITORY,
  BoletoRepositoryPort,
  ESCANEO_REPOSITORY,
  EscaneoRepositoryPort,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
  VENTA_REPOSITORY,
  VentaRepositoryPort,
} from '@application/ports/repositories.port';
import { ResultadoValidacionDto, ValidarEntradaDto } from '@application/dtos/escaneos.dto';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { ESTADOS_TERMINALES } from '@domain/enums/estado-boleto.enum';
import { ResultadoEscaneo } from '@domain/enums/resultado-escaneo.enum';
import { TokenValidacion } from '@domain/value-objects/token-validacion.vo';

const MAX_REINTENTOS_CONCURRENCIA = 3;

export interface ContextoEscaneo {
  escaneadorId: string;
  ipAddress: string | null;
  deviceInfo: string | null;
}

/**
 * UC-25/26/27/30/31/32: valida un QR, registra el ingreso (parcial o total)
 * de forma atomica (compare-and-swap sobre personasIngresadas para soportar
 * escaneos concurrentes sobre el mismo boleto) y deja rastro en bitacora.
 */
@Injectable()
export class ValidarEntradaUseCase {
  constructor(
    @Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort,
    @Inject(VENTA_REPOSITORY) private readonly ventaRepository: VentaRepositoryPort,
    @Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
  ) {}

  async execute(dto: ValidarEntradaDto, contexto: ContextoEscaneo): Promise<ResultadoValidacionDto> {
    const boleto = await this.boletoRepository.findById(dto.uuid);

    if (!boleto) {
      await this.bitacoraRepository.registrar({
        usuarioId: contexto.escaneadorId,
        accion: 'ESCANEO_QR_NO_VALIDO',
        entidadAfectada: 'Boleto',
        entidadId: dto.uuid,
        detalles: 'UUID no corresponde a ningun boleto',
        ipAddress: contexto.ipAddress,
      });
      return { resultado: ResultadoEscaneo.INVALIDO, mensaje: 'QR NO VALIDO' };
    }

    const tokenHash = TokenValidacion.hashear(dto.token);
    if (tokenHash !== boleto.tokenValidacionHash) {
      await this.registrarEscaneo(boleto.id, contexto, 0, ResultadoEscaneo.INVALIDO);
      return { resultado: ResultadoEscaneo.INVALIDO, mensaje: 'QR NO VALIDO' };
    }

    if (ESTADOS_TERMINALES.has(boleto.estado)) {
      await this.registrarEscaneo(boleto.id, contexto, 0, ResultadoEscaneo.FRAUDE);
      return {
        resultado: ResultadoEscaneo.FRAUDE,
        mensaje: `Boleto en estado ${boleto.estado}, no admite ingreso`,
      };
    }

    if (boleto.cupoDisponible <= 0) {
      return this.responderYaUtilizada(boleto, contexto);
    }

    const cantidadIngresan = Math.min(dto.personasIngresan ?? boleto.cupoDisponible, boleto.cupoDisponible);
    const boletoActualizado = await this.registrarIngresoConReintentos(boleto, cantidadIngresan);
    if (!boletoActualizado) {
      return this.responderYaUtilizada(await this.recargar(boleto.id), contexto);
    }

    await this.registrarEscaneo(boletoActualizado.id, contexto, cantidadIngresan, ResultadoEscaneo.VALIDO);

    const venta = await this.ventaRepository.findById(boletoActualizado.ventaId);
    return {
      resultado: ResultadoEscaneo.VALIDO,
      mensaje: 'ENTRADA VALIDA',
      boleto: {
        folio: boletoActualizado.folio,
        nombreComprador: venta?.nombreComprador ?? '',
        personasCompradas: boletoActualizado.personasCompradas,
        personasIngresadas: boletoActualizado.personasIngresadas,
        fechaCompra: venta?.fechaCompra ?? boletoActualizado.createdAt,
      },
    };
  }

  private async registrarIngresoConReintentos(
    boletoInicial: BoletoEntity,
    cantidadIngresan: number,
  ): Promise<BoletoEntity | null> {
    let boletoActual = boletoInicial;

    for (let intento = 0; intento < MAX_REINTENTOS_CONCURRENCIA; intento++) {
      if (boletoActual.cupoDisponible <= 0 || ESTADOS_TERMINALES.has(boletoActual.estado)) {
        return null;
      }

      const personasIngresadasEsperadas = boletoActual.personasIngresadas;
      const copia = this.clonar(boletoActual);
      copia.registrarIngreso(cantidadIngresan);

      const aplicado = await this.boletoRepository.incrementarIngresoAtomico(
        boletoActual.id,
        personasIngresadasEsperadas,
        copia.personasIngresadas,
        copia.estado,
      );

      if (aplicado) {
        return copia;
      }

      boletoActual = await this.recargar(boletoActual.id);
    }

    throw new ConflictException('No se pudo registrar el ingreso por alta concurrencia, intente nuevamente');
  }

  private async responderYaUtilizada(
    boleto: BoletoEntity,
    contexto: ContextoEscaneo,
  ): Promise<ResultadoValidacionDto> {
    const primerIngreso = await this.escaneoRepository.primerIngresoDe(boleto.id);
    await this.registrarEscaneo(boleto.id, contexto, 0, ResultadoEscaneo.YA_UTILIZADO);
    const escaneadorAnterior = primerIngreso
      ? await this.usuarioRepository.findById(primerIngreso.escaneadorId)
      : null;

    return {
      resultado: ResultadoEscaneo.YA_UTILIZADO,
      mensaje: 'ESTA ENTRADA YA FUE UTILIZADA',
      primerIngreso: primerIngreso
        ? {
            fechaHora: primerIngreso.fechaHora,
            escaneadorNombre: escaneadorAnterior?.nombre ?? 'Desconocido',
          }
        : undefined,
    };
  }

  private async registrarEscaneo(
    boletoId: string,
    contexto: ContextoEscaneo,
    cantidad: number,
    resultado: ResultadoEscaneo,
  ): Promise<void> {
    await this.escaneoRepository.create({
      boletoId,
      escaneadorId: contexto.escaneadorId,
      personasIngresadasEnEsteEscaneo: cantidad,
      resultado,
      ipAddress: contexto.ipAddress,
      deviceInfo: contexto.deviceInfo,
    });
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.escaneadorId,
      accion: `ESCANEO_${resultado.toUpperCase()}`,
      entidadAfectada: 'Boleto',
      entidadId: boletoId,
      detalles: null,
      ipAddress: contexto.ipAddress,
    });
  }

  private async recargar(boletoId: string): Promise<BoletoEntity> {
    const boleto = await this.boletoRepository.findById(boletoId);
    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }
    return boleto;
  }

  private clonar(boleto: BoletoEntity): BoletoEntity {
    return new BoletoEntity(
      boleto.id,
      boleto.folio,
      boleto.ventaId,
      boleto.eventoId,
      boleto.tokenValidacionHash,
      boleto.personasCompradas,
      boleto.personasIngresadas,
      boleto.estado,
      boleto.pdfUrl,
      boleto.createdAt,
      boleto.updatedAt,
    );
  }
}
