# Sistema Completo de Venta y Validación de Entradas para Rave (Azure)

Actúa como un Arquitecto de Software Senior, Full Stack Developer y Especialista en Microsoft Azure.

Necesito que diseñes y desarrolles una aplicación web completa para la gestión de venta y validación de entradas para eventos tipo rave.

## Objetivo General

Crear una plataforma web responsiva que funcione perfectamente en computadoras, tablets y teléfonos móviles, permitiendo:

El sistema NO tendrá portal para compradores.

Todas las ventas serán registradas manualmente por un administrador después de recibir el pago en efectivo.

El sistema deberá estar preparado para desplegarse en Microsoft Azure utilizando tecnologías modernas, escalables y seguras.

El sistema debe soportar múltiples eventos.

Cada boleto debe pertenecer obligatoriamente a un evento.

La aplicación debe entregarse completamente dockerizada.

Generar:

- Dockerfile frontend
- Dockerfile backend
- docker-compose.yml

Generar pipeline CI/CD para Azure:

- Build
- Test
- Deploy

Utilizando GitHub Actions.
---

# Tipos de Usuario

## 1. Administrador

Debe tener acceso completo al sistema.


Debe poder:

* Crear eventos
* Editar eventos
* Cerrar eventos
* Duplicar configuraciones entre eventos

Todas las estadísticas deben poder filtrarse por evento.
### Gestión de Ventas

* Registrar una nueva venta.
* Capturar:

  * Nombre completo del comprador.
  * Correo electronico(no obligatorio).
  * Fecha de compra (Se hace automaticamente).
  * Cantidad de personas incluidas en la entrada.

### Generación Automática de Boletos

Al guardar una venta:

* Generar automáticamente un PDF profesional.
* Generar automáticamente un código QR único.
* Incrustar el QR dentro del PDF.
* Asignar un identificador único e irrepetible al boleto.
* Permitir descargar el PDF.
* Permitir reenviar el PDF posteriormente.
* Guardar copia del PDF en el sistema.
El QR NO debe contener información sensible.
Debe contener únicamente:
* UUID del boleto.
* Token de validación seguro.

###Información del Boleto

Cada boleto debe tener:

* ID único.
* Folio único.
* Nombre del comprador.
* Cantidad de personas incluidas.
* Estado del boleto.
* Código QR único.


personasCompradas
personasIngresadas

Ejemplo:

Compradas: 5
Ingresadas: 3

El sistema permitirá registrar ingresos parciales hasta completar el total autorizado.

Estados posibles:

* Pendiente
* Parcialmente Utilizado
* Utilizado
* Cancelado
* Reembolsado
* Bloqueado por fraude

### Consulta de Entradas

Visualizar:

* Todas las entradas vendidas.
* Entradas utilizadas.
* Entradas pendientes.
* Entradas canceladas.
* Entradas duplicadas detectadas.
* Historial de escaneos.

### Gestión de Escaneadores

Poder:

* Crear usuarios escaneadores.
* Editarlos.
* Desactivarlos.
* Restablecer contraseñas.
* Consultar actividad de cada escaneador.

### Dashboard Administrativo

Mostrar:

* Ventas totales.
* Ingresos totales.
* Boletos vendidos.
* Asistentes esperados.
* Asistentes ingresados.
* Porcentaje de asistencia.
* Boletos pendientes.
* Boletos cancelados.
* Boletos reembolsados.
* Ventas por día.
* Ventas por hora.
* Ingresos por evento.
* Top escaneadores.
* Actividad reciente.
* Gráficas comparativas.

### Reportes

Exportar:

* Excel.
* CSV.
* PDF.

---
# Diseño del PDF

El boleto PDF debe incluir:

* Logo del evento.
* Nombre del rave.
* Fecha.
* Lugar.
* Nombre del comprador.
* Cantidad de asistentes.
* QR.
* Folio.
* Instrucciones de acceso.
* Diseño moderno estilo festival/rave.

---
## 2. Escaneador

Acceso limitado.

Debe poder:

### Escanear QR

Utilizando:

* Cámara del celular.
* Cámara web de laptop.

### Validación de Entrada

Al escanear:

Buscar el QR en la base de datos.

Modo de validación rápida.

Al escanear:

- Mostrar resultado en menos de 1 segundo.
- Vibración en móvil.
- Pantalla verde para válido.
- Pantalla rojo para inválido.

No requerir confirmación adicional.
Si es válido mostrar:

✅ ENTRADA VÁLIDA

Información:

* Nombre del comprador.
* ID del boleto.
* Cantidad de personas incluidas.
* Fecha de compra.

Al escanear un QR válido:

Registrar automáticamente el ingreso.

Mostrar confirmación visual.

No requerir acciones adicionales.

---

### Entrada Ya Utilizada

Si ya fue registrada:

Mostrar alerta roja:

❌ ESTA ENTRADA YA FUE UTILIZADA

Mostrar:

* Fecha del primer ingreso.
* Hora.
* Escaneador que la registró.

No permitir registrar nuevamente.

---

### Entrada Inexistente

Mostrar:

❌ QR NO VÁLIDO

---

### Historial Personal

El escaneador puede consultar únicamente:

* Entradas que él registró.
* Hora de ingreso.
* Cantidad de personas.

No puede modificar datos.

---

# Gestión de Personas por Entrada

Cada boleto puede representar:

* 1 persona
* 2 personas
* 3 personas
* N personas

Ejemplo:

Boleto #RV2025-001

Comprador:
Juan Pérez

Personas incluidas:
5

Actualizar estadísticas automáticamente.

---

# Seguridad
Implementar:

* JWT Authentication.
* Roles y permisos.
* Contraseñas cifradas con bcrypt.
* Protección CSRF.
* Validaciones backend.
* Rate limiting.
* Auditoría de acciones.
* Logs completos.

---

# Base de Datos

Diseñar esquema relacional completo.

Tablas sugeridas:

Usuarios
Roles
Permisos
Ventas
Boletos
Escaneos
Eventos
Configuraciones
BitácoraAuditoría

Incluir:

* PK
* FK
* Índices
* Restricciones
* Diagramas entidad-relación

---

# Tecnología Recomendada

Frontend:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Responsive Design

Backend obligatorio:

* NestJS
* TypeScript
* Prisma ORM
* Azure SQL Database

Base de Datos:

* Azure SQL Database

Utilizar arquitectura limpia (Clean Architecture):

* Domain
* Application
* Infrastructure
* Presentation

Aplicar principios SOLID.

Separar responsabilidades mediante:

* Services
* Repositories
* DTOs
* Validators
* Guards

Autenticación:

* JWT

PDF:

* PDFKit o equivalente

QR:

* qrcode library

---

# Microsoft Azure

La solución debe ser desplegable en Azure.

Arquitectura sugerida:

Frontend:

* Azure Static Web Apps

Backend:

* Azure App Service

Base de Datos:

* Azure SQL Database

Archivos PDF:

* Azure Blob Storage

Seguridad:

* Azure Key Vault

Monitoreo:

* Azure Application Insights

---

# Requisitos de UX/UI

Diseño moderno tipo dashboard profesional.

Colores:

* Tema oscuro.
* Estética rave/festival.
* Neones discretos.
* Alta legibilidad.

Compatible con:

* Android
* iPhone
* Tablets
* Laptops
* Escritorio

---

# Funciones Adicionales Deseables

* Búsqueda rápida por nombre o ID.
* Reimpresión de boletos.
* Cancelación de boletos.
* Registro de múltiples eventos.
* Configuración de precios.
* Importación y exportación masiva.
* Auditoría completa.
* Historial de cambios.

---

# Entregables Esperados

Genera:

1. Arquitectura completa del sistema.
2. Diagrama de base de datos.
3. Estructura de carpetas del proyecto.
4. Modelo de datos.
5. APIs REST completas.
6. Casos de uso.
7. Diagramas UML.
8. Wireframes de interfaces.
9. Código backend.
10. Código frontend.
11. Scripts SQL.
12. Instrucciones de despliegue en Azure.
13. Estrategia de seguridad.
14. Plan de escalabilidad para eventos de miles de asistentes.

El resultado debe ser profesional, escalable, mantenible y listo para producción.
IMPORTANTE:

No generes todo el código en una sola respuesta.

Trabaja por fases:

Fase 1:
* Arquitectura
* Casos de uso
* Modelo de datos
* Diagramas

Esperar aprobación.

Fase 2:
* Backend completo

Esperar aprobación.

Fase 3:
* Frontend completo

Esperar aprobación.

Fase 4:
* Azure
* Docker
* CI/CD

Esperar aprobación.

Actúa como si estuvieras desarrollando un producto real para producción.
