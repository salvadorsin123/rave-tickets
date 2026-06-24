import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PersistenceModule } from '@modules/persistence.module';
import { InfrastructureModule } from '@modules/infrastructure.module';
import { AuditModule } from '@modules/audit.module';
import { AuthModule } from '@modules/auth.module';
import { UsuariosModule } from '@modules/usuarios.module';
import { EventosModule } from '@modules/eventos.module';
import { VentasModule } from '@modules/ventas.module';
import { BoletosModule } from '@modules/boletos.module';
import { EscaneosModule } from '@modules/escaneos.module';
import { DashboardModule } from '@modules/dashboard.module';
import { ReportesModule } from '@modules/reportes.module';
import { AuditoriaModule } from '@modules/auditoria.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    PersistenceModule,
    InfrastructureModule,
    AuditModule,
    AuthModule,
    UsuariosModule,
    EventosModule,
    VentasModule,
    BoletosModule,
    EscaneosModule,
    DashboardModule,
    ReportesModule,
    AuditoriaModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
