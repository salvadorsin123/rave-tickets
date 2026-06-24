import { ConflictException } from '@nestjs/common';
import { ValidarSalidaUseCase } from './validar-salida.use-case';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { VentaEntity } from '@domain/entities/venta.entity';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';
import { ResultadoEscaneo } from '@domain/enums/resultado-escaneo.enum';
import { TokenValidacion } from '@domain/value-objects/token-validacion.vo';
import {
  BoletoRepositoryPort,
  BitacoraRepositoryPort,
  EscaneoRepositoryPort,
  VentaRepositoryPort,
} from '@application/ports/repositories.port';

const TOKEN_PLANO = 'token-de-prueba';
const TOKEN_HASH = TokenValidacion.hashear(TOKEN_PLANO);

interface BoletoOverrides {
  personasIngresadas?: number;
  estado?: EstadoBoleto;
}

function crearBoleto(overrides: BoletoOverrides = {}): BoletoEntity {
  return new BoletoEntity(
    'boleto-1',
    'RV-2026-0001',
    'venta-1',
    'evento-1',
    TOKEN_HASH,
    2,
    overrides.personasIngresadas ?? 1,
    overrides.estado ?? EstadoBoleto.PARCIALMENTE_UTILIZADO,
    null,
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-01T00:00:00Z'),
  );
}

const CONTEXTO = { escaneadorId: 'escaneador-1', ipAddress: '127.0.0.1', deviceInfo: 'jest' };

describe('ValidarSalidaUseCase', () => {
  let boletoRepository: jest.Mocked<BoletoRepositoryPort>;
  let ventaRepository: jest.Mocked<VentaRepositoryPort>;
  let escaneoRepository: jest.Mocked<EscaneoRepositoryPort>;
  let bitacoraRepository: jest.Mocked<BitacoraRepositoryPort>;
  let useCase: ValidarSalidaUseCase;

  beforeEach(() => {
    boletoRepository = {
      findById: jest.fn(),
      findByVentaId: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      asignarPdfUrl: jest.fn(),
      actualizarEstado: jest.fn(),
      actualizarIngresoAtomico: jest.fn(),
    };
    ventaRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      countByYear: jest.fn(),
    };
    escaneoRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      primerIngresoDe: jest.fn(),
      contarPorEscaneador: jest.fn(),
      topEscaneadores: jest.fn(),
    };
    bitacoraRepository = { registrar: jest.fn(), findAll: jest.fn() };

    useCase = new ValidarSalidaUseCase(
      boletoRepository,
      ventaRepository,
      escaneoRepository,
      bitacoraRepository,
    );
  });

  it('responde QR NO VALIDO cuando el boleto no existe', async () => {
    boletoRepository.findById.mockResolvedValue(null);

    const resultado = await useCase.execute({ uuid: 'no-existe', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.INVALIDO);
    expect(escaneoRepository.create).not.toHaveBeenCalled();
  });

  it('responde FRAUDE cuando el boleto esta en un estado terminal', async () => {
    boletoRepository.findById.mockResolvedValue(crearBoleto({ estado: EstadoBoleto.CANCELADO }));

    const resultado = await useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.FRAUDE);
  });

  it('responde SIN_INGRESOS cuando nadie del boleto esta dentro', async () => {
    boletoRepository.findById.mockResolvedValue(
      crearBoleto({ personasIngresadas: 0, estado: EstadoBoleto.PENDIENTE }),
    );

    const resultado = await useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.SIN_INGRESOS);
  });

  it('registra la salida de una persona y libera cupo', async () => {
    const boleto = crearBoleto({ personasIngresadas: 1 });
    boletoRepository.findById.mockResolvedValue(boleto);
    boletoRepository.actualizarIngresoAtomico.mockResolvedValue(true);
    ventaRepository.findById.mockResolvedValue(
      new VentaEntity('venta-1', 'evento-1', 'Juan Perez', null, 2, null, 'admin-1', new Date()),
    );

    const resultado = await useCase.execute(
      { uuid: 'boleto-1', token: TOKEN_PLANO, personasSalen: 1 },
      CONTEXTO,
    );

    expect(resultado.resultado).toBe(ResultadoEscaneo.SALIDA_VALIDA);
    expect(resultado.boleto?.personasIngresadas).toBe(0);
    expect(boletoRepository.actualizarIngresoAtomico).toHaveBeenCalledWith(
      'boleto-1',
      1,
      0,
      EstadoBoleto.PENDIENTE,
    );
  });

  it('reintenta el compare-and-swap si una escritura concurrente le gana la carrera', async () => {
    const boletoInicial = crearBoleto({ personasIngresadas: 2, estado: EstadoBoleto.UTILIZADO });
    const boletoRecargado = crearBoleto({
      personasIngresadas: 1,
      estado: EstadoBoleto.PARCIALMENTE_UTILIZADO,
    });
    boletoRepository.findById.mockResolvedValueOnce(boletoInicial).mockResolvedValueOnce(boletoRecargado);
    boletoRepository.actualizarIngresoAtomico.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    ventaRepository.findById.mockResolvedValue(
      new VentaEntity('venta-1', 'evento-1', 'Juan Perez', null, 2, null, 'admin-1', new Date()),
    );

    const resultado = await useCase.execute(
      { uuid: 'boleto-1', token: TOKEN_PLANO, personasSalen: 1 },
      CONTEXTO,
    );

    expect(resultado.resultado).toBe(ResultadoEscaneo.SALIDA_VALIDA);
    expect(boletoRepository.actualizarIngresoAtomico).toHaveBeenCalledTimes(2);
  });

  it('lanza ConflictException si se agotan los reintentos por concurrencia', async () => {
    const boleto = crearBoleto({ personasIngresadas: 1 });
    boletoRepository.findById.mockResolvedValue(boleto);
    boletoRepository.actualizarIngresoAtomico.mockResolvedValue(false);

    await expect(useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
