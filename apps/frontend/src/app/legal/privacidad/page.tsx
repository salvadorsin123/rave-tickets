export default function PrivacidadPage() {
  return (
    <div className="space-y-6 text-base-100">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-neon-violet">Aviso de Privacidad</h1>
        <p className="text-sm text-base-400">Última actualización: [DD/MM/YYYY]</p>
      </div>

      <div className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 p-4 text-sm text-base-300">
        <p>
          En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
          y los lineamientos del Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI),
          presentamos este Aviso de Privacidad.
        </p>
      </div>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">1. Responsable de los Datos</h2>
        <p className="whitespace-pre-wrap text-base-300">{`[RAZÓN SOCIAL] (en adelante, "la Empresa"), identificada con RFC [RFC], es responsable del tratamiento de tus datos personales.

Domicilio: [DOMICILIO FISCAL]

Para contacto sobre privacidad: [CORREO DE CONTACTO/PRIVACIDAD]`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">2. Datos Personales que Recabamos</h2>
        <p className="text-base-300">La Empresa recaba los siguientes tipos de datos personales:</p>

        <div className="space-y-3">
          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Datos de Contacto (Obligatorios)</h3>
            <p className="text-sm text-base-300">• Nombre completo • Correo electrónico</p>
            <p className="mt-2 text-xs text-base-400">Utilizados para emitir boletos, enviar confirmaciones y comunicaciones relacionadas con tu compra.</p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Datos de Acceso al Evento (Automáticos)</h3>
            <p className="text-sm text-base-300">• Dirección IP del dispositivo • Información del navegador y dispositivo • Fecha y hora de validación del boleto</p>
            <p className="mt-2 text-xs text-base-400">Registrados para fines de seguridad, validación de acceso y análisis de patrones de asistencia.</p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Datos de Pago (Datos Sensibles)</h3>
            <p className="text-sm text-base-300">La Empresa NO almacena datos de tarjeta de crédito, datos bancarios ni información financiera.</p>
            <p className="mt-2 text-xs text-base-400">El pago es procesado directamente por proveedores autorizados (MercadoPago, PayPal, etc.) en cumplimiento con estándares PCI DSS.</p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Datos de Bitácora Administrativa (Internos)</h3>
            <p className="text-sm text-base-300">• ID de usuario (staff/escaneador) • Acciones realizadas en la plataforma • Dirección IP y marca temporal de la acción</p>
            <p className="mt-2 text-xs text-base-400">Registrados en auditoría con fines de trazabilidad, seguridad interna y cumplimiento legal.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">3. Finalidades del Tratamiento</h2>

        <div className="space-y-4">
          <div className="rounded-lg border border-neon-violet/20 bg-neon-violet/5 p-4">
            <h3 className="mb-3 font-semibold text-neon-violet">Finalidades Primarias (Necesarias)</h3>
            <p className="mb-2 text-sm text-base-300">Sin estas finalidades, no podemos proporcionar nuestros servicios:</p>
            <ul className="ml-6 space-y-2 text-sm text-base-300">
              <li>• Gestión de compra</li>
              <li>• Validación de acceso</li>
              <li>• Atención al cliente</li>
              <li>• Cumplimiento legal</li>
              <li>• Seguridad</li>
            </ul>
          </div>

          <div className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 p-4">
            <h3 className="mb-3 font-semibold text-neon-cyan">Finalidades Secundarias (Opcionales)</h3>
            <p className="mb-2 text-sm text-base-300">Podemos utilizar tus datos para estas finalidades solo si nos otorgas consentimiento expreso:</p>
            <ul className="ml-6 space-y-2 text-sm text-base-300">
              <li>• Mercadotecnia y promociones</li>
              <li>• Análisis de comportamiento</li>
              <li>• Investigación y estadísticas</li>
            </ul>
            <p className="mt-3 text-xs text-base-400">
              Para estas finalidades, podemos solicitar tu consentimiento expreso. Puedes revocar tu consentimiento en cualquier
              momento contactándonos al correo [CORREO DE CONTACTO/PRIVACIDAD].
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">4. Transferencias de Datos</h2>
        <p className="text-base-300">Tus datos personales pueden ser compartidos con los siguientes tipos de terceros:</p>

        <div className="space-y-3">
          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Proveedores de Infraestructura</h3>
            <p className="text-sm text-base-300">
              Microsoft Azure: Almacenamiento seguro de boletos en PDF en servidores en la nube. Cumple con estándares internacionales (ISO 27001, SOC 2).
            </p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Proveedores de Pago</h3>
            <p className="text-sm text-base-300">
              MercadoPago / PayPal u otros procesadores reciben información mínima necesaria y tienen sus propios avisos de privacidad.
            </p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Autoridades Competentes</h3>
            <p className="text-sm text-base-300">
              La Empresa puede divulgar datos si lo requiere una autoridad judicial, fiscal o administrativa.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">5. Plazo de Conservación</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Datos de contacto (nombre, correo): Mientras tengas una cuenta activa y hasta [5 años] después de la última compra.
Datos de acceso (IP, device info, hora de validación): Hasta [5 años] desde la fecha del evento.
Bitácora de auditoría: [5 años] mínimo, conforme a obligaciones fiscales.
Datos de consentimiento para finalidades secundarias: Hasta que revokes tu consentimiento.

Después del plazo aplicable, eliminaremos o anonimizaremos tus datos, salvo que la ley nos obligue a conservarlos más tiempo.`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">6. Derechos ARCO y Revocación de Consentimiento</h2>
        <p className="text-base-300">Conforme a la LFPDPPP, tienes derecho a:</p>

        <div className="space-y-3">
          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Acceso (A)</h3>
            <p className="text-sm text-base-300">Solicitar acceso a los datos personales que la Empresa tiene sobre ti.</p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Rectificación (R)</h3>
            <p className="text-sm text-base-300">Solicitar que actualicemos o corrijamos datos inexactos, incompletos u obsoletos.</p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Cancelación (C)</h3>
            <p className="text-sm text-base-300">Solicitar la eliminación de tus datos, salvo que la ley nos obligue a conservarlos.</p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Oposición (O)</h3>
            <p className="text-sm text-base-300">Oponte a que usemos tus datos para finalidades secundarias (mercadotecnia, análisis, etc.).</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 p-4">
          <h3 className="mb-2 font-semibold text-neon-cyan">Cómo Ejercer tus Derechos</h3>
          <p className="text-sm text-base-300 mb-2">Envía una solicitud por correo electrónico a: [CORREO DE CONTACTO/PRIVACIDAD]</p>
          <p className="text-sm text-base-300 mb-2">Información requerida en tu solicitud:</p>
          <ul className="ml-6 space-y-1 text-sm text-base-300">
            <li>• Tu nombre completo y correo electrónico de registro.</li>
            <li>• El derecho que deseas ejercer (Acceso / Rectificación / Cancelación / Oposición).</li>
            <li>• Una descripción clara de tu solicitud.</li>
            <li>• Datos de contacto para respuesta.</li>
          </ul>
          <p className="mt-2 text-xs text-base-400">
            Nos comprometemos a responder tu solicitud en un plazo máximo de [20 días hábiles] desde su recepción.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">7. Seguridad de los Datos</h2>
        <p className="text-base-300">La Empresa implementa medidas de seguridad técnicas y administrativas:</p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Encriptación: SSL/TLS de grado empresarial para datos en tránsito.</li>
          <li>• Control de acceso: Solo personal autorizado puede acceder a datos personales.</li>
          <li>• Almacenamiento seguro: Azure con encriptación en reposo y backups regulares.</li>
          <li>• Auditoría: Se registra toda acción sobre datos personales.</li>
          <li>• Políticas internas: Todo personal recibe capacitación en protección de datos.</li>
        </ul>
        <p className="mt-3 text-sm text-base-400">
          Aunque implementamos estándares robustos, ningún sistema es 100% seguro. Si detectas una brecha, contáctanos en [CORREO DE CONTACTO/PRIVACIDAD].
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">8. Uso de Cookies</h2>
        <p className="text-base-300">
          La Plataforma utiliza cookies para funcionar y mejorar tu experiencia. Consulta nuestra Política de Cookies para detalles completos.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">9. Cambios a este Aviso</h2>
        <p className="text-base-300">
          La Empresa puede actualizar este Aviso en cualquier momento. Los cambios entrarán en vigor al momento de su publicación.
          Notificaremos cambios significativos por correo o mediante un aviso prominente en la Plataforma.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">10. Contacto y Reclamaciones</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Para privacidad y ejercer derechos ARCO:
Correo: [CORREO DE CONTACTO/PRIVACIDAD]
Empresa: [RAZÓN SOCIAL]
RFC: [RFC]

Para reclamaciones ante autoridad, puedes contactar al INAI:
Sitio web: www.inai.org.mx
Correo: privacidad@inai.org.mx
Teléfono: 01-800-835-4624`}</p>
      </section>

      <div className="mt-8 rounded-lg border border-neon-violet/30 bg-neon-violet/10 p-4">
        <p className="text-sm text-base-300">
          <strong>Vigencia:</strong> Este Aviso es válido a partir de [DD/MM/YYYY] y entra en vigor de inmediato.
        </p>
      </div>
    </div>
  );
}
