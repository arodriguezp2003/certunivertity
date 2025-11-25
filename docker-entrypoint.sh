#!/bin/sh
set -e

echo "🚀 Starting POS application..."

# Ejecutar migraciones de Prisma
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy



echo "✅ Initialization complete. Starting Next.js..."

# Iniciar la aplicación
exec "$@"
