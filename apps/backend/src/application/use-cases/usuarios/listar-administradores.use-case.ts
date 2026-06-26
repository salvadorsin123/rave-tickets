import { Inject, Injectable } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class ListarAdministradoresUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort) {}

  async execute(): Promise<UsuarioEntity[]> {
    const [admins, superAdmins] = await Promise.all([
      this.usuarioRepository.findAllByRol(RolNombre.ADMIN),
      this.usuarioRepository.findAllByRol(RolNombre.SUPER_ADMIN),
    ]);
    return [...admins, ...superAdmins].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
