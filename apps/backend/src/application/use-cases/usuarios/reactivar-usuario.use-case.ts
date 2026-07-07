import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  ContextoAccionSobreUsuario,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '@application/ports/repositories.port';

@Injectable()
export class ReactivarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(usuarioId: string, contexto: ContextoAccionSobreUsuario): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || !contexto.rolesPermitidos.includes(usuario.rolNombre)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    usuario.activar();
    await this.usuarioRepository.update(usuario);
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.ejecutadoPorId,
      accion: 'ADMIN_REACTIVADO',
      entidadAfectada: 'Usuario',
      entidadId: usuario.id,
      detalles: null,
      ipAddress: contexto.ipAddress,
    });
  }
}
