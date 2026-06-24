import { IsEmail, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class RegistrarVentaDto {
  @IsUUID()
  eventoId!: string;

  @IsString()
  @MinLength(2)
  nombreComprador!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsInt()
  @Min(1)
  cantidadPersonas!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoTotal?: number;
}
