export class VentaEntity {
  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly nombreComprador: string,
    public readonly email: string | null,
    public readonly cantidadPersonas: number,
    public readonly montoTotal: number | null,
    public readonly registradoPorId: string,
    public readonly fechaCompra: Date,
  ) {}
}
