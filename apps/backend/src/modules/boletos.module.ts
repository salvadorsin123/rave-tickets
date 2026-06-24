import { Module } from '@nestjs/common';
import { BoletosController } from '@presentation/controllers/boletos.controller';
import { ConsultarBoletosUseCase } from '@application/use-cases/boletos/consultar-boletos.use-case';
import { CancelarBoletoUseCase } from '@application/use-cases/boletos/cancelar-boleto.use-case';
import { ReembolsarBoletoUseCase } from '@application/use-cases/boletos/reembolsar-boleto.use-case';
import { BloquearFraudeBoletoUseCase } from '@application/use-cases/boletos/bloquear-fraude-boleto.use-case';
import { ObtenerPdfBoletoUseCase } from '@application/use-cases/boletos/obtener-pdf-boleto.use-case';
import { GenerarBoletoUseCase } from '@application/use-cases/boletos/generar-boleto.use-case';

@Module({
  controllers: [BoletosController],
  providers: [
    ConsultarBoletosUseCase,
    CancelarBoletoUseCase,
    ReembolsarBoletoUseCase,
    BloquearFraudeBoletoUseCase,
    ObtenerPdfBoletoUseCase,
    GenerarBoletoUseCase,
  ],
  exports: [GenerarBoletoUseCase],
})
export class BoletosModule {}
