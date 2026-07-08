import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Endpoint de salud publico (sin auth): responde 200 mientras el proceso este vivo y
 * sirviendo. Lo usa el smoke-test del deploy para confirmar que el backend arranco. Se
 * mantiene deliberadamente sin dependencias (no toca BD) para no dar falsos negativos por
 * una caida transitoria de la base durante el arranque.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
