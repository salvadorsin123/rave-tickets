import { Module } from '@nestjs/common';
import { AuthController } from '@presentation/controllers/auth.controller';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { CambiarPasswordPropioUseCase } from '@application/use-cases/usuarios/cambiar-password-propio.use-case';

@Module({
  controllers: [AuthController],
  providers: [LoginUseCase, RefreshTokenUseCase, CambiarPasswordPropioUseCase],
})
export class AuthModule {}
