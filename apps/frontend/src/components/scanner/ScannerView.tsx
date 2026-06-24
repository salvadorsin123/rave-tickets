'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { apiClient, ApiError } from '@/lib/api-client';
import { ResultOverlay } from './ResultOverlay';
import { ResultadoEscaneo } from '@/types/enums';
import type { ResultadoValidacionDto } from '@/types/models';

const ELEMENTO_ID = 'rave-qr-reader';
const MS_VOLVER_VALIDO = 1500;
const MS_VOLVER_NO_VALIDO = 2800;

interface UltimoEscaneo {
  folio: string;
  resultado: ResultadoEscaneo;
}

export function ScannerView() {
  const lectorRef = useRef<Html5Qrcode | null>(null);
  const bloqueadoRef = useRef(false);
  const [resultado, setResultado] = useState<ResultadoValidacionDto | null>(null);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [ultimos, setUltimos] = useState<UltimoEscaneo[]>([]);

  useEffect(() => {
    const lector = new Html5Qrcode(ELEMENTO_ID);
    lectorRef.current = lector;

    lector
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (texto) => void onQrDetectado(texto),
        () => undefined,
      )
      .catch(() => setErrorCamara('No se pudo acceder a la cámara. Verifica los permisos del navegador.'));

    return () => {
      // html5-qrcode lanza de forma sincrona (no solo via promesa rechazada) si stop() se
      // llama cuando el escaner nunca llego a SCANNING/PAUSED (p.ej. permiso de camara
      // denegado). Eso rompia la navegacion del lado del cliente a cualquier otra pagina:
      // React desmonta este componente, este cleanup tira la excepcion sin capturar, y
      // Next.js muestra la pantalla generica "Application error". Una recarga completa no
      // lo mostraba porque el documento se descarta antes de correr este cleanup.
      const estado = lector.getState();
      if (estado === Html5QrcodeScannerState.SCANNING || estado === Html5QrcodeScannerState.PAUSED) {
        lector.stop().catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onQrDetectado(texto: string) {
    if (bloqueadoRef.current) return;
    bloqueadoRef.current = true;

    let payload: { uuid: string; token: string };
    try {
      payload = JSON.parse(texto);
    } catch {
      mostrarResultado({ resultado: ResultadoEscaneo.INVALIDO, mensaje: 'QR NO VALIDO' });
      return;
    }

    try {
      const respuesta = await apiClient.post<ResultadoValidacionDto>('escaneos/validar', payload);
      mostrarResultado(respuesta);
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'Error al validar el boleto';
      mostrarResultado({ resultado: ResultadoEscaneo.INVALIDO, mensaje });
    }
  }

  function mostrarResultado(dto: ResultadoValidacionDto) {
    setResultado(dto);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(dto.resultado === ResultadoEscaneo.VALIDO ? 150 : [100, 80, 100]);
    }

    setUltimos((prev) => [{ folio: dto.boleto?.folio ?? '—', resultado: dto.resultado }, ...prev].slice(0, 5));

    const espera = dto.resultado === ResultadoEscaneo.VALIDO ? MS_VOLVER_VALIDO : MS_VOLVER_NO_VALIDO;
    setTimeout(() => {
      setResultado(null);
      bloqueadoRef.current = false;
    }, espera);
  }

  return (
    <div className="relative flex flex-col items-center gap-4 p-4">
      <h1 className="text-sm font-medium text-base-300">Escaneando…</h1>

      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-base-700 bg-black">
        <div id={ELEMENTO_ID} className="w-full" />
      </div>

      {errorCamara && <p className="max-w-sm text-center text-sm text-neon-red">{errorCamara}</p>}

      {ultimos.length > 0 && (
        <div className="w-full max-w-sm rounded-xl border border-base-700 bg-base-900/80 p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase text-base-400">Últimos escaneos</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {ultimos.map((u, i) => (
              <li key={i} className="flex items-center gap-2 text-base-300">
                <span>{u.resultado === ResultadoEscaneo.VALIDO ? '✅' : '❌'}</span>
                <span>{u.folio}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado && <ResultOverlay resultado={resultado} />}
    </div>
  );
}
