import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  BOLETO_REPOSITORY,
  BoletoRepositoryPort,
  ESCANEO_REPOSITORY,
  EscaneoRepositoryPort,
  VENTA_REPOSITORY,
  VentaRepositoryPort,
} from '@application/ports/repositories.port';
import { ResultadoValidacionDto, ValidarSalidaDto } from '@application/dtos/escaneos.dto';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { ESTADOS_TERMINALES } from '@domain/enums/estado-boleto.enum';
import { ResultadoEscaneo } from '@domain/enums/resultado-escaneo.enum';
import { TipoEscaneo } from '@domain/enums/tipo-escaneo.enum';
import { TokenValidacion } from '@domain/value-objects/token-validacion.vo';
import { ContextoEscaneo } from './validar-entrada.use-case';

const MAX_REINTENTOS_CONCURRENCIA = 3;

/**
 * Registra la salida de una o mas personas de un boleto que ya habian ingresado,
 * liberando cupo para que puedan volver a validarse por la entrada mas adelante.
 * No interfiere con el flujo de validar-entrada: solo decrementa personasIngresadas.
 */
@Injectable()
export class ValidarSalidaUseCase {
  constructor(
    @Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort,
    @Inject(VENTA_REPOSITORY) private readonly ventaRepository: VentaRepositoryPort,
    @Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(dto: ValidarSalidaDto, contexto: ContextoEscaneo): Promise<ResultadoValidacionDto> {
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
        mensaje: `Boleto en estado ${boleto.estado}, no admite salida`,
      };
    }

    if (boleto.personasIngresadas <= 0) {
      await this.registrarEscaneo(boleto.id, contexto, 0, ResultadoEscaneo.SIN_INGRESOS);
      return {
        resultado: ResultadoEscaneo.SIN_INGRESOS,
        mensaje: 'NO HAY PERSONAS DE ESTE BOLETO DENTRO DEL EVENTO',
      };
    }

    const cantidadSalen = Math.min(dto.personasSalen ?? boleto.personasIngresadas, boleto.personasIngresadas);
    const boletoActualizado = await this.registrarSalidaConReintentos(boleto, cantidadSalen);
    if (!boletoActualizado) {
      const recargado = await this.recargar(boleto.id);
      await this.registrarEscaneo(recargado.id, contexto, 0, ResultadoEscaneo.SIN_INGRESOS);
      return {
        resultado: ResultadoEscaneo.SIN_INGRESOS,
        mensaje: 'NO HAY PERSONAS DE ESTE BOLETO DENTRO DEL EVENTO',
      };
    }

    await this.registrarEscaneo(
      boletoActualizado.id,
      contexto,
      cantidadSalen,
      ResultadoEscaneo.SALIDA_VALIDA,
    );

    const venta = await this.ventaRepository.findById(boletoActualizado.ventaId);
    return {
      resultado: ResultadoEscaneo.SALIDA_VALIDA,
      mensaje: 'SALIDA REGISTRADA',
      boleto: {
        folio: boletoActualizado.folio,
        nombreComprador: venta?.nombreComprador ?? '',
        personasCompradas: boletoActualizado.personasCompradas,
        personasIngresadas: boletoActualizado.personasIngresadas,
        fechaCompra: venta?.fechaCompra ?? boletoActualizado.createdAt,
      },
    };
  }

  private async registrarSalidaConReintentos(
    boletoInicial: BoletoEntity,
    cantidadSalen: number,
  ): Promise<BoletoEntity | null> {
    let boletoActual = boletoInicial;

    for (let intento = 0; intento < MAX_REINTENTOS_CONCURRENCIA; intento++) {
      if (boletoActual.personasIngresadas <= 0 || ESTADOS_TERMINALES.has(boletoActual.estado)) {
        return null;
      }

      const personasIngresadasEsperadas = boletoActual.personasIngresadas;
      const copia = this.clonar(boletoActual);
      copia.registrarSalida(cantidadSalen);

      const aplicado = await this.boletoRepository.actualizarIngresoAtomico(
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

    throw new ConflictException('No se pudo registrar la salida por alta concurrencia, intente nuevamente');
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
      tipo: TipoEscaneo.SALIDA,
      ipAddress: contexto.ipAddress,
      deviceInfo: contexto.deviceInfo,
    });
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.escaneadorId,
      accion: `ESCANEO_SALIDA_${resultado.toUpperCase()}`,
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
