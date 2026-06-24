import { cookies } from 'next/headers';
import { USER_COOKIE } from '@/lib/auth-cookies';
import type { UsuarioAutenticado } from '@/types/models';

export function getUsuarioActual(): UsuarioAutenticado | null {
  const valor = cookies().get(USER_COOKIE)?.value;
  if (!valor) return null;
  try {
    return JSON.parse(valor) as UsuarioAutenticado;
  } catch {
    return null;
  }
}
