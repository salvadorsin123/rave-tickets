import { Module } from '@nestjs/common';
import { EscaneosController } from '@presentation/controllers/escaneos.controller';
import { ValidarEntradaUseCase } from '@application/use-cases/escaneos/validar-entrada.use-case';
import { HistorialPersonalUseCase } from '@application/use-cases/escaneos/historial-personal.use-case';
import { ConsultarEscaneosUseCase } from '@application/use-cases/escaneos/consultar-escaneos.use-case';

@Module({
  controllers: [EscaneosController],
  providers: [ValidarEntradaUseCase, HistorialPersonalUseCase, ConsultarEscaneosUseCase],
})
export class EscaneosModule {}
