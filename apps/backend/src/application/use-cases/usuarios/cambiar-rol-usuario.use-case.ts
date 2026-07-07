import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  ContextoAccionSobreUsuario,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '@application/ports/repositories.port';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class CambiarRolUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort,
  ) {}

  async execute(
    usuarioId: string,
    nuevoRol: RolNombre,
    contexto: ContextoAccionSobreUsuario,
  ): Promise<UsuarioEntity> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || !contexto.rolesPermitidos.includes(usuario.rolNombre)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.rolNombre === nuevoRol) {
      return usuario;
    }

    // Perder el rol super_admin (hacia admin o hacia escaneador) deja a nadie con
    // poder de revocar accesos o ver auditoria si era el unico activo -- se revisa
    // para cualquier rol nuevo distinto de SUPER_ADMIN.
    if (usuario.esSuperAdmin() && usuario.activo && nuevoRol !== RolNombre.SUPER_ADMIN) {
      await this.verificarQuedanOtrosActivos(
        RolNombre.SUPER_ADMIN,
        usuario.id,
        'No se puede quitar el rol al unico super administrador activo',
      );
    }
    // Ascender de admin a super_admin nunca reduce la capacidad de gestion (un
    // super_admin cubre todo lo que un admin hace), asi que el invariante de admin
    // solo aplica al degradar fuera de la jerarquia admin-o-superior (a escaneador).
    if (usuario.esAdmin() && usuario.activo && nuevoRol === RolNombre.ESCANEADOR) {
      await this.verificarQuedanOtrosActivos(
        RolNombre.ADMIN,
        usuario.id,
        'No se puede quitar el rol al unico administrador activo',
      );
    }

    const rolAnterior = usuario.rolNombre;
    const actualizado = await this.usuarioRepository.cambiarRol(usuarioId, nuevoRol);
    await this.bitacoraRepository.registrar({
      usuarioId: contexto.ejecutadoPorId,
      accion: 'ADMIN_ROL_CAMBIADO',
      entidadAfectada: 'Usuario',
      entidadId: usuario.id,
      detalles: `${rolAnterior} -> ${nuevoRol}`,
      ipAddress: contexto.ipAddress,
    });
    return actualizado;
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
