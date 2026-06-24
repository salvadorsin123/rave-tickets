import { Module } from '@nestjs/common';
import { DashboardController } from '@presentation/controllers/dashboard.controller';
import { ObtenerDashboardUseCase } from '@application/use-cases/dashboard/obtener-dashboard.use-case';

@Module({
  controllers: [DashboardController],
  providers: [ObtenerDashboardUseCase],
})
export class DashboardModule {}
