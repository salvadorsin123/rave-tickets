import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONFIGURACION_REPOSITORY,
  ConfiguracionRepositoryPort,
  EVENTO_REPOSITORY,
  EventoRepositoryPort,
} from '@application/ports/repositories.port';

@Injectable()
export class DuplicarConfiguracionUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort,
    @Inject(CONFIGURACION_REPOSITORY) private readonly configuracionRepository: ConfiguracionRepositoryPort,
  ) {}

  async execute(eventoOrigenId: string, eventoDestinoId: string): Promise<void> {
    const [origen, destino] = await Promise.all([
      this.eventoRepository.findById(eventoOrigenId),
      this.eventoRepository.findById(eventoDestinoId),
    ]);
    if (!origen || !destino) {
      throw new NotFoundException('Evento origen o destino no encontrado');
    }

    await this.configuracionRepository.duplicar(eventoOrigenId, eventoDestinoId);
  }
}
