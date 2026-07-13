import Link from 'next/link';

export default function LegalIndexPage() {
  return (
    <div className="space-y-6 text-base-100">
      <div>
        <h2 className="mb-4 text-xl font-bold text-neon-violet">Bienvenido a la sección legal</h2>
        <p className="text-base-300">
          En esta sección encontrarás toda la información legal sobre el uso de nuestros servicios de venta de boletos
          para eventos. Te recomendamos leer cuidadosamente cada documento antes de realizar una compra.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-base-700 bg-base-800/50 p-4">
          <h3 className="mb-2 font-semibold text-neon-violet">Términos y Condiciones</h3>
          <p className="mb-3 text-sm text-base-300">
            Establece los derechos y obligaciones al comprar boletos a través de nuestra plataforma, incluyendo
            políticas de cancelación, reembolsos y restricciones de edad.
          </p>
          <Link href="/legal/terminos" className="text-neon-cyan transition-colors hover:text-neon-violet">
            Leer documento completo →
          </Link>
        </div>

        <div className="rounded-lg border border-base-700 bg-base-800/50 p-4">
          <h3 className="mb-2 font-semibold text-neon-violet">Aviso de Privacidad</h3>
          <p className="mb-3 text-sm text-base-300">
            Explica qué datos recabamos, para qué los utilizamos, cómo los protegemos, y tus derechos para acceder,
            rectificar, cancelar u oponerlos.
          </p>
          <Link href="/legal/privacidad" className="text-neon-cyan transition-colors hover:text-neon-violet">
            Leer documento completo →
          </Link>
        </div>

        <div className="rounded-lg border border-base-700 bg-base-800/50 p-4">
          <h3 className="mb-2 font-semibold text-neon-violet">Política de Seguridad</h3>
          <p className="mb-3 text-sm text-base-300">
            Detalla las medidas de seguridad que implementamos para proteger tu información personal y garantizar que
            el procesamiento de pagos es seguro.
          </p>
          <Link href="/legal/seguridad" className="text-neon-cyan transition-colors hover:text-neon-violet">
            Leer documento completo →
          </Link>
        </div>

        <div className="rounded-lg border border-base-700 bg-base-800/50 p-4">
          <h3 className="mb-2 font-semibold text-neon-violet">Política de Cookies</h3>
          <p className="mb-3 text-sm text-base-300">
            Informa sobre el uso de cookies en nuestro sitio, qué tipos utilizamos, y cómo puedes controlarlas desde
            tu navegador.
          </p>
          <Link href="/legal/cookies" className="text-neon-cyan transition-colors hover:text-neon-violet">
            Leer documento completo →
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-neon-violet/30 bg-neon-violet/10 p-4 text-sm">
        <p className="text-base-300">
          <strong>Contacto:</strong> Si tienes preguntas sobre estos documentos o deseas ejercer tus derechos ARCO,
          contáctanos en{' '}
          <a href="mailto:[CORREO DE CONTACTO/PRIVACIDAD]" className="text-neon-violet hover:text-neon-cyan">
            [CORREO DE CONTACTO/PRIVACIDAD]
          </a>
        </p>
      </div>
    </div>
  );
}
