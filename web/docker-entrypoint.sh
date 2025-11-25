#!/bin/sh
set -e

echo "🚀 Starting POS application..."

# Ejecutar migraciones de Prisma
echo "📦 Running Prisma migrations..."



echo "✅ Initialization complete. Starting Next.js..."

# Iniciar la aplicación
exec "$@"
