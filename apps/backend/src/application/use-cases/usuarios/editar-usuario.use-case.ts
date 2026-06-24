import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { EditarUsuarioDto } from '@application/dtos/usuarios.dto';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class EditarUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort) {}

  async execute(usuarioId: string, dto: EditarUsuarioDto): Promise<UsuarioEntity> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.email !== undefined) usuario.email = dto.email;
    if (dto.activo !== undefined) {
      if (dto.activo) {
        usuario.activar();
      } else {
        if (usuario.esAdmin()) {
          const administradores = await this.usuarioRepository.findAllByRol(RolNombre.ADMIN);
          const quedanOtrosActivos = administradores.some((a) => a.id !== usuario.id && a.activo);
          if (!quedanOtrosActivos) {
            throw new ConflictException('No se puede desactivar al unico administrador activo');
          }
        }
        usuario.desactivar();
      }
    }

    return this.usuarioRepository.update(usuario);
  }
}
