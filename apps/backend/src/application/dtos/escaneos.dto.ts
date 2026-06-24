import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ResultadoEscaneo } from '@domain/enums/resultado-escaneo.enum';

export class ValidarEntradaDto {
  @IsUUID()
  uuid!: string;

  @IsString()
  token!: string;

  /** Si se omite, se registra el ingreso de todo el cupo disponible del boleto. */
  @IsOptional()
  @IsInt()
  @Min(1)
  personasIngresan?: number;
}

export interface ResultadoValidacionDto {
  resultado: ResultadoEscaneo;
  mensaje: string;
  boleto?: {
    folio: string;
    nombreComprador: string;
    personasCompradas: number;
    personasIngresadas: number;
    fechaCompra: Date;
  };
  primerIngreso?: {
    fechaHora: Date;
    escaneadorNombre: string;
  };
}
