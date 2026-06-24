import { Module } from '@nestjs/common';
import { UsuariosController } from '@presentation/controllers/usuarios.controller';
import { AdministradoresController } from '@presentation/controllers/administradores.controller';
import { CrearEscaneadorUseCase } from '@application/use-cases/usuarios/crear-escaneador.use-case';
import { CrearAdminUseCase } from '@application/use-cases/usuarios/crear-admin.use-case';
import { EditarUsuarioUseCase } from '@application/use-cases/usuarios/editar-usuario.use-case';
import { DesactivarUsuarioUseCase } from '@application/use-cases/usuarios/desactivar-usuario.use-case';
import { RestablecerPasswordUseCase } from '@application/use-cases/usuarios/restablecer-password.use-case';
import { ListarEscaneadoresUseCase } from '@application/use-cases/usuarios/listar-escaneadores.use-case';
import { ListarAdministradoresUseCase } from '@application/use-cases/usuarios/listar-administradores.use-case';
import { ConsultarActividadEscaneadorUseCase } from '@application/use-cases/usuarios/consultar-actividad-escaneador.use-case';

@Module({
  controllers: [UsuariosController, AdministradoresController],
  providers: [
    CrearEscaneadorUseCase,
    CrearAdminUseCase,
    EditarUsuarioUseCase,
    DesactivarUsuarioUseCase,
    RestablecerPasswordUseCase,
    ListarEscaneadoresUseCase,
    ListarAdministradoresUseCase,
    ConsultarActividadEscaneadorUseCase,
  ],
})
export class UsuariosModule {}
