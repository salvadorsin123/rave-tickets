import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class CambiarPasswordPropioDto {
  @IsString()
  @IsNotEmpty()
  passwordActual!: string;

  @IsString()
  @MinLength(8)
  passwordNueva!: string;
}

export interface UsuarioAutenticadoDto {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioAutenticadoDto;
}
