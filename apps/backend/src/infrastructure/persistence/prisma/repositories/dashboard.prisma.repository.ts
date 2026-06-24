import { Inject, Injectable } from '@nestjs/common';
import {
  DashboardQueryPort,
  EstadisticasDashboard,
  IngresoPorEvento,
  VentasPorPeriodo,
} from '@application/ports/dashboard.port';
import { ESCANEO_REPOSITORY, EscaneoRepositoryPort } from '@application/ports/repositories.port';
import { EstadoBoleto } from '@domain/enums/estado-boleto.enum';
import { PrismaService } from '../prisma.service';

/**
 * Las agregaciones por dia/hora se calculan en memoria sobre el conjunto de
 * ventas del filtro solicitado (acotado por evento). Para volumenes muy
 * grandes esto se puede migrar a consultas agregadas nativas de Azure SQL
 * (ver plan de escalabilidad en docs/01-arquitectura.md).
 */
@Injectable()
export class DashboardPrismaRepository implements DashboardQueryPort {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ESCANEO_REPOSITORY) private readonly escaneoRepository: EscaneoRepositoryPort,
  ) {}

  async obtenerEstadisticas(eventoId?: string): Promise<EstadisticasDashboard> {
    const whereEvento = eventoId ? { eventoId } : {};

    const [ventas, boletos, eventos] = await Promise.all([
      this.prisma.venta.findMany({
        where: whereEvento,
        select: { fechaCompra: true, montoTotal: true, eventoId: true },
      }),
      this.prisma.boleto.findMany({
        where: whereEvento,
        select: { estado: true, personasCompradas: true, personasIngresadas: true },
      }),
      eventoId ? Promise.resolve([]) : this.prisma.evento.findMany({ select: { id: true, nombre: true } }),
    ]);

    const ventasTotales = ventas.length;
    const ingresosTotales = ventas.reduce((acc, v) => acc + (v.montoTotal ? Number(v.montoTotal) : 0), 0);
    const boletosVendidos = boletos.length;
    const asistentesEsperados = boletos.reduce((acc, b) => acc + b.personasCompradas, 0);
    const asistentesIngresados = boletos.reduce((acc, b) => acc + b.personasIngresadas, 0);
    const porcentajeAsistencia =
      asistentesEsperados > 0 ? Math.round((asistentesIngresados / asistentesEsperados) * 10000) / 100 : 0;
    const boletosPendientes = boletos.filter(
      (b) => b.estado === EstadoBoleto.PENDIENTE || b.estado === EstadoBoleto.PARCIALMENTE_UTILIZADO,
    ).length;
    const boletosCancelados = boletos.filter((b) => b.estado === EstadoBoleto.CANCELADO).length;
    const boletosReembolsados = boletos.filter((b) => b.estado === EstadoBoleto.REEMBOLSADO).length;

    const ingresosPorEvento = eventoId ? [] : this.calcularIngresosPorEvento(ventas, eventos);

    const topEscaneadoresRaw = await this.escaneoRepository.topEscaneadores(eventoId, 5);
    const escaneadores = await this.prisma.usuario.findMany({
      where: { id: { in: topEscaneadoresRaw.map((t) => t.escaneadorId) } },
      select: { id: true, nombre: true },
    });

    const bitacoraReciente = await this.prisma.bitacoraAuditoria.findMany({
      orderBy: { fechaHora: 'desc' },
      take: 20,
    });

    return {
      ventasTotales,
      ingresosTotales,
      boletosVendidos,
      asistentesEsperados,
      asistentesIngresados,
      porcentajeAsistencia,
      boletosPendientes,
      boletosCancelados,
      boletosReembolsados,
      ventasPorDia: this.agruparPorDia(ventas.map((v) => v.fechaCompra)),
      ventasPorHora: this.agruparPorHora(ventas.map((v) => v.fechaCompra)),
      ingresosPorEvento,
      topEscaneadores: topEscaneadoresRaw.map((t) => ({
        escaneadorId: t.escaneadorId,
        nombre: escaneadores.find((e) => e.id === t.escaneadorId)?.nombre ?? 'Desconocido',
        total: t.total,
      })),
      actividadReciente: bitacoraReciente.map((b) => ({
        descripcion: `${b.accion} (${b.entidadAfectada})`,
        fechaHora: b.fechaHora,
      })),
    };
  }

  private calcularIngresosPorEvento(
    ventas: { eventoId: string; montoTotal: unknown }[],
    eventos: { id: string; nombre: string }[],
  ): IngresoPorEvento[] {
    const montosPorEvento = new Map<string, number>();
    for (const venta of ventas) {
      const monto = venta.montoTotal ? Number(venta.montoTotal) : 0;
      montosPorEvento.set(venta.eventoId, (montosPorEvento.get(venta.eventoId) ?? 0) + monto);
    }
    return eventos
      .map((evento) => ({
        eventoId: evento.id,
        nombreEvento: evento.nombre,
        total: montosPorEvento.get(evento.id) ?? 0,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }

  private agruparPorDia(fechas: Date[]): VentasPorPeriodo[] {
    const conteos = new Map<string, number>();
    for (const fecha of fechas) {
      const clave = fecha.toISOString().slice(0, 10);
      conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
    }
    return Array.from(conteos.entries())
      .map(([etiqueta, total]) => ({ etiqueta, total }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  }

  private agruparPorHora(fechas: Date[]): VentasPorPeriodo[] {
    const conteos = new Map<number, number>();
    for (const fecha of fechas) {
      const hora = fecha.getHours();
      conteos.set(hora, (conteos.get(hora) ?? 0) + 1);
    }
    return Array.from(conteos.entries())
      .map(([hora, total]) => ({ etiqueta: `${hora.toString().padStart(2, '0')}:00`, total }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  }
}
