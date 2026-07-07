import { randomBytes } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  ContextoAccionSobreUsuario,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '@application/ports/repositories.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '@application/ports/infrastructure.port';
import { RestablecerPasswordResponseDto } from '@application/dtos/usuarios.dto';

@Injectable()
export class RestablecerPasswordUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(
    usuarioId: string,
    contexto: ContextoAccionSobreUsuario,
  ): Promise<RestablecerPasswordResponseDto> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || !contexto.rolesPermitidos.includes(usuario.rolNombre)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordTemporal = randomBytes(6).toString('base64url');
    usuario.cambiarPasswordHash(await this.passwordHasher.hash(passwordTemporal));
    usuario.invalidarSesiones();
    await this.usuarioRepository.update(usuario);
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.ejecutadoPorId,
      accion: 'ADMIN_PASSWORD_RESTABLECIDO',
      entidadAfectada: 'Usuario',
      entidadId: usuario.id,
      detalles: null,
      ipAddress: contexto.ipAddress,
    });

    return { passwordTemporal };
  }
}
