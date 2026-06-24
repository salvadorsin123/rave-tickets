import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum TipoReporte {
  VENTAS = 'ventas',
  BOLETOS = 'boletos',
  ESCANEOS = 'escaneos',
}

export enum FormatoReporte {
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf',
}

export class ExportarReporteQueryDto {
  @IsEnum(TipoReporte)
  tipo!: TipoReporte;

  @IsEnum(FormatoReporte)
  formato!: FormatoReporte;

  @IsOptional()
  @IsUUID()
  eventoId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  desde?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hasta?: Date;
}

export interface ArchivoReporte {
  nombreArchivo: string;
  contentType: string;
  contenido: Buffer;
}
