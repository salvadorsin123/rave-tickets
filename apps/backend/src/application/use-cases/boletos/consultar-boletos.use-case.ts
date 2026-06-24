import { Inject, Injectable } from '@nestjs/common';
import { BOLETO_REPOSITORY, BoletoRepositoryPort, FiltroBoletos } from '@application/ports/repositories.port';
import { BoletoEntity } from '@domain/entities/boleto.entity';

@Injectable()
export class ConsultarBoletosUseCase {
  constructor(@Inject(BOLETO_REPOSITORY) private readonly boletoRepository: BoletoRepositoryPort) {}

  async execute(filtro: FiltroBoletos): Promise<BoletoEntity[]> {
    return this.boletoRepository.findAll(filtro);
  }
}
