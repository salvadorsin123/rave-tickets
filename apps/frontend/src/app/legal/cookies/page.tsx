export default function CookiesPage() {
  return (
    <div className="space-y-6 text-base-100">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-neon-violet">Política de Cookies</h1>
        <p className="text-sm text-base-400">Última actualización: [DD/MM/YYYY]</p>
      </div>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">1. Qué son las Cookies</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Las cookies son pequeños archivos de texto que se almacenan en tu navegador web cuando visitas un sitio.
No son código ejecutable y no pueden dañar tu dispositivo. Contienen información que el sitio puede leer cuando regresas,
permitiendo recordar tus preferencias, mantener sesiones activas y mejorar tu experiencia.

Tipos de cookies según duración:
• De sesión: Se eliminan automáticamente al cerrar tu navegador.
• Persistentes: Permanecen en tu dispositivo durante un período especificado (días, meses o años).`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">2. Cookies que Utilizamos</h2>
        <p className="text-base-300">La Plataforma de IN FLUENCE / RAVE Tickets utiliza las siguientes cookies:</p>

        <div className="space-y-4">
          <div className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-4">
            <h3 className="mb-3 font-semibold text-neon-green">Cookies Esenciales (Necesarias)</h3>
            <p className="mb-2 text-sm text-base-300">
              Propósito: Son imprescindibles para que la Plataforma funcione correctamente.
              Sin ellas, no podemos mantener tu sesión de inicio.
            </p>
            <p className="mb-3 text-sm text-base-300">No pueden deshabilitarse sin perder funcionalidad.</p>

            <table className="w-full border-collapse text-xs text-base-300">
              <thead>
                <tr className="border-b border-base-600">
                  <th className="px-2 py-1 text-left font-semibold">Nombre</th>
                  <th className="px-2 py-1 text-left font-semibold">Duración</th>
                  <th className="px-2 py-1 text-left font-semibold">Finalidad</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-base-700">
                  <td className="px-2 py-1 font-mono">ACCESS_TOKEN</td>
                  <td className="px-2 py-1">~15 minutos</td>
                  <td className="px-2 py-1">Almacena tu token JWT de autenticación. Valida que estés autenticado.</td>
                </tr>
                <tr className="border-b border-base-700">
                  <td className="px-2 py-1 font-mono">REFRESH_TOKEN</td>
                  <td className="px-2 py-1">~7 días</td>
                  <td className="px-2 py-1">Permite renovar tu sesión automáticamente sin perder la conexión.</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-xs text-base-400">
              Estas cookies solo se activan cuando inicias sesión. No contienen información personal, solo un token cifrado.
            </p>
          </div>

          <div className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 p-4">
            <h3 className="mb-3 font-semibold text-neon-cyan">Cookies de Rendimiento y Analítica</h3>
            <p className="mb-2 text-sm text-base-300">
              Propósito: Recopilan información sobre cómo usas la Plataforma para mejorar su funcionamiento y rendimiento.
            </p>
            <p className="mb-2 text-sm text-base-300">
              Estado actual: NO se utilizan cookies de analítica en este momento.
            </p>
            <p className="text-xs text-base-400">
              Si en el futuro integramos herramientas de analítica (Google Analytics, Mixpanel, etc.),
              actualizaremos este aviso y solicitaremos tu consentimiento explícito.
            </p>
          </div>

          <div className="rounded-lg border border-neon-pink/30 bg-neon-pink/10 p-4">
            <h3 className="mb-3 font-semibold text-neon-pink">Cookies de Publicidad y Marketing</h3>
            <p className="mb-2 text-sm text-base-300">
              Propósito: Rastrearían tu actividad para mostrar anuncios personalizados y medir campañas de marketing.
            </p>
            <p className="mb-2 text-sm text-base-300">
              Estado actual: NO utilizamos cookies de publicidad.
            </p>
            <p className="text-xs text-base-400">
              Si en el futuro integraremos sistemas de publicidad, actualizaremos este aviso y solicitaremos tu consentimiento.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">3. Cookies de Terceros</h2>
        <p className="text-base-300">
          Actualmente, la Plataforma NO integra cookies de terceros (proveedores de pago, redes sociales, publicidad, etc.).
        </p>
        <p className="text-base-300">
          Si en el futuro integramos pasarelas de pago como MercadoPago o PayPal, esos proveedores pueden establecer sus propias cookies.
          Sus prácticas se rigen por sus avisos de privacidad independientes.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">4. Cómo Controlar y Eliminar Cookies</h2>
        <p className="text-base-300">
          No recomendamos deshabilitarlas porque afectaría el funcionamiento de la Plataforma.
          Sin embargo, tienes control total sobre ellas:
        </p>

        <div className="space-y-3">
          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">En tu navegador</h3>
            <p className="text-sm text-base-300 mb-2">Puedes permitir, bloquear o eliminar cookies desde la configuración de tu navegador:</p>
            <ul className="ml-6 space-y-1 text-xs text-base-300">
              <li>• Chrome / Edge: Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios</li>
              <li>• Firefox: Preferencias &gt; Privacidad y seguridad &gt; Cookies y datos del sitio</li>
              <li>• Safari: Preferencias &gt; Privacidad &gt; Gestionar datos del sitio web</li>
            </ul>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Opción Do Not Track (DNT)</h3>
            <p className="text-sm text-base-300">
              Algunos navegadores permiten enviar una señal de No rastrear. La Plataforma respeta esta preferencia.
            </p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Modo incógnito / Privado</h3>
            <p className="text-sm text-base-300">
              Si abres la Plataforma en modo incógnito, las cookies de sesión se eliminan automáticamente al cerrar la ventana.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-neon-amber/30 bg-neon-amber/10 p-4">
          <p className="text-xs text-base-300">
            Advertencia: Si desactivas las cookies esenciales (ACCESS_TOKEN, REFRESH_TOKEN),
            no podrás iniciar sesión ni usar la Plataforma correctamente.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">5. Consentimiento y Cambios</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Uso de la Plataforma: Al usar la Plataforma, aceptas el uso de cookies esenciales tal como se describe en esta Política.
Estas cookies son obligatorias para que el servicio funcione.

Cookies futuras: Si agregamos nuevas cookies (analítica, publicidad, etc.), te solicitaremos consentimiento explícito
y actualizaremos esta Política.

Cambios a esta Política: La Empresa se reserva el derecho de actualizar esta Política en cualquier momento.
Los cambios entrarán en vigor al momento de su publicación. El uso continuado implica aceptación de los cambios.`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">6. Privacidad y Datos Personales</h2>
        <p className="text-base-300">
          Las cookies pueden contener o recopilar información que se considera datos personales bajo leyes de privacidad.
        </p>
        <p className="text-base-300">
          Para detalles completos sobre cómo protegemos tus datos, incluyendo cookies, consulta nuestro Aviso de Privacidad.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">7. Contacto</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Si tienes preguntas sobre esta Política de Cookies:

Correo: [CORREO DE CONTACTO/PRIVACIDAD]
Empresa: [RAZÓN SOCIAL]
RFC: [RFC]`}</p>
      </section>

      <div className="mt-8 space-y-4 rounded-lg border border-neon-violet/30 bg-neon-violet/10 p-4">
        <p className="text-sm text-base-300">
          <strong>Resumen ejecutivo:</strong>
        </p>
        <ul className="ml-6 space-y-1 text-xs text-base-300">
          <li>✓ Utilizamos solo cookies esenciales para que la plataforma funcione.</li>
          <li>✓ No vendemos datos de cookies a terceros.</li>
          <li>✓ Puedes controlar cookies desde tu navegador.</li>
          <li>✓ Te notificaremos si agregamos nuevas cookies en el futuro.</li>
        </ul>
      </div>
    </div>
  );
}
