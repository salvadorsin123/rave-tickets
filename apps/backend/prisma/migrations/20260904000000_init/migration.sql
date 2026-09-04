-- CreateTable
CREATE TABLE "Rol" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "rolId" UUID NOT NULL,
    "permisoId" UUID NOT NULL,

    CONSTRAINT "RolPermiso_pkey" PRIMARY KEY ("rolId","permisoId")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "rolId" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" VARCHAR(1000),
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" VARCHAR(255),
    "logoUrl" VARCHAR(500),
    "imagenFondoUrl" VARCHAR(500),
    "estado" VARCHAR(20) NOT NULL,
    "precioBase" DECIMAL(10,2),
    "creadoPorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" UUID NOT NULL,
    "eventoId" UUID NOT NULL,
    "nombreComprador" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "cantidadPersonas" INTEGER NOT NULL,
    "montoTotal" DECIMAL(10,2),
    "registradoPorId" UUID NOT NULL,
    "fechaCompra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boleto" (
    "id" UUID NOT NULL,
    "folio" VARCHAR(30) NOT NULL,
    "ventaId" UUID NOT NULL,
    "eventoId" UUID NOT NULL,
    "tokenValidacionHash" VARCHAR(255) NOT NULL,
    "personasCompradas" INTEGER NOT NULL,
    "personasIngresadas" INTEGER NOT NULL DEFAULT 0,
    "estado" VARCHAR(30) NOT NULL,
    "pdfUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boleto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escaneo" (
    "id" UUID NOT NULL,
    "boletoId" UUID NOT NULL,
    "escaneadorId" UUID NOT NULL,
    "personasIngresadasEnEsteEscaneo" INTEGER NOT NULL,
    "resultado" VARCHAR(30) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'Entrada',
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "deviceInfo" VARCHAR(255),

    CONSTRAINT "Escaneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" UUID NOT NULL,
    "eventoId" UUID,
    "clave" VARCHAR(100) NOT NULL,
    "valor" VARCHAR(1000),

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitacoraAuditoria" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "accion" VARCHAR(100) NOT NULL,
    "entidadAfectada" VARCHAR(50) NOT NULL,
    "entidadId" UUID,
    "detalles" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45),

    CONSTRAINT "BitacoraAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_nombre_key" ON "Permiso"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rolId_idx" ON "Usuario"("rolId");

-- CreateIndex
CREATE INDEX "Evento_estado_idx" ON "Evento"("estado");

-- CreateIndex
CREATE INDEX "Venta_eventoId_idx" ON "Venta"("eventoId");

-- CreateIndex
CREATE INDEX "Venta_fechaCompra_idx" ON "Venta"("fechaCompra");

-- CreateIndex
CREATE UNIQUE INDEX "Boleto_folio_key" ON "Boleto"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Boleto_ventaId_key" ON "Boleto"("ventaId");

-- CreateIndex
CREATE UNIQUE INDEX "Boleto_tokenValidacionHash_key" ON "Boleto"("tokenValidacionHash");

-- CreateIndex
CREATE INDEX "Boleto_eventoId_idx" ON "Boleto"("eventoId");

-- CreateIndex
CREATE INDEX "Boleto_estado_idx" ON "Boleto"("estado");

-- CreateIndex
CREATE INDEX "Escaneo_boletoId_idx" ON "Escaneo"("boletoId");

-- CreateIndex
CREATE INDEX "Escaneo_escaneadorId_idx" ON "Escaneo"("escaneadorId");

-- CreateIndex
CREATE INDEX "Escaneo_fechaHora_idx" ON "Escaneo"("fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_eventoId_clave_key" ON "Configuracion"("eventoId", "clave");

-- CreateIndex
CREATE INDEX "BitacoraAuditoria_entidadAfectada_entidadId_idx" ON "BitacoraAuditoria"("entidadAfectada", "entidadId");

-- CreateIndex
CREATE INDEX "BitacoraAuditoria_fechaHora_idx" ON "BitacoraAuditoria"("fechaHora");

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RolPermiso" ADD CONSTRAINT "RolPermiso_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "Permiso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Boleto" ADD CONSTRAINT "Boleto_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Boleto" ADD CONSTRAINT "Boleto_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Escaneo" ADD CONSTRAINT "Escaneo_boletoId_fkey" FOREIGN KEY ("boletoId") REFERENCES "Boleto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Escaneo" ADD CONSTRAINT "Escaneo_escaneadorId_fkey" FOREIGN KEY ("escaneadorId") REFERENCES "Usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BitacoraAuditoria" ADD CONSTRAINT "BitacoraAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

