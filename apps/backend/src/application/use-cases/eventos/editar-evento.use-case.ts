import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVENTO_REPOSITORY, EventoRepositoryPort } from '@application/ports/repositories.port';
import { EditarEventoDto } from '@application/dtos/eventos.dto';
import { EventoEntity } from '@domain/entities/evento.entity';

@Injectable()
export class EditarEventoUseCase {
  constructor(@Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort) {}

  async execute(eventoId: string, dto: EditarEventoDto): Promise<EventoEntity> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }

    if (dto.nombre !== undefined) evento.nombre = dto.nombre;
    if (dto.descripcion !== undefined) evento.descripcion = dto.descripcion;
    if (dto.fecha !== undefined) evento.fecha = dto.fecha;
    if (dto.lugar !== undefined) evento.lugar = dto.lugar;
    if (dto.logoUrl !== undefined) evento.logoUrl = dto.logoUrl;
    if (dto.imagenFondoUrl !== undefined) evento.imagenFondoUrl = dto.imagenFondoUrl;
    if (dto.precioBase !== undefined) evento.precioBase = dto.precioBase;
    evento.updatedAt = new Date();

    return this.eventoRepository.update(evento);
  }
}
