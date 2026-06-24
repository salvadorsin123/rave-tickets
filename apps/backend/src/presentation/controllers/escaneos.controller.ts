import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IsOptional, IsUUID } from 'class-validator';
import { ResultadoValidacionDto, ValidarEntradaDto, ValidarSalidaDto } from '@application/dtos/escaneos.dto';
import { ValidarEntradaUseCase } from '@application/use-cases/escaneos/validar-entrada.use-case';
import { ValidarSalidaUseCase } from '@application/use-cases/escaneos/validar-salida.use-case';
import { HistorialPersonalUseCase } from '@application/use-cases/escaneos/historial-personal.use-case';
import { ConsultarEscaneosUseCase } from '@application/use-cases/escaneos/consultar-escaneos.use-case';
import { EscaneoEntity } from '@domain/entities/escaneo.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { TokenPayload } from '@application/ports/infrastructure.port';

class ConsultarEscaneosQueryDto {
  @IsOptional()
  @IsUUID()
  eventoId?: string;
}

@ApiTags('escaneos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escaneos')
export class EscaneosController {
  constructor(
    private readonly validarEntradaUseCase: ValidarEntradaUseCase,
    private readonly validarSalidaUseCase: ValidarSalidaUseCase,
    private readonly historialPersonalUseCase: HistorialPersonalUseCase,
    private readonly consultarEscaneosUseCase: ConsultarEscaneosUseCase,
  ) {}

  /** Endpoint critico de UX: debe responder en <1s, sin pasos de confirmacion intermedios. */
  @Roles(RolNombre.ESCANEADOR, RolNombre.ADMIN)
  @Post('validar')
  @HttpCode(HttpStatus.OK)
  async validar(
    @Body() dto: ValidarEntradaDto,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<ResultadoValidacionDto> {
    return this.validarEntradaUseCase.execute(dto, {
      escaneadorId: usuario.sub,
      ipAddress: req.ip ?? null,
      deviceInfo: req.headers['user-agent'] ?? null,
    });
  }

  /** Registra la salida de personas que ya habian ingresado, sin afectar el escaneo de entrada. */
  @Roles(RolNombre.ESCANEADOR, RolNombre.ADMIN)
  @Post('validar-salida')
  @HttpCode(HttpStatus.OK)
  async validarSalida(
    @Body() dto: ValidarSalidaDto,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<ResultadoValidacionDto> {
    return this.validarSalidaUseCase.execute(dto, {
      escaneadorId: usuario.sub,
      ipAddress: req.ip ?? null,
      deviceInfo: req.headers['user-agent'] ?? null,
    });
  }

  @Roles(RolNombre.ESCANEADOR, RolNombre.ADMIN)
  @Get('mio')
  async historialPropio(@CurrentUser() usuario: TokenPayload): Promise<EscaneoEntity[]> {
    return this.historialPersonalUseCase.execute(usuario.sub);
  }

  @Roles(RolNombre.ADMIN)
  @Get()
  async listar(@Query() query: ConsultarEscaneosQueryDto): Promise<EscaneoEntity[]> {
    return this.consultarEscaneosUseCase.execute({ eventoId: query.eventoId });
  }
}
