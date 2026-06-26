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
}
