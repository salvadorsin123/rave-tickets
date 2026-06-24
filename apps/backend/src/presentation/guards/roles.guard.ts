import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolNombre } from '@domain/enums/rol.enum';
import { ROLES_KEY } from '@presentation/decorators/roles.decorator';

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
    return !!usuario?.rol && rolesRequeridos.includes(usuario.rol as RolNombre);
  }
}
