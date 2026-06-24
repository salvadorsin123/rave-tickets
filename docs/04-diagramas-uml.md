# Diagramas UML

## 1. Diagrama de componentes (Clean Architecture)

```mermaid
graph TD
    subgraph Presentation
        C[Controllers]
        G[Guards]
        F[Filters/Pipes]
    end
    subgraph Application
        UC[Use Cases]
        P[Ports / Interfaces]
        D[DTOs]
    end
    subgraph Domain
        E[Entities]
        VO[Value Objects]
        EN[Enums]
    end
    subgraph Infrastructure
        PR[Prisma Repositories]
        BLOB[Azure Blob Storage]
        PDF[PDFKit Generator]
        QR[QR Generator]
        JWT[JWT/Bcrypt]
    end

    C --> UC
    G --> UC
    UC --> P
    UC --> D
    UC --> E
    PR -.implementa.-> P
    BLOB -.implementa.-> P
    PDF -.implementa.-> P
    QR -.implementa.-> P
    JWT -.implementa.-> P
    E --> VO
    E --> EN
```

## 2. Diagrama de clases (dominio simplificado)

```mermaid
classDiagram
    class Usuario {
        +UUID id
        +string nombre
        +string email
        +string passwordHash
        +Rol rol
        +boolean activo
    }
    class Rol {
        +UUID id
        +string nombre
        +Permiso[] permisos
    }
    class Permiso {
        +UUID id
        +string nombre
    }
    class Evento {
        +UUID id
        +string nombre
        +Date fecha
        +string lugar
        +EstadoEvento estado
        +cerrar()
        +duplicarConfiguracion(Evento destino)
    }
    class Venta {
        +UUID id
        +string nombreComprador
        +string email
        +int cantidadPersonas
        +Date fechaCompra
    }
    class Boleto {
        +UUID id
        +string folio
        +string tokenValidacionHash
        +int personasCompradas
        +int personasIngresadas
        +EstadoBoleto estado
        +registrarIngreso(int cantidad)
        +cancelar()
        +reembolsar()
        +bloquearPorFraude()
    }
    class Escaneo {
        +UUID id
        +int personasIngresadasEnEsteEscaneo
        +ResultadoEscaneo resultado
        +Date fechaHora
    }

    Usuario "1" --> "1" Rol
    Rol "1" --> "*" Permiso
    Evento "1" --> "*" Venta
    Venta "1" --> "1" Boleto
    Boleto "1" --> "*" Escaneo
    Usuario "1" --> "*" Evento : crea
    Usuario "1" --> "*" Escaneo : realiza
```

## 3. Diagrama de secuencia — Registrar venta y generar boleto (UC-06 → UC-29)

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant API as SalesController
    participant UC as RegistrarVentaUseCase
    participant Repo as VentaRepository
    participant TicketUC as GenerarBoletoUseCase
    participant PDF as PDFGenerator
    participant QR as QRGenerator
    participant Blob as AzureBlobStorage
    participant DB as AzureSQL

    Admin->>FE: Completa formulario de venta
    FE->>API: POST /api/v1/ventas
    API->>UC: execute(dto)
    UC->>Repo: crear Venta
    Repo->>DB: INSERT Venta
    UC->>TicketUC: execute(venta)
    TicketUC->>TicketUC: generar folio + UUID + token
    TicketUC->>QR: generar QR({uuid, token})
    TicketUC->>PDF: generar PDF(boleto, QR, datos evento)
    TicketUC->>Blob: guardar PDF
    Blob-->>TicketUC: pdfUrl
    TicketUC->>DB: INSERT Boleto (estado=Pendiente)
    DB-->>TicketUC: boleto creado
    TicketUC-->>UC: boleto
    UC-->>API: VentaConBoletoDTO
    API-->>FE: 201 Created {venta, boleto, pdfUrl}
    FE-->>Admin: Muestra confirmación + botón descargar PDF
```

## 4. Diagrama de secuencia — Escanear y validar QR (UC-25 → UC-27)

```mermaid
sequenceDiagram
    actor Scanner as Escaneador
    participant FE as App Escaneo (móvil/web)
    participant API as ScansController
    participant UC as ValidarEntradaUseCase
    participant Repo as BoletoRepository
    participant Audit as AuditService

    Scanner->>FE: Escanea QR con cámara
    FE->>API: POST /api/v1/escaneos {uuid, token}
    API->>UC: execute(uuid, token, escaneadorId)
    UC->>Repo: buscar Boleto por uuid
    alt Boleto no existe
        UC-->>API: QR_NO_VALIDO
        API-->>FE: 404 {resultado: invalido}
        FE-->>Scanner: Pantalla roja "QR NO VÁLIDO"
    else Token no coincide (hash)
        UC-->>API: QR_NO_VALIDO
        API-->>FE: 404 {resultado: invalido}
        FE-->>Scanner: Pantalla roja "QR NO VÁLIDO"
    else Estado = Utilizado y sin cupo
        UC-->>API: YA_UTILIZADA
        API-->>FE: 409 {primerIngreso, escaneador}
        FE-->>Scanner: Pantalla roja "YA FUE UTILIZADA"
    else Válido (con cupo disponible)
        UC->>Repo: incrementar personasIngresadas (transacción)
        UC->>Repo: actualizar estado boleto
        UC->>Audit: registrar escaneo + bitácora
        UC-->>API: VALIDO {comprador, cantidad, fechaCompra}
        API-->>FE: 200 {resultado: valido, datos}
        FE-->>Scanner: Pantalla verde + vibración "ENTRADA VÁLIDA"
    end
```

## 5. Diagrama de estados — Boleto

```mermaid
stateDiagram-v2
    [*] --> Pendiente: Venta registrada
    Pendiente --> ParcialmenteUtilizado: Ingreso parcial
    Pendiente --> Utilizado: Ingreso completo
    ParcialmenteUtilizado --> ParcialmenteUtilizado: Ingreso parcial adicional
    ParcialmenteUtilizado --> Utilizado: Completa el total
    Pendiente --> Cancelado: Admin cancela
    Pendiente --> Reembolsado: Admin reembolsa
    Pendiente --> BloqueadoPorFraude: Fraude detectado
    ParcialmenteUtilizado --> BloqueadoPorFraude: Fraude detectado
    Utilizado --> [*]
    Cancelado --> [*]
    Reembolsado --> [*]
    BloqueadoPorFraude --> [*]
```
