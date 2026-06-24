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
      const doc = new PDFDocument({ margin: 30 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(titulo, { align: 'center' });
      doc.moveDown();

      if (filas.length === 0) {
        doc.fontSize(11).text('Sin datos para el periodo seleccionado.');
      } else {
        const columnas = Object.keys(filas[0]);
        doc.fontSize(9).text(columnas.join(' | '));
        doc.moveDown(0.5);
        for (const fila of filas) {
          doc.text(columnas.map((c) => String(fila[c] ?? '')).join(' | '));
        }
      }

      doc.end();
    });
  }
}
