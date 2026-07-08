import { randomUUID } from 'crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { STORAGE_SERVICE, StorageServicePort } from '@application/ports/infrastructure.port';
import { validarImagenJpgPng } from '@shared/imagen.util';

@Injectable()
export class SubirFondoEventoUseCase {
  constructor(@Inject(STORAGE_SERVICE) private readonly storageService: StorageServicePort) {}

  async execute(archivo: { buffer: Buffer; mimetype: string } | undefined): Promise<string> {
    if (!archivo) {
      throw new BadRequestException('Debes adjuntar un archivo de imagen');
    }

    // Valida por magic bytes (no solo por el Content-Type declarado, falsificable): solo
    // jpeg/png, unicos formatos que pdfkit puede embeber en el PDF del boleto.
    const extension = validarImagenJpgPng(archivo.buffer, archivo.mimetype);
    const rutaRelativa = `eventos-fondos/${randomUUID()}.${extension}`;
    return this.storageService.guardarArchivo(rutaRelativa, archivo.buffer, archivo.mimetype);
  }
}
