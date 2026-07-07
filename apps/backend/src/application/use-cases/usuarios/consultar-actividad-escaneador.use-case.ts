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
    // Solo escaneadores: este endpoint cuelga de la ruta de escaneadores (accesible a
    // cualquier admin). Sin este filtro, un admin podria enumerar la actividad de otro
    // admin o super_admin pasando su id.
    if (!usuario || !usuario.esEscaneador()) {
      throw new NotFoundException('Escaneador no encontrado');
    }

    return this.escaneoRepository.findAll({ escaneadorId });
  }
}
