import { Inject, Injectable } from '@nestjs/common';
import {
  BOLETO_REPOSITORY,
  BoletoRepositoryPort,
  ESCANEO_REPOSITORY,
  EscaneoRepositoryPort,
  VENTA_REPOSITORY,
  VentaRepositoryPort,
} from '@application/ports/repositories.port';
import { REPORT_FORMATTER, ReportFormatterPort } from '@application/ports/infrastructure.port';
import {
  ArchivoReporte,
  ExportarReporteQueryDto,
  FormatoReporte,
  TipoReporte,
} from '@application/dtos/reportes.dto';

const CONTENT_TYPES: Record<FormatoReporte, string> = {
  [FormatoReporte.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [FormatoReporte.CSV]: 'text/csv',
  [FormatoReporte.PDF]: 'application/pdf',
};

@Injectable()
export class ExportarReporteUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY) private readonly ventaRepository: VentaRepositoryPort,
    @Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort,
    @Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort,
    @Inject(REPORT_FORMATTER) private readonly reportFormatter: ReportFormatterPort,
  ) {}

  async execute(query: ExportarReporteQueryDto): Promise<ArchivoReporte> {
    const filas = await this.obtenerFilas(query);
    const contenido = await this.formatear(query.formato, filas, query.tipo);

    return {
      nombreArchivo: `${query.tipo}.${this.extension(query.formato)}`,
      contentType: CONTENT_TYPES[query.formato],
      contenido,
    };
  }

  private async obtenerFilas(query: ExportarReporteQueryDto): Promise<Record<string, unknown>[]> {
    switch (query.tipo) {
      case TipoReporte.VENTAS: {
        const ventas = await this.ventaRepository.findAll({
          eventoId: query.eventoId,
          desde: query.desde,
          hasta: query.hasta,
        });
        return ventas.map((v) => ({
          id: v.id,
          comprador: v.nombreComprador,
          email: v.email ?? '',
          personas: v.cantidadPersonas,
          monto: v.montoTotal ?? 0,
          fechaCompra: v.fechaCompra.toISOString(),
        }));
      }
      case TipoReporte.BOLETOS: {
        const boletos = await this.boletoRepository.findAll({ eventoId: query.eventoId });
        return boletos.map((b) => ({
          folio: b.folio,
          estado: b.estado,
          personasCompradas: b.personasCompradas,
          personasIngresadas: b.personasIngresadas,
        }));
      }
      case TipoReporte.ESCANEOS: {
        const escaneos = await this.escaneoRepository.findAll({ eventoId: query.eventoId });
        return escaneos.map((e) => ({
          boletoId: e.boletoId,
          escaneadorId: e.escaneadorId,
          personasIngresadas: e.personasIngresadasEnEsteEscaneo,
          resultado: e.resultado,
          fechaHora: e.fechaHora.toISOString(),
        }));
      }
    }
  }

  private async formatear(
    formato: FormatoReporte,
    filas: Record<string, unknown>[],
    tipo: TipoReporte,
  ): Promise<Buffer> {
    switch (formato) {
      case FormatoReporte.EXCEL:
        return this.reportFormatter.generarExcel(filas, tipo);
      case FormatoReporte.CSV:
        return this.reportFormatter.generarCsv(filas);
      case FormatoReporte.PDF:
        return this.reportFormatter.generarPdfTabla(filas, `Reporte de ${tipo}`);
    }
  }

  private extension(formato: FormatoReporte): string {
    return formato === FormatoReporte.EXCEL ? 'xlsx' : formato === FormatoReporte.CSV ? 'csv' : 'pdf';
  }
}
