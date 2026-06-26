import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RolNombre } from '@domain/enums/rol.enum';

export class CrearEscaneadorDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CrearAdminDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class EditarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CambiarRolDto {
  @IsEnum(RolNombre)
  rol!: RolNombre;
}

export interface RestablecerPasswordResponseDto {
  passwordTemporal: string;
}
