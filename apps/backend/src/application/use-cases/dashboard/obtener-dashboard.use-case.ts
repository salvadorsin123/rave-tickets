import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_QUERY,
  DashboardQueryPort,
  EstadisticasDashboard,
  FiltroEstadisticas,
} from '@application/ports/dashboard.port';

@Injectable()
export class ObtenerDashboardUseCase {
  constructor(@Inject(DASHBOARD_QUERY) private readonly dashboardQuery: DashboardQueryPort) {}

  async execute(filtro: FiltroEstadisticas): Promise<EstadisticasDashboard> {
    return this.dashboardQuery.obtenerEstadisticas(filtro);
  }
}
