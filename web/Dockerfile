# ==========================================
# Dockerfile optimizado para Dokploy
# ==========================================

# Etapa 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incluyendo dev) para el build
RUN npm ci

# Etapa 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# URL dummy para Prisma durante el build (no se usa realmente)
# La URL real se proporciona en runtime vía variables de entorno de Dokploy
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generar Prisma Client
RUN npx prisma generate

# Build de Next.js en modo standalone
RUN npm run build

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

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar el build standalone de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Prisma Client generado
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copiar schema de Prisma para migraciones
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copiar package.json para tener acceso a scripts si es necesario
COPY --from=builder /app/package.json ./package.json

# Copiar script de inicio
COPY --from=builder --chmod=755 /app/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3031

# Health check para Dokploy
# start-period aumentado a 60s para dar tiempo a que Next.js arranque completamente
# timeout aumentado a 10s para dar tiempo a Prisma a conectarse a la DB
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3030/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)}).on('error', () => {throw new Error('Connection failed')})"

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Comando de inicio
CMD ["node", "server.js"]
