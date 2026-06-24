import { Body, Controller, Get, Param, Patch, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BloquearFraudeDto, ConsultarBoletosQueryDto } from '@application/dtos/boletos.dto';
import { ConsultarBoletosUseCase } from '@application/use-cases/boletos/consultar-boletos.use-case';
import { CancelarBoletoUseCase } from '@application/use-cases/boletos/cancelar-boleto.use-case';
import { ReembolsarBoletoUseCase } from '@application/use-cases/boletos/reembolsar-boleto.use-case';
import { BloquearFraudeBoletoUseCase } from '@application/use-cases/boletos/bloquear-fraude-boleto.use-case';
import { ObtenerPdfBoletoUseCase } from '@application/use-cases/boletos/obtener-pdf-boleto.use-case';
import { BoletoEntity } from '@domain/entities/boleto.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { TokenPayload } from '@application/ports/infrastructure.port';

interface BoletoResponse {
  id: string;
  folio: string;
  ventaId: string;
  eventoId: string;
  personasCompradas: number;
  personasIngresadas: number;
  estado: string;
  pdfUrl: string | null;
}

function aBoletoResponse(boleto: BoletoEntity): BoletoResponse {
  return {
    id: boleto.id,
    folio: boleto.folio,
    ventaId: boleto.ventaId,
    eventoId: boleto.eventoId,
    personasCompradas: boleto.personasCompradas,
    personasIngresadas: boleto.personasIngresadas,
    estado: boleto.estado,
    pdfUrl: boleto.pdfUrl,
  };
}

@ApiTags('boletos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolNombre.ADMIN)
@Controller('boletos')
export class BoletosController {
  constructor(
    private readonly consultarBoletosUseCase: ConsultarBoletosUseCase,
    private readonly cancelarBoletoUseCase: CancelarBoletoUseCase,
    private readonly reembolsarBoletoUseCase: ReembolsarBoletoUseCase,
    private readonly bloquearFraudeBoletoUseCase: BloquearFraudeBoletoUseCase,
    private readonly obtenerPdfBoletoUseCase: ObtenerPdfBoletoUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ConsultarBoletosQueryDto): Promise<BoletoResponse[]> {
    const boletos = await this.consultarBoletosUseCase.execute(query);
    return boletos.map(aBoletoResponse);
  }

  @Get(':id/pdf')
  async descargarPdf(@Param('id') id: string): Promise<StreamableFile> {
    const { contenido, nombreArchivo } = await this.obtenerPdfBoletoUseCase.execute(id);
    return new StreamableFile(contenido, {
      type: 'application/pdf',
      disposition: `attachment; filename="${nombreArchivo}"`,
    });
  }

  @Patch(':id/cancelar')
  async cancelar(@Param('id') id: string, @CurrentUser() usuario: TokenPayload): Promise<BoletoResponse> {
    const boleto = await this.cancelarBoletoUseCase.execute(id, usuario.sub);
    return aBoletoResponse(boleto);
  }

  @Patch(':id/reembolsar')
  async reembolsar(@Param('id') id: string, @CurrentUser() usuario: TokenPayload): Promise<BoletoResponse> {
    const boleto = await this.reembolsarBoletoUseCase.execute(id, usuario.sub);
    return aBoletoResponse(boleto);
  }

  @Patch(':id/bloquear-fraude')
  async bloquearFraude(
    @Param('id') id: string,
    @Body() dto: BloquearFraudeDto,
    @CurrentUser() usuario: TokenPayload,
  ): Promise<BoletoResponse> {
    const boleto = await this.bloquearFraudeBoletoUseCase.execute(id, usuario.sub, dto.motivo ?? null);
    return aBoletoResponse(boleto);
  }
}
