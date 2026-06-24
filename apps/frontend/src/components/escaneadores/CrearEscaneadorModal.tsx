'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

export function CrearEscaneadorModal({
  open,
  onClose,
  onCreado,
}: {
  open: boolean;
  onClose: () => void;
  onCreado: () => void;
}) {
  const { mostrar } = useToast();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setNombre('');
    setEmail('');
    setPassword('');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await apiClient.post('usuarios/escaneadores', { nombre, email, password });
      mostrar('Escaneador creado', 'success');
      limpiar();
      onCreado();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el escaneador');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        limpiar();
        onClose();
      }}
      title="Nuevo escaneador"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Contraseña inicial"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Minimo 8 caracteres. El escaneador puede cambiarla despues."
        />
        {error && <p className="text-sm text-neon-red">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
}
