import { Module } from '@nestjs/common';
import { AuditoriaController } from '@presentation/controllers/auditoria.controller';
import { ConsultarBitacoraUseCase } from '@application/use-cases/auditoria/consultar-bitacora.use-case';

@Module({
  controllers: [AuditoriaController],
  providers: [ConsultarBitacoraUseCase],
})
export class AuditoriaModule {}
