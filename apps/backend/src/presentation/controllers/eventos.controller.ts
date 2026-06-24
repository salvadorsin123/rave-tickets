import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CrearEventoDto, DuplicarConfiguracionDto, EditarEventoDto } from '@application/dtos/eventos.dto';
import { CrearEventoUseCase } from '@application/use-cases/eventos/crear-evento.use-case';
import { EditarEventoUseCase } from '@application/use-cases/eventos/editar-evento.use-case';
import { CerrarEventoUseCase } from '@application/use-cases/eventos/cerrar-evento.use-case';
import { DuplicarConfiguracionUseCase } from '@application/use-cases/eventos/duplicar-configuracion.use-case';
import { ConsultarEventosUseCase } from '@application/use-cases/eventos/consultar-eventos.use-case';
import { SubirLogoEventoUseCase } from '@application/use-cases/eventos/subir-logo-evento.use-case';
import { ObtenerLogoEventoUseCase } from '@application/use-cases/eventos/obtener-logo-evento.use-case';
import { SubirFondoEventoUseCase } from '@application/use-cases/eventos/subir-fondo-evento.use-case';
import { ObtenerFondoEventoUseCase } from '@application/use-cases/eventos/obtener-fondo-evento.use-case';
import { EventoEntity } from '@domain/entities/evento.entity';
import { EstadoEvento } from '@domain/enums/estado-evento.enum';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { TokenPayload } from '@application/ports/infrastructure.port';

class ConsultarEventosQueryDto {
  @IsOptional()
  @IsEnum(EstadoEvento)
  estado?: EstadoEvento;
}

@ApiTags('eventos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('eventos')
export class EventosController {
  constructor(
    private readonly crearEventoUseCase: CrearEventoUseCase,
    private readonly editarEventoUseCase: EditarEventoUseCase,
    private readonly cerrarEventoUseCase: CerrarEventoUseCase,
    private readonly duplicarConfiguracionUseCase: DuplicarConfiguracionUseCase,
    private readonly consultarEventosUseCase: ConsultarEventosUseCase,
    private readonly subirLogoEventoUseCase: SubirLogoEventoUseCase,
    private readonly obtenerLogoEventoUseCase: ObtenerLogoEventoUseCase,
    private readonly subirFondoEventoUseCase: SubirFondoEventoUseCase,
    private readonly obtenerFondoEventoUseCase: ObtenerFondoEventoUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ConsultarEventosQueryDto): Promise<EventoEntity[]> {
    return this.consultarEventosUseCase.execute({ estado: query.estado });
  }

  @Get(':id')
  async obtener(@Param('id') id: string): Promise<EventoEntity> {
    return this.consultarEventosUseCase.obtenerPorId(id);
  }

  @Get(':id/logo')
  async obtenerLogo(@Param('id') id: string): Promise<StreamableFile> {
    const { contenido, contentType } = await this.obtenerLogoEventoUseCase.execute(id);
    return new StreamableFile(contenido, { type: contentType });
  }

  @Get(':id/fondo')
  async obtenerFondo(@Param('id') id: string): Promise<StreamableFile> {
    const { contenido, contentType } = await this.obtenerFondoEventoUseCase.execute(id);
    return new StreamableFile(contenido, { type: contentType });
  }

  @Roles(RolNombre.ADMIN)
  @Post()
  async crear(@Body() dto: CrearEventoDto, @CurrentUser() usuario: TokenPayload): Promise<EventoEntity> {
    return this.crearEventoUseCase.execute(dto, usuario.sub);
  }

  @Roles(RolNombre.ADMIN)
  @Post('logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async subirLogo(@UploadedFile() file?: Express.Multer.File): Promise<{ logoUrl: string }> {
    const logoUrl = await this.subirLogoEventoUseCase.execute(file);
    return { logoUrl };
  }

  @Roles(RolNombre.ADMIN)
  @Post('fondo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async subirFondo(@UploadedFile() file?: Express.Multer.File): Promise<{ imagenFondoUrl: string }> {
    const imagenFondoUrl = await this.subirFondoEventoUseCase.execute(file);
    return { imagenFondoUrl };
  }

  @Roles(RolNombre.ADMIN)
  @Patch(':id')
  async editar(@Param('id') id: string, @Body() dto: EditarEventoDto): Promise<EventoEntity> {
    return this.editarEventoUseCase.execute(id, dto);
  }

  @Roles(RolNombre.ADMIN)
  @Patch(':id/cerrar')
  async cerrar(@Param('id') id: string): Promise<EventoEntity> {
    return this.cerrarEventoUseCase.execute(id);
  }

  @Roles(RolNombre.ADMIN)
  @Post(':id/duplicar-configuracion')
  // Sin esto, Nest responde 201 con body vacio; el cliente intenta parsear ese body como JSON
  // (solo el caso 204 se trata como "sin body" en apiClient) y lanza un error falso.
  @HttpCode(HttpStatus.NO_CONTENT)
  async duplicarConfiguracion(@Param('id') id: string, @Body() dto: DuplicarConfiguracionDto): Promise<void> {
    await this.duplicarConfiguracionUseCase.execute(id, dto.eventoDestinoId);
  }
}
