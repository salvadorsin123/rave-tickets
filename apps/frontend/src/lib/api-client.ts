import type { ApiErrorBody } from '@/types/models';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function aQueryString(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params.set(clave, String(valor));
    }
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

async function solicitar<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData: no fijar Content-Type. El navegador genera uno con el boundary del multipart;
  // si lo pisamos con 'application/json' el backend no puede parsear el archivo adjunto.
  const esFormData = init?.body instanceof FormData;
  const response = await fetch(`/api/proxy/${path}`, {
    ...init,
    headers: esFormData ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : undefined;

  if (!response.ok) {
    const mensaje = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(mensaje ?? 'Ocurrio un error inesperado', response.status, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string, query?: Query) => solicitar<T>(`${path}${aQueryString(query)}`),

  post: <T>(path: string, data?: unknown) =>
    solicitar<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),

  patch: <T>(path: string, data?: unknown) =>
    solicitar<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),

  delete: <T>(path: string) => solicitar<T>(path, { method: 'DELETE' }),

  /** Sube un archivo (multipart/form-data). No fijar Content-Type: el navegador agrega el boundary. */
  uploadFile: <T>(path: string, formData: FormData) => solicitar<T>(path, { method: 'POST', body: formData }),

  /** Descarga un binario (PDF/Excel/CSV) y dispara la descarga en el navegador. */
  async download(path: string, query: Query | undefined, nombreSugerido: string): Promise<void> {
    const response = await fetch(`/api/proxy/${path}${aQueryString(query)}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new ApiError('No se pudo descargar el archivo', response.status);
    }

    const disposition = response.headers.get('content-disposition');
    const nombreDesdeHeader = disposition?.match(/filename="?([^"]+)"?/)?.[1];
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreDesdeHeader ?? nombreSugerido;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  },
};
