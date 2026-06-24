import { Global, Module } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BOLETO_REPOSITORY,
  CONFIGURACION_REPOSITORY,
  ESCANEO_REPOSITORY,
  EVENTO_REPOSITORY,
  USUARIO_REPOSITORY,
  VENTA_REPOSITORY,
} from '@application/ports/repositories.port';
import { DASHBOARD_QUERY } from '@application/ports/dashboard.port';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { UsuarioPrismaRepository } from '@infrastructure/persistence/prisma/repositories/usuario.prisma.repository';
import { EventoPrismaRepository } from '@infrastructure/persistence/prisma/repositories/evento.prisma.repository';
import { VentaPrismaRepository } from '@infrastructure/persistence/prisma/repositories/venta.prisma.repository';
import { BoletoPrismaRepository } from '@infrastructure/persistence/prisma/repositories/boleto.prisma.repository';
import { EscaneoPrismaRepository } from '@infrastructure/persistence/prisma/repositories/escaneo.prisma.repository';
import { ConfiguracionPrismaRepository } from '@infrastructure/persistence/prisma/repositories/configuracion.prisma.repository';
import { BitacoraPrismaRepository } from '@infrastructure/persistence/prisma/repositories/bitacora.prisma.repository';
import { DashboardPrismaRepository } from '@infrastructure/persistence/prisma/repositories/dashboard.prisma.repository';

/** Modulo global: expone PrismaService y todas las implementaciones de los puertos repositorio. */
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: USUARIO_REPOSITORY, useClass: UsuarioPrismaRepository },
    { provide: EVENTO_REPOSITORY, useClass: EventoPrismaRepository },
    { provide: VENTA_REPOSITORY, useClass: VentaPrismaRepository },
    { provide: BOLETO_REPOSITORY, useClass: BoletoPrismaRepository },
    { provide: ESCANEO_REPOSITORY, useClass: EscaneoPrismaRepository },
    { provide: CONFIGURACION_REPOSITORY, useClass: ConfiguracionPrismaRepository },
    { provide: BITACORA_REPOSITORY, useClass: BitacoraPrismaRepository },
    { provide: DASHBOARD_QUERY, useClass: DashboardPrismaRepository },
  ],
  exports: [
    PrismaService,
    USUARIO_REPOSITORY,
    EVENTO_REPOSITORY,
    VENTA_REPOSITORY,
    BOLETO_REPOSITORY,
    ESCANEO_REPOSITORY,
    CONFIGURACION_REPOSITORY,
    BITACORA_REPOSITORY,
    DASHBOARD_QUERY,
  ],
})
export class PersistenceModule {}
