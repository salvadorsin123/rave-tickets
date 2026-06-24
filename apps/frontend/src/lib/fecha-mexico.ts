// Mexico abolio el horario de verano en 2022 (decreto DOF); la Zona Centro (CDMX y la
// mayoria del pais, donde opera este sistema) quedo fija en UTC-6 todo el ano. Por eso
// las fechas que el usuario escribe se pueden anclar a un offset fijo, y las que se
// muestran se formatean con Intl/timeZone en vez de depender de la zona del navegador
// o del servidor (que pueden no coincidir entre si ni con la hora real del evento).
export const ZONA_HORARIA_MX = 'America/Mexico_City';
const OFFSET_FIJO_MX = '-06:00';

/** Convierte el valor de un <input type="datetime-local"> (hora de pared en CDMX) a ISO UTC. */
export function inputDatetimeMxAUtc(valor: string): string {
  return new Date(`${valor}:00${OFFSET_FIJO_MX}`).toISOString();
}

/** Convierte una fecha ISO UTC al valor de un <input type="datetime-local"> en hora de CDMX. */
export function utcAInputDatetimeMx(fechaIso: string): string {
  const partes = partesEnZonaMx(fechaIso, { hour: '2-digit', minute: '2-digit' });
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}

/** Convierte el valor de un <input type="date"> (dia en CDMX) a ISO UTC, inicio o fin de ese dia. */
export function inputDateMxAUtc(valor: string, finDelDia = false): string {
  const hora = finDelDia ? '23:59:59.999' : '00:00:00.000';
  return new Date(`${valor}T${hora}${OFFSET_FIJO_MX}`).toISOString();
}

function partesEnZonaMx(fechaIso: string, extra: Intl.DateTimeFormatOptions): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_MX,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
    ...extra,
  });
  return formatter.formatToParts(new Date(fechaIso)).reduce(
    (acc, parte) => ({ ...acc, [parte.type]: parte.value }),
    {} as Record<string, string>,
  );
}
