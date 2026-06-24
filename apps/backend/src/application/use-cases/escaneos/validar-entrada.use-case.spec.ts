import { ConflictException } from '@nestjs/common';
import { ValidarEntradaUseCase } from './validar-entrada.use-case';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { VentaEntity } from '@domain/entities/venta.entity';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';
import { ResultadoEscaneo } from '@domain/enums/resultado-escaneo.enum';
import { TokenValidacion } from '@domain/value-objects/token-validacion.vo';
import {
  BoletoRepositoryPort,
  BitacoraRepositoryPort,
  EscaneoRepositoryPort,
  UsuarioRepositoryPort,
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
    overrides.personasIngresadas ?? 0,
    overrides.estado ?? EstadoBoleto.PENDIENTE,
    null,
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-01T00:00:00Z'),
  );
}

const CONTEXTO = { escaneadorId: 'escaneador-1', ipAddress: '127.0.0.1', deviceInfo: 'jest' };

describe('ValidarEntradaUseCase', () => {
  let boletoRepository: jest.Mocked<BoletoRepositoryPort>;
  let ventaRepository: jest.Mocked<VentaRepositoryPort>;
  let escaneoRepository: jest.Mocked<EscaneoRepositoryPort>;
  let bitacoraRepository: jest.Mocked<BitacoraRepositoryPort>;
  let usuarioRepository: jest.Mocked<UsuarioRepositoryPort>;
  let useCase: ValidarEntradaUseCase;

  beforeEach(() => {
    boletoRepository = {
      findById: jest.fn(),
      findByVentaId: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      asignarPdfUrl: jest.fn(),
      actualizarEstado: jest.fn(),
      incrementarIngresoAtomico: jest.fn(),
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
    usuarioRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAllByRol: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ValidarEntradaUseCase(
      boletoRepository,
      ventaRepository,
      escaneoRepository,
      bitacoraRepository,
      usuarioRepository,
    );
  });

  it('responde QR NO VALIDO cuando el boleto no existe', async () => {
    boletoRepository.findById.mockResolvedValue(null);

    const resultado = await useCase.execute({ uuid: 'no-existe', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.INVALIDO);
    expect(bitacoraRepository.registrar).toHaveBeenCalledTimes(1);
    expect(escaneoRepository.create).not.toHaveBeenCalled();
  });

  it('responde QR NO VALIDO cuando el token no coincide con el hash almacenado', async () => {
    boletoRepository.findById.mockResolvedValue(crearBoleto());

    const resultado = await useCase.execute({ uuid: 'boleto-1', token: 'token-incorrecto' }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.INVALIDO);
    expect(escaneoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: ResultadoEscaneo.INVALIDO }),
    );
  });

  it('responde FRAUDE cuando el boleto esta en un estado terminal', async () => {
    boletoRepository.findById.mockResolvedValue(crearBoleto({ estado: EstadoBoleto.CANCELADO }));

    const resultado = await useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.FRAUDE);
  });

  it('responde YA UTILIZADO cuando no queda cupo disponible', async () => {
    const boleto = crearBoleto({ personasIngresadas: 2 });
    boletoRepository.findById.mockResolvedValue(boleto);
    escaneoRepository.primerIngresoDe.mockResolvedValue(null);

    const resultado = await useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.YA_UTILIZADO);
  });

  it('registra el ingreso completo y responde VALIDO', async () => {
    const boleto = crearBoleto();
    boletoRepository.findById.mockResolvedValue(boleto);
    boletoRepository.incrementarIngresoAtomico.mockResolvedValue(true);
    ventaRepository.findById.mockResolvedValue(
      new VentaEntity('venta-1', 'evento-1', 'Juan Perez', null, 2, null, 'admin-1', new Date()),
    );

    const resultado = await useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO);

    expect(resultado.resultado).toBe(ResultadoEscaneo.VALIDO);
    expect(resultado.boleto?.personasIngresadas).toBe(2);
    expect(boletoRepository.incrementarIngresoAtomico).toHaveBeenCalledWith(
      'boleto-1',
      0,
      2,
      EstadoBoleto.UTILIZADO,
    );
  });

  it('registra un ingreso parcial cuando se especifica personasIngresan', async () => {
    const boleto = crearBoleto();
    boletoRepository.findById.mockResolvedValue(boleto);
    boletoRepository.incrementarIngresoAtomico.mockResolvedValue(true);
    ventaRepository.findById.mockResolvedValue(
      new VentaEntity('venta-1', 'evento-1', 'Juan Perez', null, 2, null, 'admin-1', new Date()),
    );

    const resultado = await useCase.execute(
      { uuid: 'boleto-1', token: TOKEN_PLANO, personasIngresan: 1 },
      CONTEXTO,
    );

    expect(resultado.resultado).toBe(ResultadoEscaneo.VALIDO);
    expect(resultado.boleto?.personasIngresadas).toBe(1);
    expect(boletoRepository.incrementarIngresoAtomico).toHaveBeenCalledWith(
      'boleto-1',
      0,
      1,
      EstadoBoleto.PARCIALMENTE_UTILIZADO,
    );
  });

  it('reintenta el compare-and-swap si una escritura concurrente le gana la carrera', async () => {
    const boletoInicial = crearBoleto();
    const boletoRecargado = crearBoleto({
      personasIngresadas: 1,
      estado: EstadoBoleto.PARCIALMENTE_UTILIZADO,
    });
    boletoRepository.findById.mockResolvedValueOnce(boletoInicial).mockResolvedValueOnce(boletoRecargado);
    boletoRepository.incrementarIngresoAtomico.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    ventaRepository.findById.mockResolvedValue(
      new VentaEntity('venta-1', 'evento-1', 'Juan Perez', null, 2, null, 'admin-1', new Date()),
    );

    const resultado = await useCase.execute(
      { uuid: 'boleto-1', token: TOKEN_PLANO, personasIngresan: 1 },
      CONTEXTO,
    );

    expect(resultado.resultado).toBe(ResultadoEscaneo.VALIDO);
    expect(boletoRepository.incrementarIngresoAtomico).toHaveBeenCalledTimes(2);
  });

  it('lanza ConflictException si se agotan los reintentos por concurrencia', async () => {
    const boleto = crearBoleto();
    boletoRepository.findById.mockResolvedValue(boleto);
    boletoRepository.incrementarIngresoAtomico.mockResolvedValue(false);

    await expect(useCase.execute({ uuid: 'boleto-1', token: TOKEN_PLANO }, CONTEXTO)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
