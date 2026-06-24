import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ESCANEO_REPOSITORY,
  EscaneoRepositoryPort,
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '@application/ports/repositories.port';
import { EscaneoEntity } from '@domain/entities/escaneo.entity';

@Injectable()
export class ConsultarActividadEscaneadorUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort,
  ) {}

  async execute(escaneadorId: string): Promise<EscaneoEntity[]> {
    const usuario = await this.usuarioRepository.findById(escaneadorId);
    if (!usuario) {
      throw new NotFoundException('Escaneador no encontrado');
    }

    return this.escaneoRepository.findAll({ escaneadorId });
  }
}
