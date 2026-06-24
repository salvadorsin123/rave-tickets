import { NotFoundException } from '@nestjs/common';
import { RegistrarVentaUseCase } from './registrar-venta.use-case';
import { GenerarBoletoUseCase } from '@application/use-cases/boletos/generar-boleto.use-case';
import { EventoEntity } from '@domain/entities/evento.entity';
import { VentaEntity } from '@domain/entities/venta.entity';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { EstadoEvento } from '@domain/enums/estado-evento.enum';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';
import { EventoRepositoryPort, VentaRepositoryPort } from '@application/ports/repositories.port';

function crearEvento(estado: EstadoEvento = EstadoEvento.ACTIVO): EventoEntity {
  return new EventoEntity(
    'evento-1',
    'Rave de prueba',
    null,
    new Date('2026-12-31'),
    null,
    null,
    null,
    estado,
    null,
    'admin-1',
    new Date(),
    new Date(),
  );
}

describe('RegistrarVentaUseCase', () => {
  let eventoRepository: jest.Mocked<EventoRepositoryPort>;
  let ventaRepository: jest.Mocked<VentaRepositoryPort>;
  let generarBoletoUseCase: { execute: jest.Mock };
  let useCase: RegistrarVentaUseCase;

  beforeEach(() => {
    eventoRepository = { findById: jest.fn(), findAll: jest.fn(), create: jest.fn(), update: jest.fn() };
    ventaRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      countByYear: jest.fn(),
    };
    generarBoletoUseCase = { execute: jest.fn() };

    useCase = new RegistrarVentaUseCase(
      eventoRepository,
      ventaRepository,
      generarBoletoUseCase as unknown as GenerarBoletoUseCase,
    );
  });

  it('lanza NotFoundException si el evento no existe', async () => {
    eventoRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ eventoId: 'no-existe', nombreComprador: 'Juan', cantidadPersonas: 1 }, 'admin-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza la venta si el evento esta cerrado', async () => {
    eventoRepository.findById.mockResolvedValue(crearEvento(EstadoEvento.CERRADO));

    await expect(
      useCase.execute({ eventoId: 'evento-1', nombreComprador: 'Juan', cantidadPersonas: 1 }, 'admin-1'),
    ).rejects.toThrow('No se pueden registrar ventas en un evento cerrado');
  });

  it('crea la venta y dispara la generacion automatica del boleto', async () => {
    eventoRepository.findById.mockResolvedValue(crearEvento());
    const venta = new VentaEntity('venta-1', 'evento-1', 'Juan Perez', null, 2, 500, 'admin-1', new Date());
    ventaRepository.create.mockResolvedValue(venta);
    const boleto = new BoletoEntity(
      'boleto-1',
      'RV-2026-0001',
      'venta-1',
      'evento-1',
      'hash',
      2,
      0,
      EstadoBoleto.PENDIENTE,
      null,
      new Date(),
      new Date(),
    );
    generarBoletoUseCase.execute.mockResolvedValue(boleto);

    const resultado = await useCase.execute(
      { eventoId: 'evento-1', nombreComprador: 'Juan Perez', cantidadPersonas: 2, montoTotal: 500 },
      'admin-1',
    );

    expect(resultado.venta).toBe(venta);
    expect(resultado.boleto).toBe(boleto);
    expect(generarBoletoUseCase.execute).toHaveBeenCalledWith(venta);
  });
});
