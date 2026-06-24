import { Inject, Injectable } from '@nestjs/common';
import {
  ESCANEO_REPOSITORY,
  EscaneoRepositoryPort,
  FiltroEscaneos,
} from '@application/ports/repositories.port';
import { EscaneoEntity } from '@domain/entities/escaneo.entity';

/** Vista administrativa de escaneos (sin restringir por escaneador, a diferencia de HistorialPersonalUseCase). */
@Injectable()
export class ConsultarEscaneosUseCase {
  constructor(@Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort) {}

  async execute(filtro?: FiltroEscaneos): Promise<EscaneoEntity[]> {
    return this.escaneoRepository.findAll(filtro);
  }
}
