import { Injectable } from '@nestjs/common';
import { Escaneo as EscaneoRow } from '@prisma/client';
import {
  CrearEscaneoData,
  EscaneoRepositoryPort,
  FiltroEscaneos,
} from '@application/ports/repositories.port';
import { EscaneoEntity } from '@domain/entities/escaneo.entity';
import { ResultadoEscaneo } from '@domain/enums/resultado-escaneo.enum';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EscaneoPrismaRepository implements EscaneoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CrearEscaneoData): Promise<EscaneoEntity> {
    const row = await this.prisma.escaneo.create({
      data: {
        boletoId: data.boletoId,
        escaneadorId: data.escaneadorId,
        personasIngresadasEnEsteEscaneo: data.personasIngresadasEnEsteEscaneo,
        resultado: data.resultado,
        ipAddress: data.ipAddress,
        deviceInfo: data.deviceInfo,
      },
    });
    return this.toDomain(row);
  }

  async findAll(filtro?: FiltroEscaneos): Promise<EscaneoEntity[]> {
    const rows = await this.prisma.escaneo.findMany({
      where: {
        escaneadorId: filtro?.escaneadorId,
        boletoId: filtro?.boletoId,
        ...(filtro?.eventoId ? { boleto: { eventoId: filtro.eventoId } } : {}),
      },
      orderBy: { fechaHora: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async primerIngresoDe(boletoId: string): Promise<EscaneoEntity | null> {
    const row = await this.prisma.escaneo.findFirst({
      where: { boletoId, resultado: ResultadoEscaneo.VALIDO },
      orderBy: { fechaHora: 'asc' },
    });
    return row ? this.toDomain(row) : null;
  }

  async contarPorEscaneador(escaneadorId: string): Promise<number> {
    return this.prisma.escaneo.count({ where: { escaneadorId } });
  }

  async topEscaneadores(eventoId?: string, limite = 10): Promise<{ escaneadorId: string; total: number }[]> {
    const grupos = await this.prisma.escaneo.groupBy({
      by: ['escaneadorId'],
      where: eventoId ? { boleto: { eventoId } } : undefined,
      _count: { escaneadorId: true },
      orderBy: { _count: { escaneadorId: 'desc' } },
      take: limite,
    });
    return grupos.map((g) => ({ escaneadorId: g.escaneadorId, total: g._count.escaneadorId }));
  }

  private toDomain(row: EscaneoRow): EscaneoEntity {
    return new EscaneoEntity(
      row.id,
      row.boletoId,
      row.escaneadorId,
      row.personasIngresadasEnEsteEscaneo,
      row.resultado as ResultadoEscaneo,
      row.fechaHora,
      row.ipAddress,
      row.deviceInfo,
    );
  }
}
