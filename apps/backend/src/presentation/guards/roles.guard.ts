import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolNombre } from '@domain/enums/rol.enum';
import { ROLES_KEY } from '@presentation/decorators/roles.decorator';

// Un super_admin satisface implicitamente cualquier endpoint que solo exija admin, sin
// tener que listar ambos roles en cada @Roles(...) de los controladores existentes.
const ROLES_EFECTIVOS: Record<RolNombre, RolNombre[]> = {
  [RolNombre.SUPER_ADMIN]: [RolNombre.SUPER_ADMIN, RolNombre.ADMIN],
  [RolNombre.ADMIN]: [RolNombre.ADMIN],
  [RolNombre.ESCANEADOR]: [RolNombre.ESCANEADOR],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolNombre[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const usuario = context.switchToHttp().getRequest().user as { rol?: string } | undefined;
    if (!usuario?.rol) {
      return false;
    }

    const rolEfectivos = ROLES_EFECTIVOS[usuario.rol as RolNombre] ?? [usuario.rol as RolNombre];
    return rolesRequeridos.some((rol) => rolEfectivos.includes(rol));
  }
}
