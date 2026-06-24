import { randomBytes } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '@application/ports/infrastructure.port';
import { RestablecerPasswordResponseDto } from '@application/dtos/usuarios.dto';

@Injectable()
export class RestablecerPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(usuarioId: string): Promise<RestablecerPasswordResponseDto> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordTemporal = randomBytes(6).toString('base64url');
    usuario.cambiarPasswordHash(await this.passwordHasher.hash(passwordTemporal));
    await this.usuarioRepository.update(usuario);

    return { passwordTemporal };
  }
}
