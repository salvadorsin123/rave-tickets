import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from '@presentation/interceptors/audit.interceptor';

/** Registra el interceptor de bitacora globalmente; depende de BITACORA_REPOSITORY (PersistenceModule, global). */
@Global()
@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AuditModule {}
