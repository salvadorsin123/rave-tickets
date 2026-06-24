import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { RegistrarVentaDto } from '@application/dtos/ventas.dto';
import {
  RegistrarVentaUseCase,
  VentaConBoleto,
} from '@application/use-cases/ventas/registrar-venta.use-case';
import { ConsultarVentasUseCase } from '@application/use-cases/ventas/consultar-ventas.use-case';
import { VentaEntity } from '@domain/entities/venta.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { TokenPayload } from '@application/ports/infrastructure.port';

class ConsultarVentasQueryDto {
  @IsOptional()
  @IsUUID()
  eventoId?: string;
}

@ApiTags('ventas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN)
@Controller('ventas')
export class VentasController {
  constructor(
    private readonly registrarVentaUseCase: RegistrarVentaUseCase,
    private readonly consultarVentasUseCase: ConsultarVentasUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ConsultarVentasQueryDto): Promise<VentaEntity[]> {
    return this.consultarVentasUseCase.execute({ eventoId: query.eventoId });
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<VentaEntity> {
    return this.consultarVentasUseCase.obtenerPorId(id);
  }

  @Post()
  async registrar(
    @Body() dto: RegistrarVentaDto,
    @CurrentUser() usuario: TokenPayload,
  ): Promise<VentaConBoleto> {
    return this.registrarVentaUseCase.execute(dto, usuario.sub);
  }
}
