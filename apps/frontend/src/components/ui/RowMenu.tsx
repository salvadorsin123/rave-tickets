'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export interface RowMenuAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

const ANCHO_MENU = 192; // w-48

export function RowMenu({ actions }: { actions: RowMenuAction[] }) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const visibles = actions.filter((a) => !a.hidden);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const objetivo = e.target as Node;
      if (botonRef.current?.contains(objetivo)) return;
      if (menuRef.current?.contains(objetivo)) return;
      setAbierto(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // El menu se renderiza en un portal a document.body porque las tablas que lo contienen
  // usan overflow-x-auto (necesario para scroll horizontal en pantallas chicas), y eso
  // recorta cualquier dropdown posicionado de forma absoluta que se salga del contenedor.
  // position: fixed + portal escapa ese recorte; la posicion se calcula desde el boton.
  function alternar() {
    if (!abierto && botonRef.current) {
      const rect = botonRef.current.getBoundingClientRect();
      setPosicion({ top: rect.bottom + 4, left: rect.right - ANCHO_MENU });
    }
    setAbierto((v) => !v);
  }

  if (visibles.length === 0) return null;

  return (
    <>
      <button
        ref={botonRef}
        onClick={alternar}
        className="rounded-md px-2 py-1 text-base-400 hover:bg-base-800 hover:text-base-100"
        aria-label="Acciones"
      >
        ⋮
      </button>
      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: posicion.top, left: posicion.left, width: ANCHO_MENU }}
            className="fixed z-20 rounded-lg border border-base-700 bg-base-900 py-1 shadow-lg"
          >
            {visibles.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setAbierto(false);
                  action.onClick();
                }}
                className={clsx(
                  'block w-full px-3 py-2 text-left text-sm hover:bg-base-800',
                  action.danger ? 'text-rose-300' : 'text-base-200',
                )}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
