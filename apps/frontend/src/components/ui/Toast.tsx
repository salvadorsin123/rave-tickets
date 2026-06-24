'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import clsx from 'clsx';

type ToastTipo = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

interface ToastContextValue {
  mostrar: (mensaje: string, tipo?: ToastTipo) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TIPO_CLASSES: Record<ToastTipo, string> = {
  success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-950/90 text-rose-200',
  info: 'border-violet-500/40 bg-violet-950/90 text-violet-200',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: ToastTipo = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tipo, mensaje }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={clsx('rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur', TIPO_CLASSES[item.tipo])}
          >
            {item.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
