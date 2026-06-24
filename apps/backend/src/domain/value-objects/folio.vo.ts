export class Folio {
  private constructor(public readonly valor: string) {}

  static generar(prefijo: string, anio: number, secuencia: number): Folio {
    const secuenciaFormateada = secuencia.toString().padStart(3, '0');
    return new Folio(`${prefijo}${anio}-${secuenciaFormateada}`);
  }

  toString(): string {
    return this.valor;
  }
}
