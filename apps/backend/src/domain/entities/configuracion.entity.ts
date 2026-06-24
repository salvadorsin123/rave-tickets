export class ConfiguracionEntity {
  constructor(
    public readonly id: string,
    public readonly eventoId: string | null,
    public clave: string,
    public valor: string | null,
  ) {}
}
