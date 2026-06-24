import { Inject, Injectable } from '@nestjs/common';
import { ESCANEO_REPOSITORY, EscaneoRepositoryPort } from '@application/ports/repositories.port';
import { EscaneoEntity } from '@domain/entities/escaneo.entity';

/** UC-28: el escaneador solo puede consultar las entradas que el mismo registro. */
@Injectable()
export class HistorialPersonalUseCase {
  constructor(@Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort) {}

  async execute(escaneadorId: string): Promise<EscaneoEntity[]> {
    return this.escaneoRepository.findAll({ escaneadorId });
  }
}
