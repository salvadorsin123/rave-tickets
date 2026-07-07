import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  ContextoAccionSobreUsuario,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '@application/ports/repositories.port';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class DesactivarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(usuarioId: string, contexto: ContextoAccionSobreUsuario): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || !contexto.rolesPermitidos.includes(usuario.rolNombre)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.esAdmin()) {
      await this.verificarQuedanOtrosActivos(
        RolNombre.ADMIN,
        usuario.id,
        'No se puede desactivar al unico administrador activo',
      );
    }
    if (usuario.esSuperAdmin()) {
      await this.verificarQuedanOtrosActivos(
        RolNombre.SUPER_ADMIN,
        usuario.id,
        'No se puede desactivar al unico super administrador activo',
      );
    }

    usuario.desactivar();
    usuario.invalidarSesiones();
    await this.usuarioRepository.update(usuario);
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.ejecutadoPorId,
      accion: 'ADMIN_DESACTIVADO',
      entidadAfectada: 'Usuario',
      entidadId: usuario.id,
      detalles: null,
      ipAddress: contexto.ipAddress,
    });
  }

  private async verificarQuedanOtrosActivos(
    rol: RolNombre,
    usuarioId: string,
    mensaje: string,
  ): Promise<void> {
    const usuarios = await this.usuarioRepository.findAllByRol(rol);
    const quedanOtrosActivos = usuarios.some((u) => u.id !== usuarioId && u.activo);
    if (!quedanOtrosActivos) {
      throw new ConflictException(mensaje);
    }
  }
}
