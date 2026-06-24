# Wireframes de Interfaces

Estilo visual: tema oscuro, acentos neón (violeta/cian), alta legibilidad, responsivo (mobile-first).

## 1. Login

```
┌──────────────────────────────────┐
│            ⚡ RAVE ADMIN          │
│                                    │
│   Email     [______________]      │
│   Password  [______________]      │
│                                    │
│           [  Iniciar sesión  ]    │
└──────────────────────────────────┘
```

## 2. Dashboard administrativo

```
┌─────────────────────────────────────────────────────────────┐
│ ☰  RAVE ADMIN        Evento: [Selector de evento ▾]   👤 ⏻  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │ Ventas  │ │ Ingresos│ │ Boletos │ │ % Asist.│             │
│ │  1,240  │ │ $620,000│ │  1,180  │ │   78%   │             │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                │
│ ┌───────────────────────────┐ ┌─────────────────────────┐    │
│ │ Ventas por día (gráfica)  │ │ Top escaneadores         │    │
│ │   ▂▃▅▇█▆▃▂                │ │ 1. Ana   320 escaneos    │    │
│ └───────────────────────────┘ │ 2. Luis  290 escaneos    │    │
│                                 └─────────────────────────┘    │
│ ┌───────────────────────────────────────────────────────┐     │
│ │ Actividad reciente                                     │    │
│ │ 14:02 Ana escaneó boleto RV2025-014 (válido)            │    │
│ │ 14:01 Admin registró venta RV2025-118                  │    │
│ └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
Menú lateral (☰): Dashboard · Eventos · Ventas · Boletos · Escaneadores · Reportes · Auditoría
```

## 3. Registrar venta

```
┌──────────────────────────────────────────────┐
│ Nueva Venta                          Evento: Rave Neón 2026 │
├──────────────────────────────────────────────┤
│ Nombre completo del comprador  [____________]│
│ Correo (opcional)              [____________]│
│ Cantidad de personas           [  3  ] (-/+)  │
│ Monto total                    [____________]│
│                                                │
│              [ Cancelar ]   [ Registrar venta ]│
└──────────────────────────────────────────────┘

→ Al confirmar: modal de éxito con folio generado,
  vista previa del PDF/QR y botones [Descargar PDF] [Reenviar].
```

## 4. Listado de boletos / entradas

```
┌───────────────────────────────────────────────────────────────────┐
│ Boletos        Evento: [▾]   Estado: [Todos ▾]   🔍 Buscar nombre/folio│
├───────────────────────────────────────────────────────────────────┤
│ Folio       Comprador      Personas  Ingresadas  Estado        ⋮  │
│ RV2025-001  Juan Pérez     5         3           ParcialUtiliz  ⋮  │
│ RV2025-002  María López    2         2           Utilizado      ⋮  │
│ RV2025-003  Carlos Ruiz    1         0           Pendiente      ⋮  │
├───────────────────────────────────────────────────────────────────┤
│                                            [Exportar: Excel CSV PDF]│
└───────────────────────────────────────────────────────────────────┘
⋮ → Ver detalle, Descargar PDF, Reenviar, Cancelar, Reembolsar, Bloquear por fraude
```

## 5. Gestión de escaneadores

```
┌───────────────────────────────────────────────────────────┐
│ Escaneadores                              [+ Nuevo escaneador]│
├───────────────────────────────────────────────────────────┤
│ Nombre      Email              Activo   Escaneos   ⋮       │
│ Ana Torres  ana@rave.com       ●        320         ⋮      │
│ Luis Gómez  luis@rave.com      ●        290         ⋮      │
│ Pedro Sáenz pedro@rave.com     ○ (off)  12          ⋮      │
└───────────────────────────────────────────────────────────┘
⋮ → Editar, Desactivar, Restablecer contraseña, Ver actividad
```

## 6. Pantalla de escaneo (móvil — vista principal del Escaneador)

```
┌───────────────────────┐
│   Escaneando...       │
│ ┌───────────────────┐ │
│ │                   │ │
│ │   [Cámara live]   │ │
│ │     ▢▢▢▢▢▢        │ │
│ │                   │ │
│ └───────────────────┘ │
│                       │
│  Últimos escaneos:    │
│  ✅ RV2025-014        │
│  ❌ RV2025-009        │
└───────────────────────┘
```

### Resultado válido (pantalla completa verde)

```
┌───────────────────────┐
│ ████████████████████ │
│   ✅ ENTRADA VÁLIDA   │
│                       │
│  Juan Pérez           │
│  Boleto RV2025-001    │
│  3 personas           │
│  Compra: 12/06/2026   │
│ ████████████████████ │
└───────────────────────┘
(vibración + auto-regreso a cámara en 1.5s)
```

### Resultado: ya utilizada (pantalla completa roja)

```
┌───────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░ │
│ ❌ YA FUE UTILIZADA   │
│                       │
│  Primer ingreso:      │
│  12/06/2026 22:14     │
│  Escaneador: Ana      │
│ ░░░░░░░░░░░░░░░░░░░░░ │
└───────────────────────┘
```

### Resultado: QR no válido

```
┌───────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░ │
│   ❌ QR NO VÁLIDO     │
│ ░░░░░░░░░░░░░░░░░░░░░ │
└───────────────────────┘
```

## 7. Historial personal del escaneador

```
┌──────────────────────────────────────────┐
│ Mi historial — Ana Torres                │
├──────────────────────────────────────────┤
│ Hora     Folio        Personas  Resultado│
│ 22:14    RV2025-001   3         Válido   │
│ 22:10    RV2025-014   1         Válido   │
│ 22:05    RV2025-009   2         Ya usado │
└──────────────────────────────────────────┘
```

## 8. Reportes

```
┌────────────────────────────────────────────┐
│ Reportes          Evento: [▾]  Rango fecha: [____]│
├────────────────────────────────────────────┤
│ [ Ventas ]  [ Boletos ]  [ Escaneos ]       │
│                                              │
│  Vista previa de tabla...                   │
│                                              │
│        [ Exportar Excel ] [ CSV ] [ PDF ]   │
└────────────────────────────────────────────┘
```
