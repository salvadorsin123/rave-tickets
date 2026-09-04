/**
 * Validacion de variables de entorno al arranque (via ConfigModule.forRoot({ validate })).
 * Objetivo: que un despliegue de produccion nunca arranque con secretos ausentes o con los
 * valores de ejemplo/desarrollo. Falla ruidosamente al inicio en vez de correr inseguro.
 */

// Secretos placeholder que aparecen en .env.example y docker-compose: jamas deben usarse
// en produccion.
const SECRETOS_DEBILES = new Set([
  'change-me-access-secret',
  'change-me-refresh-secret',
  'dev-access-secret-cambiar',
  'dev-refresh-secret-cambiar',
]);

// Credenciales de ejemplo del stack local de MinIO: si llegan a produccion, cualquiera
// que alcance el puerto S3 puede leer y borrar los PDFs de los boletos.
const CREDENCIALES_MINIO_DEBILES = new Set(['minioadmin', 'change-me-minio-secret']);

const LONGITUD_MINIMA_SECRETO = 32;

export function validarEnv(config: Record<string, unknown>): Record<string, unknown> {
  const accessSecret = config.JWT_ACCESS_SECRET;
  const refreshSecret = config.JWT_REFRESH_SECRET;

  if (typeof accessSecret !== 'string' || accessSecret.length === 0) {
    throw new Error('JWT_ACCESS_SECRET es obligatorio');
  }
  if (typeof refreshSecret !== 'string' || refreshSecret.length === 0) {
    throw new Error('JWT_REFRESH_SECRET es obligatorio');
  }

  if (config.NODE_ENV === 'production') {
    const problemas: string[] = [];
    if (accessSecret.length < LONGITUD_MINIMA_SECRETO || refreshSecret.length < LONGITUD_MINIMA_SECRETO) {
      problemas.push(`los secretos JWT deben tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres`);
    }
    if (SECRETOS_DEBILES.has(accessSecret) || SECRETOS_DEBILES.has(refreshSecret)) {
      problemas.push('los secretos JWT no pueden ser los valores de ejemplo/desarrollo');
    }
    if (accessSecret === refreshSecret) {
      problemas.push('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
    }
    // Solo se valida si viene definida: su ausencia ya la detecta MinioStorageService al
    // construirse (getOrThrow), con un mensaje que apunta a la variable correcta.
    const minioSecret = config.MINIO_SECRET_KEY;
    if (typeof minioSecret === 'string' && CREDENCIALES_MINIO_DEBILES.has(minioSecret)) {
      problemas.push('MINIO_SECRET_KEY no puede ser la credencial de ejemplo del stack local');
    }
    if (problemas.length > 0) {
      throw new Error(`Configuracion insegura para produccion: ${problemas.join('; ')}`);
    }
  }

  return config;
}
