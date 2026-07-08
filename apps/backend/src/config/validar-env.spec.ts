import { validarEnv } from './validar-env';

const SECRETO_FUERTE_A = 'a'.repeat(40);
const SECRETO_FUERTE_B = 'b'.repeat(40);

describe('validarEnv', () => {
  it('lanza si falta JWT_ACCESS_SECRET', () => {
    expect(() => validarEnv({ JWT_REFRESH_SECRET: SECRETO_FUERTE_B })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('lanza si falta JWT_REFRESH_SECRET', () => {
    expect(() => validarEnv({ JWT_ACCESS_SECRET: SECRETO_FUERTE_A })).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('acepta secretos debiles fuera de produccion', () => {
    const config = {
      NODE_ENV: 'development',
      JWT_ACCESS_SECRET: 'dev-access-secret-cambiar',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-cambiar',
    };
    expect(() => validarEnv(config)).not.toThrow();
  });

  it('en produccion rechaza los secretos de ejemplo', () => {
    expect(() =>
      validarEnv({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'change-me-access-secret',
        JWT_REFRESH_SECRET: 'change-me-refresh-secret',
      }),
    ).toThrow(/produccion/);
  });

  it('en produccion rechaza secretos demasiado cortos', () => {
    expect(() =>
      validarEnv({ NODE_ENV: 'production', JWT_ACCESS_SECRET: 'corto', JWT_REFRESH_SECRET: 'tambien-corto' }),
    ).toThrow(/32 caracteres/);
  });

  it('en produccion rechaza que ambos secretos sean iguales', () => {
    expect(() =>
      validarEnv({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: SECRETO_FUERTE_A,
        JWT_REFRESH_SECRET: SECRETO_FUERTE_A,
      }),
    ).toThrow(/distintos/);
  });

  it('en produccion acepta secretos fuertes y distintos', () => {
    const config = {
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: SECRETO_FUERTE_A,
      JWT_REFRESH_SECRET: SECRETO_FUERTE_B,
    };
    expect(validarEnv(config)).toBe(config);
  });
});
