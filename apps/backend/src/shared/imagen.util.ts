import { BadRequestException } from '@nestjs/common';

/**
 * Firmas (magic bytes) de los unicos formatos que pdfkit puede embeber en el PDF del
 * boleto. Solo JPG y PNG; ver los use-cases de subida de logo/fondo.
 */
const FIRMAS: { mimetype: string; extension: string; magic: number[] }[] = [
  { mimetype: 'image/jpeg', extension: 'jpg', magic: [0xff, 0xd8, 0xff] },
  { mimetype: 'image/png', extension: 'png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

function empiezaCon(buffer: Buffer, magic: number[]): boolean {
  if (buffer.length < magic.length) {
    return false;
  }
  return magic.every((byte, indice) => buffer[indice] === byte);
}

/**
 * Valida que el contenido real del archivo sea JPG o PNG (por magic bytes) y que coincida
 * con el mimetype declarado por el cliente. No basta con confiar en el Content-Type: es
 * falsificable, y sin esta verificacion se almacenaria contenido arbitrario disfrazado de
 * imagen. Devuelve la extension canonica.
 */
export function validarImagenJpgPng(buffer: Buffer, mimetype: string): string {
  const firma = FIRMAS.find((f) => f.mimetype === mimetype);
  if (!firma || !empiezaCon(buffer, firma.magic)) {
    throw new BadRequestException('El archivo debe ser una imagen JPG o PNG valida');
  }
  return firma.extension;
}
