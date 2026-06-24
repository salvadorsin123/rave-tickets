import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '@application/ports/infrastructure.port';
import { CambiarPasswordPropioDto } from '@application/dtos/auth.dto';

@Injectable()
export class CambiarPasswordPropioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(usuarioId: string, dto: CambiarPasswordPropioDto): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordValida = await this.passwordHasher.comparar(dto.passwordActual, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('La contrasena actual no es correcta');
    }

    usuario.cambiarPasswordHash(await this.passwordHasher.hash(dto.passwordNueva));
    await this.usuarioRepository.update(usuario);
  }
}
