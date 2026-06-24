import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class DesactivarUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort) {}

  async execute(usuarioId: string): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.esAdmin()) {
      const administradores = await this.usuarioRepository.findAllByRol(RolNombre.ADMIN);
      const quedanOtrosActivos = administradores.some((a) => a.id !== usuario.id && a.activo);
      if (!quedanOtrosActivos) {
        throw new ConflictException('No se puede desactivar al unico administrador activo');
      }
    }

    usuario.desactivar();
    await this.usuarioRepository.update(usuario);
  }
}
