import { RolNombre } from '../enums/rol.enum';

export class RolEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: RolNombre,
    public readonly permisos: string[] = [],
  ) {}

  tienePermiso(nombrePermiso: string): boolean {
    return this.permisos.includes(nombrePermiso);
  }
}
