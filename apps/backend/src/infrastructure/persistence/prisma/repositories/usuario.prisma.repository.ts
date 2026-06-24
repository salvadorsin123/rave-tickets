import { Injectable } from '@nestjs/common';
import { Rol as RolRow, Usuario as UsuarioRow } from '@prisma/client';
import { CrearUsuarioData, UsuarioRepositoryPort } from '@application/ports/repositories.port';
import { UsuarioEntity } from '@domain/entities/usuario.entity';
import { RolNombre } from '@domain/enums/rol.enum';
import { PrismaService } from '../prisma.service';

type UsuarioConRol = UsuarioRow & { rol: RolRow };

@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UsuarioEntity | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id }, include: { rol: true } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UsuarioEntity | null> {
    const row = await this.prisma.usuario.findUnique({ where: { email }, include: { rol: true } });
    return row ? this.toDomain(row) : null;
  }

  async findAllByRol(rolNombre: RolNombre): Promise<UsuarioEntity[]> {
    const rows = await this.prisma.usuario.findMany({
      where: { rol: { nombre: rolNombre } },
      include: { rol: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CrearUsuarioData): Promise<UsuarioEntity> {
    const rol = await this.prisma.rol.findUniqueOrThrow({ where: { nombre: data.rolNombre } });
    const row = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        passwordHash: data.passwordHash,
        rolId: rol.id,
      },
      include: { rol: true },
    });
    return this.toDomain(row);
  }

  async update(usuario: UsuarioEntity): Promise<UsuarioEntity> {
    const row = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nombre: usuario.nombre,
        email: usuario.email,
        passwordHash: usuario.passwordHash,
        activo: usuario.activo,
      },
      include: { rol: true },
    });
    return this.toDomain(row);
  }

  private toDomain(row: UsuarioConRol): UsuarioEntity {
    return new UsuarioEntity(
      row.id,
      row.nombre,
      row.email,
      row.passwordHash,
      row.rolId,
      row.rol.nombre as RolNombre,
      row.activo,
      row.createdAt,
      row.updatedAt,
    );
  }
}
