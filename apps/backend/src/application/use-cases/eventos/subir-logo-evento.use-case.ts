import { randomUUID } from 'crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { STORAGE_SERVICE, StorageServicePort } from '@application/ports/infrastructure.port';

// Solo jpeg/png: son los unicos formatos que pdfkit puede embeber en el PDF del boleto
// (doc.image no soporta webp ni gif). Aceptar otros formatos aqui produciria un logo que
// se sube correctamente pero nunca aparece en el ticket.
const EXTENSION_POR_MIMETYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

@Injectable()
export class SubirLogoEventoUseCase {
  constructor(@Inject(STORAGE_SERVICE) private readonly storageService: StorageServicePort) {}

  async execute(archivo: { buffer: Buffer; mimetype: string } | undefined): Promise<string> {
    if (!archivo) {
      throw new BadRequestException('Debes adjuntar un archivo de imagen');
    }

    const extension = EXTENSION_POR_MIMETYPE[archivo.mimetype];
    if (!extension) {
      throw new BadRequestException('El logo debe ser una imagen JPG o PNG');
    }

    const rutaRelativa = `eventos-logos/${randomUUID()}.${extension}`;
    return this.storageService.guardarArchivo(rutaRelativa, archivo.buffer, archivo.mimetype);
  }
}
