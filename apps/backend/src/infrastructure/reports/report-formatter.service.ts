import { Injectable } from '@nestjs/common';
// exceljs es CJS puro (module.exports = { Workbook, ... }, sin "default"); el import por
// default compila a `exceljs_1.default` (undefined) y rompe "Cannot read properties of
// undefined (reading 'Workbook')". El import de namespace evita el problema.
import * as ExcelJS from 'exceljs';
import { Parser as CsvParser } from 'json2csv';
// Ver nota en pdfkit-generator.service.ts: pdfkit es CJS puro, el default import rompe en runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { ReportFormatterPort } from '@application/ports/infrastructure.port';

const MARGEN = 36;
const ALTO_FILA = 20;
const PADDING_CELDA = 6;
const ANCHO_COLUMNA_MINIMO = 50;
const NEGRO = '#111111';
const COLOR_ENCABEZADO = '#222222';
const COLOR_TEXTO_ENCABEZADO = '#ffffff';
const COLOR_BORDE = '#dddddd';
const COLOR_ZEBRA = '#f5f4f1';

@Injectable()
export class ReportFormatterService implements ReportFormatterPort {
  async generarExcel(filas: Record<string, unknown>[], nombreHoja: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(nombreHoja);
    if (filas.length > 0) {
      sheet.columns = Object.keys(filas[0]).map((key) => ({ header: key, key }));
      sheet.addRows(filas);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generarCsv(filas: Record<string, unknown>[]): Promise<Buffer> {
    if (filas.length === 0) {
      return Buffer.from('');
    }
    const parser = new CsvParser({ fields: Object.keys(filas[0]) });
    return Buffer.from(parser.parse(filas));
  }

  async generarPdfTabla(filas: Record<string, unknown>[], titulo: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: MARGEN, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const anchoDisponible = doc.page.width - MARGEN * 2;

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(NEGRO)
        .text(titulo, MARGEN, MARGEN, { width: anchoDisponible, align: 'center' });
      let y = doc.y + 16;

      if (filas.length === 0) {
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor(NEGRO)
          .text('Sin datos para el periodo seleccionado.', MARGEN, y);
        doc.end();
        return;
      }

      const columnas = Object.keys(filas[0]);
      const anchos = this.calcularAnchosColumnas(doc, columnas, filas, anchoDisponible);

      const dibujarEncabezado = () => {
        doc.rect(MARGEN, y, anchoDisponible, ALTO_FILA).fill(COLOR_ENCABEZADO);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_TEXTO_ENCABEZADO);
        let x = MARGEN;
        columnas.forEach((columna, i) => {
          doc.text(this.humanizarEncabezado(columna), x + PADDING_CELDA, y + 6, {
            width: anchos[i] - PADDING_CELDA * 2,
            height: ALTO_FILA - 4,
            ellipsis: true,
          });
          x += anchos[i];
        });
        y += ALTO_FILA;
      };

      dibujarEncabezado();

      filas.forEach((fila, indiceFila) => {
        if (y + ALTO_FILA > doc.page.height - MARGEN) {
          doc.addPage();
          y = MARGEN;
          dibujarEncabezado();
        }

        if (indiceFila % 2 === 1) {
          doc.rect(MARGEN, y, anchoDisponible, ALTO_FILA).fill(COLOR_ZEBRA);
        }

        doc.font('Helvetica').fontSize(8).fillColor(NEGRO);
        let x = MARGEN;
        columnas.forEach((columna, i) => {
          doc.text(String(fila[columna] ?? ''), x + PADDING_CELDA, y + 6, {
            width: anchos[i] - PADDING_CELDA * 2,
            height: ALTO_FILA - 4,
            ellipsis: true,
          });
          x += anchos[i];
        });

        doc.rect(MARGEN, y, anchoDisponible, ALTO_FILA).stroke(COLOR_BORDE);
        y += ALTO_FILA;
      });

      doc.end();
    });
  }

  private humanizarEncabezado(clave: string): string {
    const conEspacios = clave.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
  }

  private calcularAnchosColumnas(
    doc: PDFKit.PDFDocument,
    columnas: string[],
    filas: Record<string, unknown>[],
    anchoDisponible: number,
  ): number[] {
    const anchosContenido = columnas.map((columna) => {
      doc.font('Helvetica-Bold').fontSize(9);
      const anchoEncabezado = doc.widthOfString(this.humanizarEncabezado(columna));

      doc.font('Helvetica').fontSize(8);
      const anchoMaxCelda = filas.reduce(
        (max, fila) => Math.max(max, doc.widthOfString(String(fila[columna] ?? ''))),
        0,
      );

      return Math.max(anchoEncabezado, anchoMaxCelda) + PADDING_CELDA * 2;
    });

    const anchoTotal = anchosContenido.reduce((suma, ancho) => suma + ancho, 0);
    const factor = anchoDisponible / anchoTotal;
    return anchosContenido.map((ancho) => Math.max(ANCHO_COLUMNA_MINIMO, ancho * factor));
  }
}
