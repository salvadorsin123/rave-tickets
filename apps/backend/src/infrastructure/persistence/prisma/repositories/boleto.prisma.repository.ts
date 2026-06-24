import { Injectable } from '@nestjs/common';
import { Boleto as BoletoRow } from '@prisma/client';
import { BoletoRepositoryPort, CrearBoletoData, FiltroBoletos } from '@application/ports/repositories.port';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BoletoPrismaRepository implements BoletoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BoletoEntity | null> {
    const row = await this.prisma.boleto.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByVentaId(ventaId: string): Promise<BoletoEntity | null> {
    const row = await this.prisma.boleto.findUnique({ where: { ventaId } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filtro?: FiltroBoletos): Promise<BoletoEntity[]> {
    const rows = await this.prisma.boleto.findMany({
      where: {
        eventoId: filtro?.eventoId,
        estado: filtro?.estado,
        ...(filtro?.busqueda
          ? {
              OR: [
                { folio: { contains: filtro.busqueda } },
                { venta: { nombreComprador: { contains: filtro.busqueda } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CrearBoletoData): Promise<BoletoEntity> {
    const row = await this.prisma.boleto.create({
      data: {
        folio: data.folio,
        ventaId: data.ventaId,
        eventoId: data.eventoId,
        tokenValidacionHash: data.tokenValidacionHash,
        personasCompradas: data.personasCompradas,
        personasIngresadas: 0,
        estado: EstadoBoleto.PENDIENTE,
      },
    });
    return this.toDomain(row);
  }

  async asignarPdfUrl(boletoId: string, pdfUrl: string): Promise<void> {
    await this.prisma.boleto.update({ where: { id: boletoId }, data: { pdfUrl } });
  }

  async actualizarEstado(boleto: BoletoEntity): Promise<void> {
    await this.prisma.boleto.update({
      where: { id: boleto.id },
      data: {
        estado: boleto.estado,
        personasIngresadas: boleto.personasIngresadas,
        pdfUrl: boleto.pdfUrl,
      },
    });
  }

  async actualizarIngresoAtomico(
    boletoId: string,
    personasIngresadasEsperadas: number,
    nuevasPersonasIngresadas: number,
    nuevoEstado: EstadoBoleto,
  ): Promise<boolean> {
    const resultado = await this.prisma.boleto.updateMany({
      where: { id: boletoId, personasIngresadas: personasIngresadasEsperadas },
      data: { personasIngresadas: nuevasPersonasIngresadas, estado: nuevoEstado },
    });
    return resultado.count === 1;
  }

  private toDomain(row: BoletoRow): BoletoEntity {
    return new BoletoEntity(
      row.id,
      row.folio,
      row.ventaId,
      row.eventoId,
      row.tokenValidacionHash,
      row.personasCompradas,
      row.personasIngresadas,
      row.estado as EstadoBoleto,
      row.pdfUrl,
      row.createdAt,
      row.updatedAt,
    );
  }
}
