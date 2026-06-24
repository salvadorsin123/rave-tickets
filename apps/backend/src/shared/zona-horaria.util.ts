// Mexico abolio el horario de verano en 2022 (decreto DOF); la Zona Centro (CDMX y la
// mayoria del pais, donde opera este sistema) quedo fija en UTC-6 todo el ano. Por eso
// se puede formatear con Intl/timeZone sin preocuparse de DST, en vez de depender de la
// zona horaria del contenedor donde corre el backend (que normalmente es UTC).
export const ZONA_HORARIA_MX = 'America/Mexico_City';

/** Año calendario en hora de Ciudad de Mexico (no necesariamente el año UTC del servidor). */
export function anioEnZonaMx(fecha: Date): number {
  const valor = new Intl.DateTimeFormat('en-US', { timeZone: ZONA_HORARIA_MX, year: 'numeric' }).format(
    fecha,
  );
  return Number(valor);
}
