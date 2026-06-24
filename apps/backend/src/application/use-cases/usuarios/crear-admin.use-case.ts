import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { PASSWORD_HASHER, PasswordHasherPort } from '@application/ports/infrastructure.port';
import { CrearAdminDto } from '@application/dtos/usuarios.dto';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';

@Injectable()
export class CrearAdminUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(dto: CrearAdminDto): Promise<UsuarioEntity> {
    const existente = await this.usuarioRepository.findByEmail(dto.email);
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    return this.usuarioRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
      rolNombre: RolNombre.ADMIN,
    });
  }
}
