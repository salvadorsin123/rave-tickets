import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';

export class BloquearFraudeDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class ConsultarBoletosQueryDto {
  @IsOptional()
  @IsUUID()
  eventoId?: string;

  @IsOptional()
  @IsEnum(EstadoBoleto)
  estado?: EstadoBoleto;

  @IsOptional()
  @IsString()
  busqueda?: string;
}

export interface BoletoConDetalleDto {
  id: string;
  folio: string;
  estado: EstadoBoleto;
  personasCompradas: number;
  personasIngresadas: number;
  pdfUrl: string | null;
  nombreComprador: string;
  email: string | null;
  fechaCompra: Date;
  eventoId: string;
}
