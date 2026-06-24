import { ESTADOS_TERMINALES, EstadoBoleto } from '../enums/estado-boleto.enum';

export class BoletoEntity {
  constructor(
    public readonly id: string,
    public readonly folio: string,
    public readonly ventaId: string,
    public readonly eventoId: string,
    public readonly tokenValidacionHash: string,
    public readonly personasCompradas: number,
    public personasIngresadas: number,
    public estado: EstadoBoleto,
    public pdfUrl: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  get cupoDisponible(): number {
    return this.personasCompradas - this.personasIngresadas;
  }

  puedeRegistrarIngreso(): boolean {
    return !ESTADOS_TERMINALES.has(this.estado) && this.cupoDisponible > 0;
  }

  registrarIngreso(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error('La cantidad de personas a ingresar debe ser mayor a 0');
    }
    if (!this.puedeRegistrarIngreso()) {
      throw new Error('El boleto no admite mas ingresos en su estado actual');
    }
    if (cantidad > this.cupoDisponible) {
      throw new Error('La cantidad excede el cupo disponible del boleto');
    }
    this.personasIngresadas += cantidad;
    this.estado =
      this.personasIngresadas === this.personasCompradas
        ? EstadoBoleto.UTILIZADO
        : EstadoBoleto.PARCIALMENTE_UTILIZADO;
    this.updatedAt = new Date();
  }

  puedeRegistrarSalida(): boolean {
    return !ESTADOS_TERMINALES.has(this.estado) && this.personasIngresadas > 0;
  }

  registrarSalida(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error('La cantidad de personas a salir debe ser mayor a 0');
    }
    if (!this.puedeRegistrarSalida()) {
      throw new Error('El boleto no admite salidas en su estado actual');
    }
    if (cantidad > this.personasIngresadas) {
      throw new Error('No puede salir mas gente de la que esta registrada como dentro del boleto');
    }
    this.personasIngresadas -= cantidad;
    this.estado =
      this.personasIngresadas === 0 ? EstadoBoleto.PENDIENTE : EstadoBoleto.PARCIALMENTE_UTILIZADO;
    this.updatedAt = new Date();
  }

  cancelar(): void {
    this.asegurarNoTerminal();
    this.estado = EstadoBoleto.CANCELADO;
    this.updatedAt = new Date();
  }

  reembolsar(): void {
    this.asegurarNoTerminal();
    this.estado = EstadoBoleto.REEMBOLSADO;
    this.updatedAt = new Date();
  }

  bloquearPorFraude(): void {
    this.estado = EstadoBoleto.BLOQUEADO_POR_FRAUDE;
    this.updatedAt = new Date();
  }

  asignarPdfUrl(pdfUrl: string): void {
    this.pdfUrl = pdfUrl;
    this.updatedAt = new Date();
  }

  private asegurarNoTerminal(): void {
    if (ESTADOS_TERMINALES.has(this.estado)) {
      throw new Error(`No se puede modificar un boleto en estado ${this.estado}`);
    }
  }
}
