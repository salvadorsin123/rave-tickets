'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { EventoEntity } from '@/types/models';

interface EventoContextValue {
  eventos: EventoEntity[];
  cargando: boolean;
  eventoId: string | null;
  setEventoId: (id: string | null) => void;
  recargarEventos: () => void;
}

const STORAGE_KEY = 'rave_evento_seleccionado';

const EventoContext = createContext<EventoContextValue | null>(null);

export function EventoProvider({ children }: { children: React.ReactNode }) {
  const [eventos, setEventos] = useState<EventoEntity[]>([]);
  const [cargando, setCargando] = useState(true);
  const [eventoId, setEventoIdState] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setCargando(true);
    apiClient
      .get<EventoEntity[]>('eventos')
      .then((data) => {
        setEventos(data);
        const guardado = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (guardado && data.some((e) => e.id === guardado)) {
          setEventoIdState(guardado);
        } else if (data.length > 0) {
          setEventoIdState(data[0].id);
        }
      })
      .finally(() => setCargando(false));
  }, [version]);

  function setEventoId(id: string | null) {
    setEventoIdState(id);
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <EventoContext.Provider
      value={{ eventos, cargando, eventoId, setEventoId, recargarEventos: () => setVersion((v) => v + 1) }}
    >
      {children}
    </EventoContext.Provider>
  );
}

export function useEventoContext(): EventoContextValue {
  const ctx = useContext(EventoContext);
  if (!ctx) throw new Error('useEventoContext debe usarse dentro de EventoProvider');
  return ctx;
}
