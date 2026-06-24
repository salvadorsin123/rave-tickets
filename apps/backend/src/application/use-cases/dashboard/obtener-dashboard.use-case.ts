import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_QUERY,
  DashboardQueryPort,
  EstadisticasDashboard,
} from '@application/ports/dashboard.port';

@Injectable()
export class ObtenerDashboardUseCase {
  constructor(@Inject(DASHBOARD_QUERY) private readonly dashboardQuery: DashboardQueryPort) {}

  async execute(eventoId?: string): Promise<EstadisticasDashboard> {
    return this.dashboardQuery.obtenerEstadisticas(eventoId);
  }
}
