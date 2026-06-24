import { ResultadoEscaneo } from '../enums/resultado-escaneo.enum';

export class EscaneoEntity {
  constructor(
    public readonly id: string,
    public readonly boletoId: string,
    public readonly escaneadorId: string,
    public readonly personasIngresadasEnEsteEscaneo: number,
    public readonly resultado: ResultadoEscaneo,
    public readonly fechaHora: Date,
    public readonly ipAddress: string | null,
    public readonly deviceInfo: string | null,
  ) {}
}
