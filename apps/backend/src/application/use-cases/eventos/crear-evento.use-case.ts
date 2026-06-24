import { Inject, Injectable } from '@nestjs/common';
import { EVENTO_REPOSITORY, EventoRepositoryPort } from '@application/ports/repositories.port';
import { CrearEventoDto } from '@application/dtos/eventos.dto';
import { EventoEntity } from '@domain/entities/evento.entity';

@Injectable()
export class CrearEventoUseCase {
  constructor(@Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort) {}

  async execute(dto: CrearEventoDto, creadoPorId: string): Promise<EventoEntity> {
    return this.eventoRepository.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      fecha: dto.fecha,
      lugar: dto.lugar ?? null,
      logoUrl: dto.logoUrl ?? null,
      imagenFondoUrl: dto.imagenFondoUrl ?? null,
      precioBase: dto.precioBase ?? null,
      creadoPorId,
    });
  }
}
