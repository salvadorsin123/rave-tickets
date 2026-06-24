import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  EVENTO_REPOSITORY,
  EventoRepositoryPort,
  VENTA_REPOSITORY,
  VentaRepositoryPort,
} from '@application/ports/repositories.port';
import { RegistrarVentaDto } from '@application/dtos/ventas.dto';
import { GenerarBoletoUseCase } from '@application/use-cases/boletos/generar-boleto.use-case';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { VentaEntity } from '@domain/entities/venta.entity';

export interface VentaConBoleto {
  venta: VentaEntity;
  boleto: BoletoEntity;
}

/** UC-06: registra la venta y dispara automaticamente UC-29 (generar boleto). */
@Injectable()
export class RegistrarVentaUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort,
    @Inject(VENTA_REPOSITORY) private readonly ventaRepository: VentaRepositoryPort,
    private readonly generarBoletoUseCase: GenerarBoletoUseCase,
  ) {}

  async execute(dto: RegistrarVentaDto, registradoPorId: string): Promise<VentaConBoleto> {
    const evento = await this.eventoRepository.findById(dto.eventoId);
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }
    evento.asegurarPermiteVentas();

    const venta = await this.ventaRepository.create({
      eventoId: dto.eventoId,
      nombreComprador: dto.nombreComprador,
      email: dto.email ?? null,
      cantidadPersonas: dto.cantidadPersonas,
      montoTotal: dto.montoTotal ?? null,
      registradoPorId,
    });

    const boleto = await this.generarBoletoUseCase.execute(venta);

    return { venta, boleto };
  }
}
