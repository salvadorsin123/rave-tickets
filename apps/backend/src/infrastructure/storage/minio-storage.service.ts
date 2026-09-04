import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { StorageServicePort } from '@application/ports/infrastructure.port';

/**
 * Almacenamiento de objetos sobre la API S3. En produccion apunta al contenedor MinIO
 * del propio stack, pero al ser S3-compatible sirve igual contra cualquier otro
 * proveedor (Cloudflare R2, Backblaze B2, S3) cambiando solo las variables MINIO_*.
 */
@Injectable()
export class MinioStorageService implements StorageServicePort, OnModuleInit {
  private readonly client: MinioClient;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    this.bucket = configService.get<string>('MINIO_BUCKET', 'boletos-pdf');
    this.client = new MinioClient({
      endPoint: configService.getOrThrow<string>('MINIO_ENDPOINT'),
      port: Number(configService.get<string>('MINIO_PORT', '9000')),
      useSSL: configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
  }

  /**
   * En el servidor de produccion el bucket ya deberia existir; esto es una red de
   * seguridad idempotente para entornos donde no se garantiza ese bootstrap (docker
   * compose local, bucket borrado manualmente, etc.). bucketExists/makeBucket no falla
   * ni recrea nada si el bucket ya existe.
   */
  async onModuleInit(): Promise<void> {
    const existe = await this.client.bucketExists(this.bucket);
    if (!existe) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async guardarArchivo(rutaRelativa: string, contenido: Buffer, contentType: string): Promise<string> {
    await this.client.putObject(this.bucket, rutaRelativa, contenido, contenido.length, {
      'Content-Type': contentType,
    });
    return rutaRelativa;
  }

  async obtenerArchivo(rutaRelativa: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, rutaRelativa);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
