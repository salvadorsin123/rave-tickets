import { Inject, Injectable } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class ListarAdministradoresUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort) {}

  async execute(): Promise<UsuarioEntity[]> {
    return this.usuarioRepository.findAllByRol(RolNombre.ADMIN);
  }
}
