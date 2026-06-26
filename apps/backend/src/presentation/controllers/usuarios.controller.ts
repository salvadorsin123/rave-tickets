import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CrearEscaneadorDto,
  EditarUsuarioDto,
  RestablecerPasswordResponseDto,
} from '@application/dtos/usuarios.dto';
import { CrearEscaneadorUseCase } from '@application/use-cases/usuarios/crear-escaneador.use-case';
import { EditarUsuarioUseCase } from '@application/use-cases/usuarios/editar-usuario.use-case';
import { DesactivarUsuarioUseCase } from '@application/use-cases/usuarios/desactivar-usuario.use-case';
import { ReactivarUsuarioUseCase } from '@application/use-cases/usuarios/reactivar-usuario.use-case';
import { RestablecerPasswordUseCase } from '@application/use-cases/usuarios/restablecer-password.use-case';
import { ListarEscaneadoresUseCase } from '@application/use-cases/usuarios/listar-escaneadores.use-case';
import { ConsultarActividadEscaneadorUseCase } from '@application/use-cases/usuarios/consultar-actividad-escaneador.use-case';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { TokenPayload } from '@application/ports/infrastructure.port';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { SinAuditoriaGenerica } from '@presentation/decorators/sin-auditoria-generica.decorator';

interface UsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: RolNombre;
  activo: boolean;
}

function aUsuarioResponse(usuario: UsuarioEntity): UsuarioResponse {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rolNombre,
    activo: usuario.activo,
  };
}

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN)
@Controller('usuarios/escaneadores')
export class UsuariosController {
  constructor(
    private readonly crearEscaneadorUseCase: CrearEscaneadorUseCase,
    private readonly editarUsuarioUseCase: EditarUsuarioUseCase,
    private readonly desactivarUsuarioUseCase: DesactivarUsuarioUseCase,
    private readonly reactivarUsuarioUseCase: ReactivarUsuarioUseCase,
    private readonly restablecerPasswordUseCase: RestablecerPasswordUseCase,
    private readonly listarEscaneadoresUseCase: ListarEscaneadoresUseCase,
    private readonly consultarActividadEscaneadorUseCase: ConsultarActividadEscaneadorUseCase,
  ) {}

  @Get()
  async listar(): Promise<UsuarioResponse[]> {
    const escaneadores = await this.listarEscaneadoresUseCase.execute();
    return escaneadores.map(aUsuarioResponse);
  }

  @Post()
  async crear(@Body() dto: CrearEscaneadorDto): Promise<UsuarioResponse> {
    const usuario = await this.crearEscaneadorUseCase.execute(dto);
    return aUsuarioResponse(usuario);
  }

  @Patch(':id')
  @SinAuditoriaGenerica()
  async editar(
    @Param('id') id: string,
    @Body() dto: EditarUsuarioDto,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<UsuarioResponse> {
    const actualizado = await this.editarUsuarioUseCase.execute(id, dto, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
    });
    return aUsuarioResponse(actualizado);
  }

  @Patch(':id/desactivar')
  // Sin esto, Nest responde 200 con body vacio; el cliente intenta parsear ese body como JSON
  // (solo el caso 204 se trata como "sin body" en apiClient) y lanza un error falso.
  @HttpCode(HttpStatus.NO_CONTENT)
  @SinAuditoriaGenerica()
  async desactivar(
    @Param('id') id: string,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<void> {
    await this.desactivarUsuarioUseCase.execute(id, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
    });
  }

  @Patch(':id/reactivar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SinAuditoriaGenerica()
  async reactivar(
    @Param('id') id: string,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<void> {
    await this.reactivarUsuarioUseCase.execute(id, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
    });
  }

  @Patch(':id/restablecer-password')
  @SinAuditoriaGenerica()
  async restablecerPassword(
    @Param('id') id: string,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<RestablecerPasswordResponseDto> {
    return this.restablecerPasswordUseCase.execute(id, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
    });
  }

  @Get(':id/actividad')
  async actividad(@Param('id') id: string) {
    return this.consultarActividadEscaneadorUseCase.execute(id);
  }
}
