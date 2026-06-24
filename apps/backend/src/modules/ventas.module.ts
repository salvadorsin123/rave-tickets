import { Module } from '@nestjs/common';
import { VentasController } from '@presentation/controllers/ventas.controller';
import { RegistrarVentaUseCase } from '@application/use-cases/ventas/registrar-venta.use-case';
import { ConsultarVentasUseCase } from '@application/use-cases/ventas/consultar-ventas.use-case';
import { BoletosModule } from '@modules/boletos.module';

@Module({
  imports: [BoletosModule],
  controllers: [VentasController],
  providers: [RegistrarVentaUseCase, ConsultarVentasUseCase],
})
export class VentasModule {}
