'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { inputDatetimeMxAUtc, utcAInputDatetimeMx } from '@/lib/fecha-mexico';
import type { EventoEntity } from '@/types/models';

function CampoImagen({
  label,
  ayuda,
  previewSrc,
  onSeleccionar,
  inputRef,
}: {
  label: string;
  ayuda: string;
  previewSrc: string | null;
  onSeleccionar: (e: ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-base-200">{label}</label>
      <div className="flex items-center gap-3">
        {previewSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={label}
            className="h-12 w-12 rounded-md border border-base-600 bg-base-850 object-contain"
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={onSeleccionar}
          className="block w-full text-sm text-base-300 file:mr-3 file:rounded-md file:border-0 file:bg-base-700 file:px-3 file:py-1.5 file:text-sm file:text-base-100 hover:file:bg-base-600"
        />
      </div>
      <span className="text-xs text-base-400">{ayuda}</span>
    </div>
  );
}

export function EventoFormModal({
  open,
  onClose,
  onGuardado,
  evento,
}: {
  open: boolean;
  onClose: () => void;
  onGuardado: () => void;
  evento?: EventoEntity;
}) {
  const { mostrar } = useToast();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [precioBase, setPrecioBase] = useState('');
  const [logoUrlActual, setLogoUrlActual] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fondoUrlActual, setFondoUrlActual] = useState<string | null>(null);
  const [fondoFile, setFondoFile] = useState<File | null>(null);
  const [fondoPreview, setFondoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const inputLogoRef = useRef<HTMLInputElement>(null);
  const inputFondoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNombre(evento?.nombre ?? '');
    setDescripcion(evento?.descripcion ?? '');
    setFecha(evento ? utcAInputDatetimeMx(evento.fecha) : '');
    setLugar(evento?.lugar ?? '');
    setPrecioBase(evento?.precioBase != null ? String(evento.precioBase) : '');
    setLogoUrlActual(evento?.logoUrl ?? null);
    setLogoFile(null);
    setLogoPreview(null);
    setFondoUrlActual(evento?.imagenFondoUrl ?? null);
    setFondoFile(null);
    setFondoPreview(null);
    if (inputLogoRef.current) inputLogoRef.current.value = '';
    if (inputFondoRef.current) inputFondoRef.current.value = '';
  }, [open, evento]);

  function onSeleccionarLogo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      mostrar('El logo debe ser una imagen JPG o PNG', 'error');
      e.target.value = '';
      return;
    }
    setLogoFile(archivo);
    setLogoPreview(URL.createObjectURL(archivo));
  }

  function onSeleccionarFondo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      mostrar('La imagen de fondo debe ser JPG o PNG', 'error');
      e.target.value = '';
      return;
    }
    setFondoFile(archivo);
    setFondoPreview(URL.createObjectURL(archivo));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);

    try {
      let logoUrl = logoUrlActual ?? undefined;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const subido = await apiClient.uploadFile<{ logoUrl: string }>('eventos/logo', formData);
        logoUrl = subido.logoUrl;
      }

      let imagenFondoUrl = fondoUrlActual ?? undefined;
      if (fondoFile) {
        const formData = new FormData();
        formData.append('file', fondoFile);
        const subido = await apiClient.uploadFile<{ imagenFondoUrl: string }>('eventos/fondo', formData);
        imagenFondoUrl = subido.imagenFondoUrl;
      }

      const payload = {
        nombre,
        descripcion: descripcion || undefined,
        fecha: inputDatetimeMxAUtc(fecha),
        lugar: lugar || undefined,
        logoUrl,
        imagenFondoUrl,
        precioBase: precioBase ? Number(precioBase) : undefined,
      };

      if (evento) {
        await apiClient.patch(`eventos/${evento.id}`, payload);
        mostrar('Evento actualizado', 'success');
      } else {
        await apiClient.post('eventos', payload);
        mostrar('Evento creado', 'success');
      }
      onGuardado();
      onClose();
    } catch (error) {
      mostrar(error instanceof ApiError ? error.message : 'No se pudo guardar el evento', 'error');
    } finally {
      setGuardando(false);
    }
  }

  const logoPreviewSrc = logoPreview ?? (evento && logoUrlActual ? `/api/proxy/eventos/${evento.id}/logo` : null);
  const fondoPreviewSrc =
    fondoPreview ?? (evento && fondoUrlActual ? `/api/proxy/eventos/${evento.id}/fondo` : null);

  return (
    <Modal open={open} onClose={onClose} title={evento ? 'Editar evento' : 'Nuevo evento'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nombre del evento" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Textarea label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <Input
          label="Fecha y hora"
          type="datetime-local"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <Input label="Lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} />

        <CampoImagen
          label="Logo del evento"
          ayuda="Solo imagenes JPG o PNG. Se muestra pequeño en la parte superior del boleto."
          previewSrc={logoPreviewSrc}
          onSeleccionar={onSeleccionarLogo}
          inputRef={inputLogoRef}
        />

        <CampoImagen
          label="Imagen de fondo del boleto"
          ayuda="Solo imagenes JPG o PNG. Se muestra de fondo en todo el boleto, opacada, y se ajusta automaticamente al tamaño del PDF."
          previewSrc={fondoPreviewSrc}
          onSeleccionar={onSeleccionarFondo}
          inputRef={inputFondoRef}
        />

        <Input
          label="Precio base"
          type="number"
          min={0}
          step="0.01"
          value={precioBase}
          onChange={(e) => setPrecioBase(e.target.value)}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
