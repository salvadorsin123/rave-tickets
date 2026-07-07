import { RolNombre } from '../enums/rol.enum';

export class UsuarioEntity {
  constructor(
    public readonly id: string,
    public nombre: string,
    public email: string,
    public passwordHash: string,
    public readonly rolId: string,
    public readonly rolNombre: RolNombre,
    public activo: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public tokenVersion: number = 0,
  ) {}

  esAdmin(): boolean {
    return this.rolNombre === RolNombre.ADMIN;
  }

  esSuperAdmin(): boolean {
    return this.rolNombre === RolNombre.SUPER_ADMIN;
  }

  esEscaneador(): boolean {
    return this.rolNombre === RolNombre.ESCANEADOR;
  }

  desactivar(): void {
    this.activo = false;
  }

  activar(): void {
    this.activo = true;
  }

  cambiarPasswordHash(nuevoHash: string): void {
    this.passwordHash = nuevoHash;
  }

  /**
   * Invalida todas las sesiones vigentes (access y refresh tokens ya emitidos): al
   * incrementar la version, cualquier token con la version anterior deja de validar.
   */
  invalidarSesiones(): void {
    this.tokenVersion += 1;
  }
}
