import { Inject, Injectable } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  BitacoraRepositoryPort,
  FiltroBitacora,
} from '@application/ports/repositories.port';
import { BitacoraAuditoriaEntity } from '@domain/entities/bitacora-auditoria.entity';

@Injectable()
export class ConsultarBitacoraUseCase {
  constructor(@Inject(BITACORA_REPOSITORY) private readonly bitacoraRepository: BitacoraRepositoryPort) {}

  async execute(filtro: FiltroBitacora): Promise<BitacoraAuditoriaEntity[]> {
    return this.bitacoraRepository.findAll(filtro);
  }
}
