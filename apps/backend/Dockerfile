# syntax=docker/dockerfile:1

# ---- deps: instala TODAS las dependencias (incluye devDependencies, necesarias para el build) ----
FROM node:20-bookworm-slim AS deps
# El motor de Prisma (schema/query engine) necesita libssl/openssl; "bookworm-slim" no lo trae.
# ca-certificates es necesario para validar el certificado TLS de Azure SQL al conectar
# (sin esto, prisma falla con P1011 "unable to get local issuer certificate").
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && update-ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: genera el cliente Prisma y compila TypeScript -> dist/ ----
FROM deps AS build
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- runtime: imagen de produccion, solo dependencias de produccion + artefactos compilados ----
FROM node:20-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && update-ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
# `prisma` quedo como dependencia de produccion (ver package.json) porque docker-entrypoint.sh
# necesita el CLI en runtime para `prisma migrate deploy`.
RUN npm ci --omit=dev && npm cache clean --force

# El cliente generado en la etapa "build" sobrescribe el que `npm ci` pudo regenerar via
# postinstall, garantizando que coincide exactamente con el schema compilado en build.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh \
  && groupadd --system nestjs \
  && useradd --system --gid nestjs --no-create-home nestjs \
  && chown -R nestjs:nestjs /app

USER nestjs
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
