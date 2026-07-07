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
  CambiarRolDto,
  CrearAdminDto,
  EditarUsuarioDto,
  RestablecerPasswordResponseDto,
} from '@application/dtos/usuarios.dto';
import { CrearAdminUseCase } from '@application/use-cases/usuarios/crear-admin.use-case';
import { ListarAdministradoresUseCase } from '@application/use-cases/usuarios/listar-administradores.use-case';
import { EditarUsuarioUseCase } from '@application/use-cases/usuarios/editar-usuario.use-case';
import { DesactivarUsuarioUseCase } from '@application/use-cases/usuarios/desactivar-usuario.use-case';
import { ReactivarUsuarioUseCase } from '@application/use-cases/usuarios/reactivar-usuario.use-case';
import { CambiarRolUsuarioUseCase } from '@application/use-cases/usuarios/cambiar-rol-usuario.use-case';
import { RestablecerPasswordUseCase } from '@application/use-cases/usuarios/restablecer-password.use-case';
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
@Controller('usuarios/administradores')
export class AdministradoresController {
  constructor(
    private readonly crearAdminUseCase: CrearAdminUseCase,
    private readonly listarAdministradoresUseCase: ListarAdministradoresUseCase,
    private readonly editarUsuarioUseCase: EditarUsuarioUseCase,
    private readonly desactivarUsuarioUseCase: DesactivarUsuarioUseCase,
    private readonly reactivarUsuarioUseCase: ReactivarUsuarioUseCase,
    private readonly cambiarRolUsuarioUseCase: CambiarRolUsuarioUseCase,
    private readonly restablecerPasswordUseCase: RestablecerPasswordUseCase,
  ) {}

  @Get()
  async listar(): Promise<UsuarioResponse[]> {
    const administradores = await this.listarAdministradoresUseCase.execute();
    return administradores.map(aUsuarioResponse);
  }

  @Post()
  @SinAuditoriaGenerica()
  async crear(
    @Body() dto: CrearAdminDto,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<UsuarioResponse> {
    const creado = await this.crearAdminUseCase.execute(dto, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
    });
    return aUsuarioResponse(creado);
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
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });
    return aUsuarioResponse(actualizado);
  }

  @Patch(':id/desactivar')
  // Sin esto, Nest responde 200 con body vacio; el cliente intenta parsear ese body como JSON
  // (solo el caso 204 se trata como "sin body" en apiClient) y lanza un error falso.
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolNombre.SUPER_ADMIN)
  @SinAuditoriaGenerica()
  async desactivar(
    @Param('id') id: string,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<void> {
    await this.desactivarUsuarioUseCase.execute(id, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });
  }

  @Patch(':id/reactivar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolNombre.SUPER_ADMIN)
  @SinAuditoriaGenerica()
  async reactivar(
    @Param('id') id: string,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<void> {
    await this.reactivarUsuarioUseCase.execute(id, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });
  }

  @Patch(':id/cambiar-rol')
  @Roles(RolNombre.SUPER_ADMIN)
  @SinAuditoriaGenerica()
  async cambiarRol(
    @Param('id') id: string,
    @Body() dto: CambiarRolDto,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<UsuarioResponse> {
    const actualizado = await this.cambiarRolUsuarioUseCase.execute(id, dto.rol, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });
    return aUsuarioResponse(actualizado);
  }

  @Patch(':id/restablecer-password')
  @Roles(RolNombre.SUPER_ADMIN)
  @SinAuditoriaGenerica()
  async restablecerPassword(
    @Param('id') id: string,
    @CurrentUser() usuario: TokenPayload,
    @Req() req: Request,
  ): Promise<RestablecerPasswordResponseDto> {
    return this.restablecerPasswordUseCase.execute(id, {
      ejecutadoPorId: usuario.sub,
      ipAddress: req.ip ?? null,
      rolesPermitidos: [RolNombre.ADMIN, RolNombre.SUPER_ADMIN],
    });
  }
}
