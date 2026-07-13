export default function SeguridadPage() {
  return (
    <div className="space-y-6 text-base-100">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-neon-violet">Política de Seguridad</h1>
        <p className="text-sm text-base-400">Última actualización: [DD/MM/YYYY]</p>
      </div>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">1. Compromiso con la Seguridad</h2>
        <p className="text-base-300">
          [RAZÓN SOCIAL] (bajo la marca IN FLUENCE / RAVE Tickets) está comprometida con la protección de la información
          personal y financiera de nuestros usuarios. Esta Política de Seguridad describe las medidas técnicas y administrativas
          que implementamos para asegurar que tus datos estén protegidos en todo momento.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">2. Encriptación y Protección en Tránsito</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Certificados SSL/TLS: Nuestro sitio web utiliza certificados SSL/TLS de grado empresarial para encriptar toda la comunicación
entre tu navegador y nuestros servidores. Esto se evidencia por el "🔒" en la barra de direcciones de tu navegador
y el protocolo "HTTPS://" en la URL.

Nivel de encriptación: Utilizamos como mínimo encriptación de 256 bits (TLS 1.2 o superior) para garantizar que los datos
que transmites no puedan ser interceptados por terceros no autorizados.`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">3. Protección de Contraseñas</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Hashing seguro: Las contraseñas se almacenan utilizando el algoritmo bcrypt, un estándar de encriptación criptográfica
diseñado específicamente para contraseñas. Las contraseñas nunca se almacenan en texto plano.

Autenticación con JWT: Una vez que un usuario inicia sesión, recibe un token JWT (JSON Web Token) que se valida en cada solicitud.
Los tokens tienen una duración limitada y se renueva automáticamente, minimizando el riesgo si un token es comprometido.

Responsabilidad del usuario: Es tu responsabilidad mantener tu contraseña segura y confidencial. Nunca compartas tu contraseña
con nadie. Si sospechas que tu cuenta ha sido comprometida, cambia tu contraseña inmediatamente.`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">4. Control de Acceso y Autorización</h2>
        <p className="text-base-300">
          Sistema de roles y permisos: La Plataforma implementa un control de acceso granular basado en roles:
        </p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Administrador: Acceso completo a gestión de eventos, usuarios, ventas y reportes.</li>
          <li>• Super Administrador: Acceso adicional a auditoría y configuración del sistema.</li>
          <li>• Escaneador: Acceso limitado solo a validar boletos en el acceso del evento.</li>
        </ul>
        <p className="mt-3 text-base-300">
          Cada usuario puede acceder solo a la información y funciones necesarias para su rol.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">5. Protección de Datos Financieros</h2>
        <div className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-4">
          <h3 className="mb-2 font-semibold text-neon-green">No almacenamos datos de tarjeta</h3>
          <p className="text-sm text-base-300 mb-2">
            La Empresa NO almacena, no procesa ni no retiene datos de tarjetas de crédito, débito o información bancaria en sus servidores.
          </p>
          <p className="text-sm text-base-300 mb-2">Procesamiento seguro de pagos:</p>
          <ul className="ml-6 space-y-1 text-sm text-base-300">
            <li>• MercadoPago, PayPal u otros procesadores de pago autorizados</li>
            <li>• Estándar PCI DSS (Payment Card Industry Data Security Standard)</li>
            <li>• Encriptación de 256 bits para transmisión de datos financieros</li>
            <li>• Auditorías de seguridad independientes anuales</li>
          </ul>
          <p className="mt-2 text-xs text-base-400">
            Cuando proporcionas información de pago durante el checkout, es transmitida directamente al proveedor de pagos.
            La Empresa solo recibe confirmación de transacción (éxito o fallo) y no tiene acceso a los datos de tu tarjeta.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">6. Almacenamiento Seguro de Datos</h2>
        <p className="text-base-300">Infraestructura en la nube: Los datos se almacenan en Microsoft Azure:</p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Certificaciones: ISO 27001 (Gestión de Seguridad), SOC 2 Type II</li>
          <li>• Encriptación en reposo automática en servidores de Azure</li>
          <li>• Redundancia y backup: Copias en múltiples ubicaciones geográficas</li>
          <li>• Aislamiento de datos: Almacenamiento en bases de datos dedicadas</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">7. Auditoría y Registro de Actividades</h2>
        <p className="text-base-300">Bitácora de auditoría: La Plataforma registra todas las acciones críticas:</p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Logins de usuarios (quién, cuándo, desde dónde)</li>
          <li>• Cambios de datos (compras registradas, boletos emitidos)</li>
          <li>• Validaciones de boletos en acceso al evento</li>
          <li>• Accesos a reportes y datos sensibles</li>
        </ul>
        <p className="mt-3 text-base-300">
          La bitácora se conserva durante al menos [5 años] y es utilizada para investigar incidentes, detectar actividad
          sospechosa, cumplir con obligaciones fiscales y auditorías.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">8. Protección contra Amenazas Comunes</h2>
        <div className="space-y-3">
          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Inyección SQL y XSS</h3>
            <p className="text-sm text-base-300">
              La Plataforma valida y sanitiza toda entrada de usuario previniendo estos ataques.
            </p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">CSRF (Cross-Site Request Forgery)</h3>
            <p className="text-sm text-base-300">
              Se implementan tokens CSRF en todos los formularios y cambios de estado.
            </p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">DDoS (Denegación de Servicio Distribuido)</h3>
            <p className="text-sm text-base-300">
              La infraestructura de Azure incluye protección contra ataques DDoS con límites de tasa y filtros.
            </p>
          </div>

          <div className="rounded-lg bg-base-800/50 p-4">
            <h3 className="mb-2 font-semibold text-neon-violet">Phishing y Malware</h3>
            <p className="text-sm text-base-300">
              La Empresa no solicita datos sensibles por correo o teléfono. Si recibes una solicitud sospechosa, reenvíala a [CORREO DE CONTACTO/PRIVACIDAD].
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">9. Actualizaciones y Parcheo de Seguridad</h2>
        <p className="text-base-300">
          La Plataforma se actualiza regularmente con parches de seguridad y mejoras mediante procedimientos sin tiempo de inactividad.
          Se monitorean y actualizan todas las librerías y dependencias de terceros para corregir vulnerabilidades conocidas.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">10. Capacitación del Personal</h2>
        <p className="text-base-300">Todo el personal recibe capacitación periódica sobre:</p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Protección de datos personales y privacidad</li>
          <li>• Seguridad de contraseñas y manejo de credenciales</li>
          <li>• Identificación y prevención de phishing</li>
          <li>• Procedimientos de respuesta ante incidentes</li>
          <li>• Cumplimiento de regulaciones legales</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">11. Reportes de Brechas de Seguridad</h2>
        <p className="whitespace-pre-wrap text-base-300">{`En caso de detectar o sospechar una brecha de seguridad que comprometa datos personales:

Notificación inmediata: Notificaremos a los usuarios afectados sin demora injustificada (en un plazo máximo de [30 días]
después de la detección) y proporcionaremos:

• Descripción del incidente
• Datos que fueron potencialmente comprometidos
• Pasos que hemos tomado para contener el problema
• Recomendaciones para que protejas tu información
• Información de contacto para preguntas

Para reportar vulnerabilidades o incidentes, envía un correo a [CORREO DE CONTACTO/PRIVACIDAD] con el asunto "REPORTE DE SEGURIDAD".`}</p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">12. Limitaciones y Disclaimer</h2>
        <p className="text-base-300">
          Aunque implementamos medidas de seguridad robustas, ningún sistema es 100% seguro. La Empresa implementa seguridad
          de mejor esfuerzo y no puede garantizar absolutamente que:
        </p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Los datos nunca serán accedidos de forma no autorizada</li>
          <li>• La Plataforma será siempre disponible sin interrupciones</li>
          <li>• Técnicas de ataque futuras sean efectivamente prevenidas</li>
        </ul>

        <p className="mt-4 text-base-300">Tu responsabilidad: Tu seguridad también depende de ti:</p>
        <ul className="ml-6 space-y-2 text-base-300">
          <li>• Mantén tu dispositivo actualizado con parches de seguridad</li>
          <li>• Usa contraseñas fuertes y únicas para tu cuenta</li>
          <li>• No compartas tu contraseña ni información de pago</li>
          <li>• Ten cuidado con correos, mensajes o enlaces sospechosos</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">13. Cambios a esta Política</h2>
        <p className="text-base-300">
          La Empresa puede actualizar esta Política en cualquier momento para reflejar nuevas medidas, tecnologías o cambios regulatorios.
          Los cambios serán publicados en esta página.
        </p>
      </section>

      <section className="space-y-4 border-t border-base-700 pt-6">
        <h2 className="text-xl font-semibold text-neon-cyan">14. Contacto y Soporte</h2>
        <p className="whitespace-pre-wrap text-base-300">{`Para preguntas sobre seguridad, reportar vulnerabilidades o incidentes:

Correo de Seguridad: [CORREO DE CONTACTO/PRIVACIDAD] (asunto: "REPORTE DE SEGURIDAD")
Empresa: [RAZÓN SOCIAL]
RFC: [RFC]`}</p>
      </section>

      <div className="mt-8 rounded-lg border border-neon-green/30 bg-neon-green/10 p-4">
        <p className="text-sm text-base-300">
          <strong>Vigencia:</strong> Esta Política es válida a partir de [DD/MM/YYYY]. Tus derechos y obligaciones de seguridad
          entran en vigor de inmediato al usar la Plataforma.
        </p>
      </div>
    </div>
  );
}
