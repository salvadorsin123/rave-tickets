import { Injectable } from '@nestjs/common';
import { Configuracion as ConfiguracionRow } from '@prisma/client';
import { ConfiguracionRepositoryPort } from '@application/ports/repositories.port';
import { ConfiguracionEntity } from '@domain/entities/configuracion.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ConfiguracionPrismaRepository implements ConfiguracionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvento(eventoId: string | null): Promise<ConfiguracionEntity[]> {
    const rows = await this.prisma.configuracion.findMany({ where: { eventoId } });
    return rows.map((row) => this.toDomain(row));
  }

  async upsert(eventoId: string | null, clave: string, valor: string | null): Promise<ConfiguracionEntity> {
    const row = await this.prisma.configuracion.upsert({
      // Prisma tipa la clave compuesta sin admitir null aunque la columna sea nullable; el filtro funciona igual en runtime.
      where: { eventoId_clave: { eventoId: eventoId as string, clave } },
      create: { eventoId, clave, valor },
      update: { valor },
    });
    return this.toDomain(row);
  }

  async duplicar(eventoOrigenId: string, eventoDestinoId: string): Promise<void> {
    const configuraciones = await this.prisma.configuracion.findMany({ where: { eventoId: eventoOrigenId } });
    await this.prisma.$transaction(
      configuraciones.map((config) =>
        this.prisma.configuracion.upsert({
          where: { eventoId_clave: { eventoId: eventoDestinoId, clave: config.clave } },
          create: { eventoId: eventoDestinoId, clave: config.clave, valor: config.valor },
          update: { valor: config.valor },
        }),
      ),
    );
  }

  private toDomain(row: ConfiguracionRow): ConfiguracionEntity {
    return new ConfiguracionEntity(row.id, row.eventoId, row.clave, row.valor);
  }
}
