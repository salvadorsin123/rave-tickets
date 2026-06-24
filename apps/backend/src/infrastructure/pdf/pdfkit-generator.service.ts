import { Injectable } from '@nestjs/common';
// pdfkit es un modulo CommonJS puro (`module.exports = PDFDocument`); sus tipos declaran un
// default export "ESM-style" que no existe en runtime. El import por default compila a
// `pdfkit_1.default` y rompe con "is not a constructor". Este import-require evita el problema.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { DatosPdfBoleto, PdfGeneratorPort } from '@application/ports/infrastructure.port';
import { ZONA_HORARIA_MX } from '@shared/zona-horaria.util';

const NEGRO = '#111111';
const GRIS = '#555555';
const FONDO = '#f5f4f1';

@Injectable()
export class PdfKitGeneratorService implements PdfGeneratorPort {
  async generarBoletoPdf(datos: DatosPdfBoleto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 0 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const ancho = doc.page.width;
      const alto = doc.page.height;
      const margenExterior = 14;
      const margenInterior = 26;
      const anchoContenido = ancho - margenInterior * 2;

      doc.rect(0, 0, ancho, alto).fill(FONDO);

      if (datos.fondoBuffer) {
        try {
          // Imagen de fondo del evento, opacada un 70% (alpha 0.3) para que el texto y el QR
          // sigan siendo legibles encima. "cover" la recorta y escala para llenar exactamente
          // el tamaño de la pagina del PDF sin distorsionar su proporcion.
          doc.save();
          doc.opacity(0.3);
          doc.image(datos.fondoBuffer, 0, 0, { cover: [ancho, alto] });
          doc.restore();
        } catch {
          // Imagen corrupta o en un formato que pdfkit no puede decodificar: se omite y el
          // boleto se genera igual, solo con el color de fondo solido.
        }
      }

      doc
        .lineWidth(2)
        .rect(margenExterior, margenExterior, ancho - margenExterior * 2, alto - margenExterior * 2)
        .stroke(NEGRO);

      let y = margenExterior + 22;

      if (datos.logoBuffer) {
        try {
          const logoAncho = 150;
          const logoAlto = 95;
          doc.image(datos.logoBuffer, (ancho - logoAncho) / 2, y, {
            fit: [logoAncho, logoAlto],
            align: 'center',
          });
          y += logoAlto + 14;
        } catch {
          // Logo corrupto o en un formato que pdfkit no puede decodificar: se omite y el
          // boleto se genera igual, sin bloquear la venta por un detalle decorativo.
        }
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(21)
        .fillColor(NEGRO)
        .text(datos.nombreEvento.toUpperCase(), margenInterior, y, {
          width: anchoContenido,
          align: 'center',
        });
      y = doc.y + 4;

      const fechaTexto = datos.fechaEvento.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: ZONA_HORARIA_MX,
      });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(GRIS)
        .text(`${fechaTexto}${datos.lugarEvento ? ' · ' + datos.lugarEvento : ''}`, margenInterior, y, {
          width: anchoContenido,
          align: 'center',
        });
      y = doc.y + 14;

      doc
        .moveTo(margenInterior, y)
        .lineTo(ancho - margenInterior, y)
        .lineWidth(1)
        .stroke(NEGRO);
      y += 16;

      doc
        .font('Helvetica-Bold')
        .fontSize(19)
        .fillColor(NEGRO)
        .text(`FOLIO ${datos.folio}`, margenInterior, y, { width: anchoContenido, align: 'center' });
      y = doc.y + 8;

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(NEGRO)
        .text(datos.nombreComprador, margenInterior, y, { width: anchoContenido, align: 'center' });
      y = doc.y + 2;

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(GRIS)
        .text(`${datos.cantidadPersonas} persona(s)`, margenInterior, y, {
          width: anchoContenido,
          align: 'center',
        });
      y = doc.y + 16;

      const qrSize = 145;
      doc.image(datos.qrPngBuffer, (ancho - qrSize) / 2, y, { width: qrSize, height: qrSize });
      y += qrSize + 14;

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(NEGRO)
        .text('ARE YOU IN?', margenInterior, y, { width: anchoContenido, align: 'center' });
      y = doc.y + 6;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(GRIS)
        .text('Presenta este codigo QR en el acceso. Boleto intransferible y unico.', margenInterior, y, {
          width: anchoContenido,
          align: 'center',
        });

      doc.end();
    });
  }
}
