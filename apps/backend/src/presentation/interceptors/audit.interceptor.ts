import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { BITACORA_REPOSITORY, BitacoraRepositoryPort } from '@application/ports/repositories.port';
import { TokenPayload } from '@application/ports/infrastructure.port';

const METODOS_AUDITABLES = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Complementa la bitacora fina que ya registran ciertos casos de uso (cancelar/reembolsar/
 * bloquear boleto, escaneos): aqui se deja un rastro generico de toda mutacion HTTP, incluso
 * la de endpoints que aun no llaman a BitacoraRepositoryPort explicitamente.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!METODOS_AUDITABLES.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const usuario = request.user as TokenPayload | undefined;
        this.bitacoraRepository
          .registrar({
            usuarioId: usuario?.sub ?? null,
            accion: `${request.method} ${request.route?.path ?? request.url}`,
            entidadAfectada: this.inferirEntidad(request.url),
            entidadId: typeof request.params?.id === 'string' ? request.params.id : null,
            detalles: null,
            ipAddress: request.ip ?? null,
          })
          .catch(() => undefined);
      }),
    );
  }

  private inferirEntidad(url: string): string {
    return url.split('?')[0].split('/').filter(Boolean)[1] ?? 'desconocido';
  }
}
