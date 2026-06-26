import { SetMetadata } from '@nestjs/common';

export const SIN_AUDITORIA_GENERICA_KEY = 'sinAuditoriaGenerica';
export const SinAuditoriaGenerica = () => SetMetadata(SIN_AUDITORIA_GENERICA_KEY, true);
