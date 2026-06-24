import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EVENTO_REPOSITORY, EventoRepositoryPort } from '@application/ports/repositories.port';
import { STORAGE_SERVICE, StorageServicePort } from '@application/ports/infrastructure.port';

const CONTENT_TYPE_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export interface FondoEventoDescargable {
  contenido: Buffer;
  contentType: string;
}

@Injectable()
export class ObtenerFondoEventoUseCase {
  constructor(
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepositoryPort,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageServicePort,
  ) {}

  async execute(eventoId: string): Promise<FondoEventoDescargable> {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento?.imagenFondoUrl) {
      throw new NotFoundException('El evento no tiene imagen de fondo configurada');
    }

    const extension = evento.imagenFondoUrl.split('.').pop()?.toLowerCase() ?? '';
    const contentType = CONTENT_TYPE_POR_EXTENSION[extension] ?? 'application/octet-stream';
    const contenido = await this.storageService.obtenerArchivo(evento.imagenFondoUrl);
    return { contenido, contentType };
  }
}
