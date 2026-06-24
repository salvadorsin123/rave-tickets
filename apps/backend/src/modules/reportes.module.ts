import { Module } from '@nestjs/common';
import { ReportesController } from '@presentation/controllers/reportes.controller';
import { ExportarReporteUseCase } from '@application/use-cases/reportes/exportar-reporte.use-case';

@Module({
  controllers: [ReportesController],
  providers: [ExportarReporteUseCase],
})
export class ReportesModule {}
