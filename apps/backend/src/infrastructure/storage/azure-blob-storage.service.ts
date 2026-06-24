import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { StorageServicePort } from '@application/ports/infrastructure.port';

@Injectable()
export class AzureBlobStorageService implements StorageServicePort, OnModuleInit {
  private readonly containerClient: ContainerClient;

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('AZURE_STORAGE_CONNECTION_STRING');
    const containerName = configService.get<string>('AZURE_STORAGE_CONTAINER', 'boletos-pdf');
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * En Azure real el contenedor ya existe (lo crea el Bicep de infraestructura); esto es
   * una red de seguridad idempotente para entornos donde no se garantiza ese bootstrap
   * (Azurite local, contenedor borrado manualmente, etc.). createIfNotExists no falla ni
   * recrea nada si el contenedor ya existe.
   */
  async onModuleInit(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  async guardarArchivo(rutaRelativa: string, contenido: Buffer, contentType: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(rutaRelativa);
    await blockBlobClient.upload(contenido, contenido.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return rutaRelativa;
  }

  async obtenerArchivo(rutaRelativa: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(rutaRelativa);
    return blockBlobClient.downloadToBuffer();
  }
}
