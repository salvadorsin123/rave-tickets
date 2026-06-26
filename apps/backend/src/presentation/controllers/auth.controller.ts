import { Body, Controller, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CambiarPasswordPropioDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
} from '@application/dtos/auth.dto';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { CambiarPasswordPropioUseCase } from '@application/use-cases/usuarios/cambiar-password-propio.use-case';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { SinAuditoriaGenerica } from '@presentation/decorators/sin-auditoria-generica.decorator';
import { TokenPayload } from '@application/ports/infrastructure.port';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly cambiarPasswordPropioUseCase: CambiarPasswordPropioUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SinAuditoriaGenerica()
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto, req.ip ?? null);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cambiarPasswordPropio(
    @CurrentUser() usuario: TokenPayload,
    @Body() dto: CambiarPasswordPropioDto,
  ): Promise<void> {
    await this.cambiarPasswordPropioUseCase.execute(usuario.sub, dto);
  }
}
