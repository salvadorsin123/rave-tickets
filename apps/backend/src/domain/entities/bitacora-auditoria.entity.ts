export class BitacoraAuditoriaEntity {
  constructor(
    public readonly id: string,
    public readonly usuarioId: string | null,
    public readonly accion: string,
    public readonly entidadAfectada: string,
    public readonly entidadId: string | null,
    public readonly detalles: string | null,
    public readonly fechaHora: Date,
    public readonly ipAddress: string | null,
  ) {}
}
