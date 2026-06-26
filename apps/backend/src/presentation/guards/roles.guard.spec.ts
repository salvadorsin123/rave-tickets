import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RolNombre } from '@domain/enums/rol.enum';

function crearContexto(rol: RolNombre | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: rol ? { rol } : undefined }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  function requerir(...roles: RolNombre[]): void {
    reflector.getAllAndOverride.mockReturnValue(roles);
  }

  it('permite el acceso si el endpoint no exige ningun rol', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(crearContexto(RolNombre.ESCANEADOR))).toBe(true);
  });

  it('un super_admin satisface un endpoint que exige admin', () => {
    requerir(RolNombre.ADMIN);
    expect(guard.canActivate(crearContexto(RolNombre.SUPER_ADMIN))).toBe(true);
  });

  it('un super_admin satisface un endpoint que exige super_admin', () => {
    requerir(RolNombre.SUPER_ADMIN);
    expect(guard.canActivate(crearContexto(RolNombre.SUPER_ADMIN))).toBe(true);
  });

  it('un admin NO satisface un endpoint que exige super_admin', () => {
    requerir(RolNombre.SUPER_ADMIN);
    expect(guard.canActivate(crearContexto(RolNombre.ADMIN))).toBe(false);
  });

  it('un escaneador no satisface ni admin ni super_admin', () => {
    requerir(RolNombre.ADMIN, RolNombre.SUPER_ADMIN);
    expect(guard.canActivate(crearContexto(RolNombre.ESCANEADOR))).toBe(false);
  });

  it('rechaza si no hay usuario en la request', () => {
    requerir(RolNombre.ADMIN);
    expect(guard.canActivate(crearContexto(undefined))).toBe(false);
  });
});
