import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { QrGeneratorPort } from '@application/ports/infrastructure.port';

@Injectable()
export class QrCodeGeneratorService implements QrGeneratorPort {
  async generarPng(payload: Record<string, string>): Promise<Buffer> {
    const contenido = JSON.stringify(payload);
    return QRCode.toBuffer(contenido, { type: 'png', errorCorrectionLevel: 'M', margin: 1, width: 400 });
  }
}
