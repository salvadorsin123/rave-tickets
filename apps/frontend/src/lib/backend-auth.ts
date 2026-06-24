interface LoginResponseBody {
  accessToken: string;
  refreshToken: string;
  usuario: { id: string; nombre: string; email: string; rol: string };
}

function backendUrl(): string {
  return process.env.BACKEND_URL ?? 'http://localhost:3001';
}

export async function loginContraBackend(
  email: string,
  password: string,
): Promise<{ ok: true; body: LoginResponseBody } | { ok: false; status: number; mensaje: string }> {
  const response = await fetch(`${backendUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { ok: false, status: response.status, mensaje: body?.message ?? 'Credenciales invalidas' };
  }

  return { ok: true, body: await response.json() };
}

/** Pide un access token nuevo al backend usando el refresh token. Devuelve null si el refresh ya no es valido. */
export async function refrescarAccessToken(refreshToken: string): Promise<string | null> {
  const response = await fetch(`${backendUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
}
