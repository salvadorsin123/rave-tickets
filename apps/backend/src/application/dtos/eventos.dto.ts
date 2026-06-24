import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CrearEventoDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Date)
  @IsDate()
  fecha!: Date;

  @IsOptional()
  @IsString()
  lugar?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  imagenFondoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioBase?: number;
}

export class EditarEventoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha?: Date;

  @IsOptional()
  @IsString()
  lugar?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  imagenFondoUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioBase?: number;
}

export class DuplicarConfiguracionDto {
  @IsUUID()
  eventoDestinoId!: string;
}
