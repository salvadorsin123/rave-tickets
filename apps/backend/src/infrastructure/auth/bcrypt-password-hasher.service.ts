import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '@application/ports/infrastructure.port';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherPort {
  async hash(valorPlano: string): Promise<string> {
    return bcrypt.hash(valorPlano, SALT_ROUNDS);
  }

  async comparar(valorPlano: string, hash: string): Promise<boolean> {
    return bcrypt.compare(valorPlano, hash);
  }
}
