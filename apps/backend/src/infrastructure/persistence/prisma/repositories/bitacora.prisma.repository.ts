import { Injectable } from '@nestjs/common';
import { BitacoraAuditoria as BitacoraRow, Usuario as UsuarioRow } from '@prisma/client';
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
      include: { usuario: { select: { nombre: true, email: true } } },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(
    row: BitacoraRow & { usuario: Pick<UsuarioRow, 'nombre' | 'email'> | null },
  ): BitacoraAuditoriaEntity {
    return new BitacoraAuditoriaEntity(
      row.id,
      row.usuarioId,
      row.accion,
      row.entidadAfectada,
      row.entidadId,
      row.detalles,
      row.fechaHora,
      row.ipAddress,
      row.usuario?.nombre ?? null,
      row.usuario?.email ?? null,
    );
  }
}
