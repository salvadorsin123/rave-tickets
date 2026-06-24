import { Injectable } from '@nestjs/common';
import { Venta as VentaRow } from '@prisma/client';
import { CrearVentaData, FiltroVentas, VentaRepositoryPort } from '@application/ports/repositories.port';
import { VentaEntity } from '@domain/entities/venta.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VentaPrismaRepository implements VentaRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<VentaEntity | null> {
    const row = await this.prisma.venta.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filtro?: FiltroVentas): Promise<VentaEntity[]> {
    const rows = await this.prisma.venta.findMany({
      where: {
        eventoId: filtro?.eventoId,
        fechaCompra: {
          gte: filtro?.desde,
          lte: filtro?.hasta,
        },
      },
      orderBy: { fechaCompra: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CrearVentaData): Promise<VentaEntity> {
    const row = await this.prisma.venta.create({
      data: {
        eventoId: data.eventoId,
        nombreComprador: data.nombreComprador,
        email: data.email,
        cantidadPersonas: data.cantidadPersonas,
        montoTotal: data.montoTotal,
        registradoPorId: data.registradoPorId,
      },
    });
    return this.toDomain(row);
  }

  // El folio del boleto (RV<anio>-NNN) es unico globalmente (ver schema.prisma), no por
  // evento, asi que la secuencia debe contar todas las ventas del anio sin filtrar por
  // eventoId. Contar solo dentro del evento producia el mismo folio para la primera venta
  // de cada evento del mismo anio, violando esa restriccion unica.
  // El anio de "anio" viene calculado en hora de Ciudad de Mexico (ver anioEnZonaMx), asi
  // que el rango debe usar los mismos limites: medianoche en CDMX (UTC-6 fijo) equivale a
  // las 06:00 UTC, no a las 00:00 UTC.
  async countByYear(anio: number): Promise<number> {
    return this.prisma.venta.count({
      where: {
        fechaCompra: {
          gte: new Date(`${anio}-01-01T06:00:00.000Z`),
          lt: new Date(`${anio + 1}-01-01T06:00:00.000Z`),
        },
      },
    });
  }

  private toDomain(row: VentaRow): VentaEntity {
    return new VentaEntity(
      row.id,
      row.eventoId,
      row.nombreComprador,
      row.email,
      row.cantidadPersonas,
      row.montoTotal ? Number(row.montoTotal) : null,
      row.registradoPorId,
      row.fechaCompra,
    );
  }
}
