BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Rol] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nombre] VARCHAR(50) NOT NULL,
    CONSTRAINT [Rol_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Rol_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Permiso] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nombre] VARCHAR(100) NOT NULL,
    [descripcion] VARCHAR(255),
    CONSTRAINT [Permiso_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permiso_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[RolPermiso] (
    [rolId] UNIQUEIDENTIFIER NOT NULL,
    [permisoId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [RolPermiso_pkey] PRIMARY KEY CLUSTERED ([rolId],[permisoId])
);

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nombre] VARCHAR(150) NOT NULL,
    [email] VARCHAR(255) NOT NULL,
    [passwordHash] VARCHAR(255) NOT NULL,
    [rolId] UNIQUEIDENTIFIER NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [Usuario_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Usuario_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Usuario_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Usuario_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Evento] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nombre] VARCHAR(150) NOT NULL,
    [descripcion] VARCHAR(1000),
    [fecha] DATETIME2 NOT NULL,
    [lugar] VARCHAR(255),
    [logoUrl] VARCHAR(500),
    [imagenFondoUrl] VARCHAR(500),
    [estado] VARCHAR(20) NOT NULL,
    [precioBase] DECIMAL(10,2),
    [creadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Evento_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Evento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Venta] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [eventoId] UNIQUEIDENTIFIER NOT NULL,
    [nombreComprador] VARCHAR(150) NOT NULL,
    [email] VARCHAR(255),
    [cantidadPersonas] INT NOT NULL,
    [montoTotal] DECIMAL(10,2),
    [registradoPorId] UNIQUEIDENTIFIER NOT NULL,
    [fechaCompra] DATETIME2 NOT NULL CONSTRAINT [Venta_fechaCompra_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Venta_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Boleto] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [folio] VARCHAR(30) NOT NULL,
    [ventaId] UNIQUEIDENTIFIER NOT NULL,
    [eventoId] UNIQUEIDENTIFIER NOT NULL,
    [tokenValidacionHash] VARCHAR(255) NOT NULL,
    [personasCompradas] INT NOT NULL,
    [personasIngresadas] INT NOT NULL CONSTRAINT [Boleto_personasIngresadas_df] DEFAULT 0,
    [estado] VARCHAR(30) NOT NULL,
    [pdfUrl] VARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Boleto_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Boleto_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Boleto_folio_key] UNIQUE NONCLUSTERED ([folio]),
    CONSTRAINT [Boleto_ventaId_key] UNIQUE NONCLUSTERED ([ventaId]),
    CONSTRAINT [Boleto_tokenValidacionHash_key] UNIQUE NONCLUSTERED ([tokenValidacionHash])
);

-- CreateTable
CREATE TABLE [dbo].[Escaneo] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [boletoId] UNIQUEIDENTIFIER NOT NULL,
    [escaneadorId] UNIQUEIDENTIFIER NOT NULL,
    [personasIngresadasEnEsteEscaneo] INT NOT NULL,
    [resultado] VARCHAR(30) NOT NULL,
    [fechaHora] DATETIME2 NOT NULL CONSTRAINT [Escaneo_fechaHora_df] DEFAULT CURRENT_TIMESTAMP,
    [ipAddress] VARCHAR(45),
    [deviceInfo] VARCHAR(255),
    CONSTRAINT [Escaneo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Configuracion] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [eventoId] UNIQUEIDENTIFIER,
    [clave] VARCHAR(100) NOT NULL,
    [valor] VARCHAR(1000),
    CONSTRAINT [Configuracion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Configuracion_eventoId_clave_key] UNIQUE NONCLUSTERED ([eventoId],[clave])
);

-- CreateTable
CREATE TABLE [dbo].[BitacoraAuditoria] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [usuarioId] UNIQUEIDENTIFIER,
    [accion] VARCHAR(100) NOT NULL,
    [entidadAfectada] VARCHAR(50) NOT NULL,
    [entidadId] UNIQUEIDENTIFIER,
    [detalles] NVARCHAR(max),
    [fechaHora] DATETIME2 NOT NULL CONSTRAINT [BitacoraAuditoria_fechaHora_df] DEFAULT CURRENT_TIMESTAMP,
    [ipAddress] VARCHAR(45),
    CONSTRAINT [BitacoraAuditoria_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Usuario_rolId_idx] ON [dbo].[Usuario]([rolId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Evento_estado_idx] ON [dbo].[Evento]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Venta_eventoId_idx] ON [dbo].[Venta]([eventoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Venta_fechaCompra_idx] ON [dbo].[Venta]([fechaCompra]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Boleto_eventoId_idx] ON [dbo].[Boleto]([eventoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Boleto_estado_idx] ON [dbo].[Boleto]([estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Escaneo_boletoId_idx] ON [dbo].[Escaneo]([boletoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Escaneo_escaneadorId_idx] ON [dbo].[Escaneo]([escaneadorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Escaneo_fechaHora_idx] ON [dbo].[Escaneo]([fechaHora]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BitacoraAuditoria_entidadAfectada_entidadId_idx] ON [dbo].[BitacoraAuditoria]([entidadAfectada], [entidadId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BitacoraAuditoria_fechaHora_idx] ON [dbo].[BitacoraAuditoria]([fechaHora]);

-- AddForeignKey
ALTER TABLE [dbo].[RolPermiso] ADD CONSTRAINT [RolPermiso_rolId_fkey] FOREIGN KEY ([rolId]) REFERENCES [dbo].[Rol]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolPermiso] ADD CONSTRAINT [RolPermiso_permisoId_fkey] FOREIGN KEY ([permisoId]) REFERENCES [dbo].[Permiso]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_rolId_fkey] FOREIGN KEY ([rolId]) REFERENCES [dbo].[Rol]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Evento] ADD CONSTRAINT [Evento_creadoPorId_fkey] FOREIGN KEY ([creadoPorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_eventoId_fkey] FOREIGN KEY ([eventoId]) REFERENCES [dbo].[Evento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Venta] ADD CONSTRAINT [Venta_registradoPorId_fkey] FOREIGN KEY ([registradoPorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Boleto] ADD CONSTRAINT [Boleto_ventaId_fkey] FOREIGN KEY ([ventaId]) REFERENCES [dbo].[Venta]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Boleto] ADD CONSTRAINT [Boleto_eventoId_fkey] FOREIGN KEY ([eventoId]) REFERENCES [dbo].[Evento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Escaneo] ADD CONSTRAINT [Escaneo_boletoId_fkey] FOREIGN KEY ([boletoId]) REFERENCES [dbo].[Boleto]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Escaneo] ADD CONSTRAINT [Escaneo_escaneadorId_fkey] FOREIGN KEY ([escaneadorId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Configuracion] ADD CONSTRAINT [Configuracion_eventoId_fkey] FOREIGN KEY ([eventoId]) REFERENCES [dbo].[Evento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BitacoraAuditoria] ADD CONSTRAINT [BitacoraAuditoria_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

