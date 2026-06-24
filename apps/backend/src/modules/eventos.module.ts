import { Module } from '@nestjs/common';
import { EventosController } from '@presentation/controllers/eventos.controller';
import { CrearEventoUseCase } from '@application/use-cases/eventos/crear-evento.use-case';
import { EditarEventoUseCase } from '@application/use-cases/eventos/editar-evento.use-case';
import { CerrarEventoUseCase } from '@application/use-cases/eventos/cerrar-evento.use-case';
import { DuplicarConfiguracionUseCase } from '@application/use-cases/eventos/duplicar-configuracion.use-case';
import { ConsultarEventosUseCase } from '@application/use-cases/eventos/consultar-eventos.use-case';
import { SubirLogoEventoUseCase } from '@application/use-cases/eventos/subir-logo-evento.use-case';
import { ObtenerLogoEventoUseCase } from '@application/use-cases/eventos/obtener-logo-evento.use-case';
import { SubirFondoEventoUseCase } from '@application/use-cases/eventos/subir-fondo-evento.use-case';
import { ObtenerFondoEventoUseCase } from '@application/use-cases/eventos/obtener-fondo-evento.use-case';

@Module({
  controllers: [EventosController],
  providers: [
    CrearEventoUseCase,
    EditarEventoUseCase,
    CerrarEventoUseCase,
    DuplicarConfiguracionUseCase,
    ConsultarEventosUseCase,
    SubirLogoEventoUseCase,
    ObtenerLogoEventoUseCase,
    SubirFondoEventoUseCase,
    ObtenerFondoEventoUseCase,
  ],
})
export class EventosModule {}
