import { Injectable } from '@nestjs/common';
import { BitacoraAuditoria as BitacoraRow } from '@prisma/client';
import {
  BitacoraRepositoryPort,
  FiltroBitacora,
  RegistrarBitacoraData,
} from '@application/ports/repositories.port';
import { BitacoraAuditoriaEntity } from '@domain/entities/bitacora-auditoria.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BitacoraPrismaRepository implements BitacoraRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(data: RegistrarBitacoraData): Promise<void> {
    await this.prisma.bitacoraAuditoria.create({
      data: {
        usuarioId: data.usuarioId,
        accion: data.accion,
        entidadAfectada: data.entidadAfectada,
        entidadId: data.entidadId,
        detalles: data.detalles,
        ipAddress: data.ipAddress,
      },
    });
  }

  async findAll(filtro?: FiltroBitacora): Promise<BitacoraAuditoriaEntity[]> {
    const rows = await this.prisma.bitacoraAuditoria.findMany({
      where: {
        entidadAfectada: filtro?.entidadAfectada,
        entidadId: filtro?.entidadId,
        usuarioId: filtro?.usuarioId,
        fechaHora: {
          gte: filtro?.desde,
          lte: filtro?.hasta,
        },
      },
      orderBy: { fechaHora: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: BitacoraRow): BitacoraAuditoriaEntity {
    return new BitacoraAuditoriaEntity(
      row.id,
      row.usuarioId,
      row.accion,
      row.entidadAfectada,
      row.entidadId,
      row.detalles,
      row.fechaHora,
      row.ipAddress,
    );
  }
}
