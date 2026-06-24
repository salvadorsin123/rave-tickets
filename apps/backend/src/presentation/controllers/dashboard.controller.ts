import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ObtenerDashboardUseCase } from '@application/use-cases/dashboard/obtener-dashboard.use-case';
import { EstadisticasDashboard } from '@application/ports/dashboard.port';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';

class ObtenerDashboardQueryDto {
  @IsOptional()
  @IsUUID()
  eventoId?: string;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly obtenerDashboardUseCase: ObtenerDashboardUseCase) {}

  @Get()
  async obtener(@Query() query: ObtenerDashboardQueryDto): Promise<EstadisticasDashboard> {
    return this.obtenerDashboardUseCase.execute(query.eventoId);
  }
}
