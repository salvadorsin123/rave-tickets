import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  ContextoAccionSobreUsuario,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '@application/ports/repositories.port';
import { EditarUsuarioDto } from '@application/dtos/usuarios.dto';
import { UsuarioEntity } from '@domain/entities/usuario.entity';

@Injectable()
export class EditarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(
    usuarioId: string,
    dto: EditarUsuarioDto,
    contexto: ContextoAccionSobreUsuario,
  ): Promise<UsuarioEntity> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || !contexto.rolesPermitidos.includes(usuario.rolNombre)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.email !== undefined) usuario.email = dto.email;

    const actualizado = await this.usuarioRepository.update(usuario);
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.ejecutadoPorId,
      accion: 'ADMIN_EDITADO',
      entidadAfectada: 'Usuario',
      entidadId: usuario.id,
      detalles: null,
      ipAddress: contexto.ipAddress,
    });
    return actualizado;
  }
}
