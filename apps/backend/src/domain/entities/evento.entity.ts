import { EstadoEvento } from '../enums/estado-evento.enum';

export class EventoEntity {
  constructor(
    public readonly id: string,
    public nombre: string,
    public descripcion: string | null,
    public fecha: Date,
    public lugar: string | null,
    public logoUrl: string | null,
    public imagenFondoUrl: string | null,
    public estado: EstadoEvento,
    public precioBase: number | null,
    public readonly creadoPorId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  estaActivo(): boolean {
    return this.estado === EstadoEvento.ACTIVO;
  }

  cerrar(): void {
    if (this.estado === EstadoEvento.CERRADO) {
      throw new Error('El evento ya esta cerrado');
    }
    this.estado = EstadoEvento.CERRADO;
  }

  asegurarPermiteVentas(): void {
    if (!this.estaActivo()) {
      throw new Error('No se pueden registrar ventas en un evento cerrado');
    }
  }
}
