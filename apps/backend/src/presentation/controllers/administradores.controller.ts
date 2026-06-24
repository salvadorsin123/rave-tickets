import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CrearAdminDto, EditarUsuarioDto, RestablecerPasswordResponseDto } from '@application/dtos/usuarios.dto';
import { CrearAdminUseCase } from '@application/use-cases/usuarios/crear-admin.use-case';
import { ListarAdministradoresUseCase } from '@application/use-cases/usuarios/listar-administradores.use-case';
import { EditarUsuarioUseCase } from '@application/use-cases/usuarios/editar-usuario.use-case';
import { DesactivarUsuarioUseCase } from '@application/use-cases/usuarios/desactivar-usuario.use-case';
import { RestablecerPasswordUseCase } from '@application/use-cases/usuarios/restablecer-password.use-case';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';

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
    private readonly restablecerPasswordUseCase: RestablecerPasswordUseCase,
  ) {}

  @Get()
  async listar(): Promise<UsuarioResponse[]> {
    const administradores = await this.listarAdministradoresUseCase.execute();
    return administradores.map(aUsuarioResponse);
  }

  @Post()
  async crear(@Body() dto: CrearAdminDto): Promise<UsuarioResponse> {
    const usuario = await this.crearAdminUseCase.execute(dto);
    return aUsuarioResponse(usuario);
  }

  @Patch(':id')
  async editar(@Param('id') id: string, @Body() dto: EditarUsuarioDto): Promise<UsuarioResponse> {
    const usuario = await this.editarUsuarioUseCase.execute(id, dto);
    return aUsuarioResponse(usuario);
  }

  @Patch(':id/desactivar')
  // Sin esto, Nest responde 200 con body vacio; el cliente intenta parsear ese body como JSON
  // (solo el caso 204 se trata como "sin body" en apiClient) y lanza un error falso.
  @HttpCode(HttpStatus.NO_CONTENT)
  async desactivar(@Param('id') id: string): Promise<void> {
    await this.desactivarUsuarioUseCase.execute(id);
  }

  @Patch(':id/restablecer-password')
  async restablecerPassword(@Param('id') id: string): Promise<RestablecerPasswordResponseDto> {
    return this.restablecerPasswordUseCase.execute(id);
  }
}
