'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export function Modal({ open, onClose, title, children, footer, widthClassName = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`flex max-h-[90vh] w-full ${widthClassName} flex-col rounded-xl border border-base-700 bg-base-900 shadow-neon`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-base-700 px-5 py-4">
          <h2 className="text-base font-semibold text-base-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-base-400 hover:bg-base-800 hover:text-base-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-base-700 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
