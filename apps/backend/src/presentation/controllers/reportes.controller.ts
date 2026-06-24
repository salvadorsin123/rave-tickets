import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportarReporteQueryDto } from '@application/dtos/reportes.dto';
import { ExportarReporteUseCase } from '@application/use-cases/reportes/exportar-reporte.use-case';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';

@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly exportarReporteUseCase: ExportarReporteUseCase) {}

  @Get('exportar')
  async exportar(@Query() query: ExportarReporteQueryDto, @Res() res: Response): Promise<void> {
    const archivo = await this.exportarReporteUseCase.execute(query);
    res.set({
      'Content-Type': archivo.contentType,
      'Content-Disposition': `attachment; filename="${archivo.nombreArchivo}"`,
    });
    res.send(archivo.contenido);
  }
}
