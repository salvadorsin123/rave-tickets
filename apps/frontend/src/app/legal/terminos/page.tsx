import Link from 'next/link';

const sections = [
  {
    title: '1. Aceptación de Términos',
    content: `Al acceder y utilizar el sitio web y la plataforma de venta de boletos de [RAZÓN SOCIAL]
(en adelante, "la Plataforma"), bajo la marca comercial IN FLUENCE / RAVE Tickets (en adelante, "la Empresa"),
aceptas estar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna disposición, no utilices la Plataforma.

Estos términos rigen todos los accesos y compras realizadas a través de la Plataforma, incluyendo compras
en línea y compras presenciales registradas por el personal autorizado de la Empresa.`,
  },
  {
    title: '2. Descripción del Servicio',
    content: `La Empresa opera una plataforma de venta de boletos para acceso a eventos (conciertos, festivales,
eventos musicales y de entretenimiento) bajo la modalidad de entradas digitales.

Los boletos se entregan en formato digital mediante un código QR que debe presentarse al momento de acceso
al evento. El boleto es transferible libremente y no requiere verificación de identidad del portador.`,
  },
  {
    title: '3. Requisitos para Comprar',
    content: `Para realizar una compra de boletos debes cumplir con los siguientes requisitos:

• Ser mayor de 18 años (salvo compras presenciales autorizadas).
• Proporcionar información veraz, completa y actualizada (nombre, correo electrónico).
• Verificar que respetas las restricciones de edad del evento específico (algunos eventos son solo para 18+ años).
• Contar con medios de pago válidos (presencial en efectivo o en línea mediante pasarela de pagos).

La Empresa se reserva el derecho de verificar la información proporcionada y cancelar compras que no cumplan
con estos requisitos o que presenten indicios de fraude.`,
  },
  {
    title: '4. Proceso de Compra',
    content: `Compra en línea: Selecciona el evento, la cantidad de boletos, proporciona tu información de contacto,
elige tu método de pago y completa la transacción. Recibirás una confirmación y los boletos (en formato PDF con código QR)
serán enviados a tu correo electrónico en un plazo de hasta 24 horas.

Compra presencial: El personal autorizado registra la venta, emite el boleto digital y te proporciona el código QR por medios convenidos.

La Empresa se reserva el derecho de rechazar una compra en cualquier momento si detecta actividad fraudulenta,
violación de estos términos o incumplimiento de políticas.`,
  },
  {
    title: '5. Precios y Pago',
    content: `Todos los precios se muestran en pesos mexicanos (MXN) e incluyen impuestos aplicables, salvo indicación explícita contraria.
La Empresa se reserva el derecho de modificar precios en cualquier momento sin previo aviso.

El pago en línea se procesa de forma segura a través de proveedores de pago autorizados (p.ej., MercadoPago, PayPal u otros).
Los datos de tu tarjeta de crédito no son almacenados por la Empresa; son procesados directamente por el proveedor de pagos
en cumplimiento con estándares de seguridad internacionales (PCI DSS).

Al hacer clic en "Confirmar compra", autorizas el cobro del monto total. El cargo aparecerá en tu estado de cuenta con el nombre del evento y fecha.`,
  },
  {
    title: '6. Entrega de Boletos',
    content: `Los boletos se entregan en formato digital (correo electrónico con archivo PDF y código QR) en un plazo máximo de 24 horas
después de la confirmación del pago.

Es responsabilidad del comprador:
• Revisar la carpeta de spam/promociones si no recibes el correo en la bandeja de entrada.
• Guardar el correo con los boletos en lugar seguro.
• Llevar el código QR (impreso o en pantalla) al acceso del evento.

La Empresa no es responsable por la pérdida, no recepción por falla en el correo electrónico del comprador, o mal uso de los boletos entregados.`,
  },
  {
    title: '7. Política de Cancelación y Reembolso',
    content: `Cancelación por el comprador: Puedes solicitar la cancelación de tu compra y reembolso del monto pagado dentro de los [N] días
naturales previos a la fecha del evento, enviando una solicitud al correo [CORREO DE CONTACTO/PRIVACIDAD] con el número de compra
y los datos de la cuenta.

El reembolso se procesará a través del mismo medio de pago utilizado en la compra original, en un plazo de 5 a 10 días hábiles
después de la aprobación de la solicitud. Aplica retención de comisiones de la pasarela de pago si las hubiera.

Fuera de la ventana de reembolso: No se otorgan reembolsos por cambio de opinión, asuntos personales, conflictos de horarios
u otros motivos imputables al comprador una vez expirado el plazo de [N] días.

Cancelación del evento: Si la Empresa cancela o pospone un evento, se notificará a los compradores por correo electrónico
con al menos [5 a 7] días de anticipación. Los compradores podrán:

• Recibir reembolso completo del monto pagado, o
• Aceptar la nueva fecha propuesta (si la hubiera) sin cargo adicional, o cambiar su boleto a otro evento de valor equivalente o superior.

Si el evento se cancela por causas de fuerza mayor (desastres naturales, pandemias, acción de autoridades),
la Empresa se reserva el derecho de ofrecer crédito por el monto del boleto válido por 12 meses en lugar de reembolso en efectivo,
salvo obligación legal contraria.`,
  },
  {
    title: '8. Restricciones de Edad y Acceso',
    content: `Algunos eventos tienen restricciones de edad (p.ej., solo para 18+). La restricción aplicable se indica claramente en la página de cada evento.

El comprador es responsable de verificar y respetar estas restricciones. La Empresa y los organizadores del evento se reservan el derecho de:

• Solicitar identificación oficial al acceso para verificar edad.
• Denegar el acceso si no cumples con el requisito de edad, sin reembolso.`,
  },
  {
    title: '9. Uso Prohibido',
    content: `Se prohíbe explícitamente:

• Usar la Plataforma con fines ilícitos, fraudulentos o para evadir restricciones (p.ej., reventas no autorizadas en plataformas externas).
• Compartir credenciales de acceso o realizar compras en nombre de terceros sin autorización.
• Modificar, duplicar, o usar boletos de forma no autorizada.
• Ejecutar scripts automatizados, bots o cualquier herramienta de scraping sobre la Plataforma.
• Intentar obtener acceso no autorizado a sistemas o datos.

El incumplimiento de estas prohibiciones resultará en cancelación de la compra, bloqueo de la cuenta y posibles acciones legales.`,
  },
  {
    title: '10. Garantías y Limitación de Responsabilidad',
    content: `La Plataforma se proporciona tal como está sin garantías explícitas ni implícitas en cuanto a disponibilidad,
funcionamiento sin interrupciones, o seguridad absoluta.

La Empresa no es responsable por:
• Interrupciones, caídas o errores en la Plataforma derivados de problemas técnicos, mantenimiento, o actos de terceros.
• Pérdida, hurto, o mal uso de boletos una vez entregados (incluyendo pérdida de acceso al correo electrónico).
• Incapacidad del comprador para asistir al evento por cualquier causa.
• Daños, lesiones o incidentes ocurridos durante el evento (responsabilidad del organizador).
• Cambios de lineup artístico, duración del evento, o condiciones del mismo.

Limitación de responsabilidad: La responsabilidad total de la Empresa por cualquier reclamo no excederá el monto pagado por el boleto en cuestión.`,
  },
  {
    title: '11. Propiedad Intelectual',
    content: `Todos los contenidos de la Plataforma (nombre, logo, diseño, textos, imágenes, códigos) son propiedad intelectual de la Empresa
o sus licenciantes. No se autoriza la reproducción, distribución o uso sin permiso expreso.`,
  },
  {
    title: '12. Privacidad y Datos Personales',
    content: `El tratamiento de tus datos personales se rige por el Aviso de Privacidad disponible en esta sección.
Al comprar, aceptas que tus datos sean utilizados conforme a ese aviso.`,
  },
  {
    title: '13. Modificación de Términos',
    content: `La Empresa se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios entrarán en vigor
al momento de su publicación en la Plataforma. El uso continuado de la Plataforma después de la publicación implica tu aceptación
de los términos modificados.`,
  },
  {
    title: '14. Jurisdicción y Resolución de Conflictos',
    content: `Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos, específicamente por:

• Ley Federal de Protección al Consumidor (LFPC)
• Leyes fiscales y mercantiles aplicables
• Lineamientos de la PROFECO

En caso de controversia, se promueve la resolución amistosa mediante comunicación directa al correo [CORREO DE CONTACTO/PRIVACIDAD].
Si no se alcanza acuerdo, la controversia se someterá a la jurisdicción de los tribunales competentes en la República Mexicana.

Derechos del consumidor: Los derechos consagrados en la LFPC no pueden ser renunciados. Si consideras que tus derechos como consumidor
han sido vulnerados, puedes presentar una queja ante la PROFECO.`,
  },
  {
    title: '15. Contacto',
    content: `Para cualquier duda, reclamo o solicitud relacionada con estos Términos:

Correo electrónico: [CORREO DE CONTACTO/PRIVACIDAD]
Empresa: [RAZÓN SOCIAL]
RFC: [RFC]
Domicilio: [DOMICILIO FISCAL]`,
  },
];

export default function TerminosPage() {
  return (
    <div className="space-y-6 text-base-100">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-neon-violet">Términos y Condiciones</h1>
        <p className="text-sm text-base-400">Última actualización: [DD/MM/YYYY]</p>
      </div>

      {sections.map((section, idx) => (
        <section key={idx} className="space-y-4 border-t border-base-700 pt-6">
          <h2 className="text-xl font-semibold text-neon-cyan">{section.title}</h2>
          <p className="whitespace-pre-wrap text-base-300">{section.content}</p>
        </section>
      ))}

      <div className="mt-8 rounded-lg border border-neon-violet/30 bg-neon-violet/10 p-4">
        <p className="text-sm text-base-300">
          <strong>Última actualización:</strong> [DD/MM/YYYY]. Estos Términos son válidos a partir de esa fecha y superan cualquier versión anterior.
        </p>
      </div>
    </div>
  );
}
