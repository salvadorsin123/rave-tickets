import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto);
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
