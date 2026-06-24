import { Injectable } from '@nestjs/common';
import { Evento as EventoRow } from '@prisma/client';
import { CrearEventoData, EventoRepositoryPort, FiltroEventos } from '@application/ports/repositories.port';
import { EventoEntity } from '@domain/entities/evento.entity';
import { EstadoEvento } from '@domain/enums/estado-evento.enum';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EventoPrismaRepository implements EventoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<EventoEntity | null> {
    const row = await this.prisma.evento.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filtro?: FiltroEventos): Promise<EventoEntity[]> {
    const rows = await this.prisma.evento.findMany({
      where: filtro?.estado ? { estado: filtro.estado } : undefined,
      orderBy: { fecha: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CrearEventoData): Promise<EventoEntity> {
    const row = await this.prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha: data.fecha,
        lugar: data.lugar,
        logoUrl: data.logoUrl,
        imagenFondoUrl: data.imagenFondoUrl,
        precioBase: data.precioBase,
        estado: EstadoEvento.ACTIVO,
        creadoPorId: data.creadoPorId,
      },
    });
    return this.toDomain(row);
  }

  async update(evento: EventoEntity): Promise<EventoEntity> {
    const row = await this.prisma.evento.update({
      where: { id: evento.id },
      data: {
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        fecha: evento.fecha,
        lugar: evento.lugar,
        logoUrl: evento.logoUrl,
        imagenFondoUrl: evento.imagenFondoUrl,
        precioBase: evento.precioBase,
        estado: evento.estado,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: EventoRow): EventoEntity {
    return new EventoEntity(
      row.id,
      row.nombre,
      row.descripcion,
      row.fecha,
      row.lugar,
      row.logoUrl,
      row.imagenFondoUrl,
      row.estado as EstadoEvento,
      row.precioBase ? Number(row.precioBase) : null,
      row.creadoPorId,
      row.createdAt,
      row.updatedAt,
    );
  }
}
