import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FiltroVentas, VENTA_REPOSITORY, VentaRepositoryPort } from '@application/ports/repositories.port';
import { VentaEntity } from '@domain/entities/venta.entity';

@Injectable()
export class ConsultarVentasUseCase {
  constructor(@Inject(VENTA_REPOSITORY) private readonly ventaRepository: VentaRepositoryPort) {}

  async execute(filtro?: FiltroVentas): Promise<VentaEntity[]> {
    return this.ventaRepository.findAll(filtro);
  }

  async obtenerPorId(ventaId: string): Promise<VentaEntity> {
    const venta = await this.ventaRepository.findById(ventaId);
    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }
    return venta;
  }
}
