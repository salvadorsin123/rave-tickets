import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOLETO_REPOSITORY, BoletoRepositoryPort } from '@application/ports/repositories.port';
import { STORAGE_SERVICE, StorageServicePort } from '@application/ports/infrastructure.port';

/** Cubre UC-09 (reenviar) y UC-10 (descargar/reimprimir): ambas recuperan la misma copia almacenada del PDF. */
@Injectable()
export class ObtenerPdfBoletoUseCase {
  constructor(
    @Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageServicePort,
  ) {}

  async execute(boletoId: string): Promise<{ nombreArchivo: string; contenido: Buffer }> {
    const boleto = await this.boletoRepository.findById(boletoId);
    if (!boleto || !boleto.pdfUrl) {
      throw new NotFoundException('Boleto o PDF no encontrado');
    }

    const contenido = await this.storageService.obtenerArchivo(boleto.pdfUrl);
    return { nombreArchivo: `${boleto.folio}.pdf`, contenido };
  }
}
