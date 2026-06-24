'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

export function CambiarPasswordForm() {
  const { mostrar } = useToast();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setPasswordActual('');
    setPasswordNueva('');
    setConfirmacion('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (passwordNueva !== confirmacion) {
      setError('La nueva contraseña y la confirmacion no coinciden');
      return;
    }

    setGuardando(true);
    try {
      await apiClient.patch('auth/password', { passwordActual, passwordNueva });
      mostrar('Contraseña actualizada', 'success');
      limpiar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la contraseña');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-4">
      <Input
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        required
        value={passwordActual}
        onChange={(e) => setPasswordActual(e.target.value)}
      />
      <Input
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={passwordNueva}
        onChange={(e) => setPasswordNueva(e.target.value)}
        hint="Minimo 8 caracteres."
      />
      <Input
        label="Confirmar contraseña nueva"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={confirmacion}
        onChange={(e) => setConfirmacion(e.target.value)}
      />
      {error && <p className="text-sm text-neon-red">{error}</p>}
      <div className="mt-2">
        <Button type="submit" loading={guardando}>
          Actualizar contraseña
        </Button>
      </div>
    </form>
  );
}
