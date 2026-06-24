import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  BOLETO_REPOSITORY,
  BoletoRepositoryPort,
} from '@application/ports/repositories.port';
import { BoletoEntity } from '@domain/entities/boleto.entity';

@Injectable()
export class CancelarBoletoUseCase {
  constructor(
    @Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(boletoId: string, ejecutadoPorId: string): Promise<BoletoEntity> {
    const boleto = await this.boletoRepository.findById(boletoId);
    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    boleto.cancelar();
    await this.boletoRepository.actualizarEstado(boleto);
    await this.bitacoraRepository.registrar({
      usuarioId: ejecutadoPorId,
      accion: 'BOLETO_CANCELADO',
      entidadAfectada: 'Boleto',
      entidadId: boleto.id,
      detalles: null,
      ipAddress: null,
    });

    return boleto;
  }
}
