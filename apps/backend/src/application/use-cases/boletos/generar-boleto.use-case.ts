import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BOLETO_REPOSITORY,
  BoletoRepositoryPort,
  EVENTO_REPOSITORY,
  EventoRepositoryPort,
  VENTA_REPOSITORY,
  VentaRepositoryPort,
} from '@application/ports/repositories.port';
import {
  PDF_GENERATOR,
  PdfGeneratorPort,
  QR_GENERATOR,
  QrGeneratorPort,
  STORAGE_SERVICE,
  StorageServicePort,
} from '@application/ports/infrastructure.port';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { VentaEntity } from '@domain/entities/venta.entity';
import { Folio } from '@domain/value-objects/folio.vo';
import { TokenValidacion } from '@domain/value-objects/token-validacion.vo';
import { anioEnZonaMx } from '@shared/zona-horaria.util';

/**
 * UC-29: se ejecuta automaticamente al registrar una venta. Crea el boleto,
 * genera folio/UUID/token, embebe el QR en el PDF y guarda copia en storage.
 */
@Injectable()
export class GenerarBoletoUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY) private readonly ventaRepository: VentaRepositoryPort,
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort,
    @Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort,
    @Inject(QR_GENERATOR) private readonly qrGenerator: QrGeneratorPort,
    @Inject(PDF_GENERATOR) private readonly pdfGenerator: PdfGeneratorPort,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageServicePort,
  ) {}

  async execute(venta: VentaEntity): Promise<BoletoEntity> {
    const evento = await this.eventoRepository.findById(venta.eventoId);
    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }

    const anio = anioEnZonaMx(venta.fechaCompra);
    const secuencia = await this.ventaRepository.countByYear(anio);
    const folio = Folio.generar('RV', anio, secuencia);
    const token = TokenValidacion.generar();

    const boleto = await this.boletoRepository.create({
      folio: folio.toString(),
      ventaId: venta.id,
      eventoId: venta.eventoId,
      tokenValidacionHash: token.hash,
      personasCompradas: venta.cantidadPersonas,
    });

    const qrPng = await this.qrGenerator.generarPng({ uuid: boleto.id, token: token.valorPlano });
    // Si el logo/fondo no se pueden leer (borrados del storage, ruta invalida, etc.) el
    // boleto se genera igual sin ellos en vez de fallar toda la venta por un detalle decorativo.
    const [logoBuffer, fondoBuffer] = await Promise.all([
      evento.logoUrl ? this.storageService.obtenerArchivo(evento.logoUrl).catch(() => null) : null,
      evento.imagenFondoUrl
        ? this.storageService.obtenerArchivo(evento.imagenFondoUrl).catch(() => null)
        : null,
    ]);
    const pdfBuffer = await this.pdfGenerator.generarBoletoPdf({
      folio: boleto.folio,
      nombreComprador: venta.nombreComprador,
      cantidadPersonas: venta.cantidadPersonas,
      nombreEvento: evento.nombre,
      fechaEvento: evento.fecha,
      lugarEvento: evento.lugar,
      logoBuffer,
      fondoBuffer,
      qrPngBuffer: qrPng,
    });

    const pdfUrl = await this.storageService.guardarArchivo(
      `boletos/${boleto.folio}.pdf`,
      pdfBuffer,
      'application/pdf',
    );
    await this.boletoRepository.asignarPdfUrl(boleto.id, pdfUrl);
    boleto.asignarPdfUrl(pdfUrl);

    return boleto;
  }
}
