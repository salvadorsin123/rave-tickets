import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { ConsultarBitacoraUseCase } from '@application/use-cases/auditoria/consultar-bitacora.use-case';
import { BitacoraAuditoriaEntity } from '@domain/entities/bitacora-auditoria.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';

class ConsultarBitacoraQueryDto {
  @IsOptional()
  @IsString()
  entidadAfectada?: string;

  @IsOptional()
  @IsUUID()
  entidadId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  desde?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hasta?: Date;
}

@ApiTags('auditoria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly consultarBitacoraUseCase: ConsultarBitacoraUseCase) {}

  @Get()
  async listar(@Query() query: ConsultarBitacoraQueryDto): Promise<BitacoraAuditoriaEntity[]> {
    return this.consultarBitacoraUseCase.execute(query);
  }
}
