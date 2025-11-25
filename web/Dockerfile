# ==========================================
# Dockerfile optimizado para Dokploy
# ==========================================

# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar TODAS las dependencias (incluyendo dev) para el build
RUN pnpm install --no-frozen-lockfile

# Etapa 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Copiar package.json primero para las dependencias
COPY package.json pnpm-lock.yaml* ./

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar el resto del código
COPY . .

# Variables de entorno necesarias para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de Next.js en modo standalone
RUN pnpm run build

# Etapa 3: Runner (Producción)
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3031
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar el build standalone de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar package.json para tener acceso a scripts si es necesario
COPY --from=builder /app/package.json ./package.json

# Copiar script de inicio
COPY --from=builder --chmod=755 /app/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3031

# Health check para Dokploy - verificar que el servidor responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3031/', (r) => {if (r.statusCode >= 400) throw new Error(r.statusCode)}).on('error', (e) => {throw e})"

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Comando de inicio
CMD ["node", "server.js"]
