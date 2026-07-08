import { BadRequestException } from '@nestjs/common';
import { validarImagenJpgPng } from './imagen.util';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe('validarImagenJpgPng', () => {
  it('reconoce un PNG valido', () => {
    expect(validarImagenJpgPng(PNG, 'image/png')).toBe('png');
  });

  it('reconoce un JPEG valido', () => {
    expect(validarImagenJpgPng(JPEG, 'image/jpeg')).toBe('jpg');
  });

  it('rechaza cuando el mimetype no coincide con los bytes reales', () => {
    expect(() => validarImagenJpgPng(PNG, 'image/jpeg')).toThrow(BadRequestException);
  });

  it('rechaza un mimetype no soportado aunque los bytes sean imagen', () => {
    expect(() => validarImagenJpgPng(PNG, 'image/webp')).toThrow(BadRequestException);
  });

  it('rechaza contenido arbitrario disfrazado con mimetype de imagen', () => {
    const texto = Buffer.from('esto no es una imagen');
    expect(() => validarImagenJpgPng(texto, 'image/png')).toThrow(BadRequestException);
  });

  it('rechaza un buffer mas corto que la firma', () => {
    expect(() => validarImagenJpgPng(Buffer.from([0x89, 0x50]), 'image/png')).toThrow(BadRequestException);
  });
});
