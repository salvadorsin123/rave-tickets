import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  PASSWORD_HASHER,
  PDF_GENERATOR,
  QR_GENERATOR,
  REPORT_FORMATTER,
  STORAGE_SERVICE,
  TOKEN_SERVICE,
} from '@application/ports/infrastructure.port';
import { BcryptPasswordHasherService } from '@infrastructure/auth/bcrypt-password-hasher.service';
import { JwtTokenService } from '@infrastructure/auth/jwt-token.service';
import { JwtAccessStrategy } from '@infrastructure/auth/jwt-access.strategy';
import { PdfKitGeneratorService } from '@infrastructure/pdf/pdfkit-generator.service';
import { QrCodeGeneratorService } from '@infrastructure/qr/qrcode-generator.service';
import { AzureBlobStorageService } from '@infrastructure/storage/azure-blob-storage.service';
import { ReportFormatterService } from '@infrastructure/reports/report-formatter.service';

/** Modulo global: expone las implementaciones de infraestructura transversal (auth, pdf, qr, storage, reportes). */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [
    JwtAccessStrategy,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: PDF_GENERATOR, useClass: PdfKitGeneratorService },
    { provide: QR_GENERATOR, useClass: QrCodeGeneratorService },
    { provide: STORAGE_SERVICE, useClass: AzureBlobStorageService },
    { provide: REPORT_FORMATTER, useClass: ReportFormatterService },
  ],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE, PDF_GENERATOR, QR_GENERATOR, STORAGE_SERVICE, REPORT_FORMATTER],
})
export class InfrastructureModule {}
