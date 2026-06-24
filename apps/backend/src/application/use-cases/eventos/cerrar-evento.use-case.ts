import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVENTO_REPOSITORY, EventoRepositoryPort } from '@application/ports/repositories.port';
import { EventoEntity } from '@domain/entities/evento.entity';

@Injectable()
export class CerrarEventoUseCase {
  constructor(@Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort) {}

  async execute(eventoId: string): Promise<EventoEntity> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }

    evento.cerrar();
    return this.eventoRepository.update(evento);
  }
}
