export const PDF_GENERATOR = Symbol('PDF_GENERATOR');
export const QR_GENERATOR = Symbol('QR_GENERATOR');
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface DatosPdfBoleto {
  folio: string;
  nombreComprador: string;
  cantidadPersonas: number;
  nombreEvento: string;
  fechaEvento: Date;
  lugarEvento: string | null;
  logoBuffer: Buffer | null;
  fondoBuffer: Buffer | null;
  qrPngBuffer: Buffer;
}

export interface PdfGeneratorPort {
  generarBoletoPdf(datos: DatosPdfBoleto): Promise<Buffer>;
}

export interface QrGeneratorPort {
  generarPng(payload: Record<string, string>): Promise<Buffer>;
}

export interface StorageServicePort {
  guardarArchivo(rutaRelativa: string, contenido: Buffer, contentType: string): Promise<string>;
  obtenerArchivo(rutaRelativa: string): Promise<Buffer>;
}

export interface PasswordHasherPort {
  hash(valorPlano: string): Promise<string>;
  comparar(valorPlano: string, hash: string): Promise<boolean>;
}

export interface TokenPayload {
  sub: string;
  rol: string;
}

export interface TokenServicePort {
  generarAccessToken(payload: TokenPayload): string;
  generarRefreshToken(payload: TokenPayload): string;
  verificarRefreshToken(token: string): TokenPayload | null;
}

export const REPORT_FORMATTER = Symbol('REPORT_FORMATTER');

export interface ReportFormatterPort {
  generarExcel(filas: Record<string, unknown>[], nombreHoja: string): Promise<Buffer>;
  generarCsv(filas: Record<string, unknown>[]): Promise<Buffer>;
  generarPdfTabla(filas: Record<string, unknown>[], titulo: string): Promise<Buffer>;
}
