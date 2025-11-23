# 🚀 Quick Start - Certunivertity

Guía rápida para tener Certunivertity corriendo en 10 minutos.

---

## Prerequisitos Rápidos

✅ Node.js 18+ instalado
✅ Docker instalado y corriendo
✅ MetaMask instalado en el navegador
✅ ~0.1 ETH de Sepolia testnet

---

## Paso 1: Obtener ETH de Sepolia (2 min)

```bash
# Visita uno de estos faucets:
# https://sepoliafaucet.com/
# https://www.alchemy.com/faucets/ethereum-sepolia

# Conecta tu wallet y solicita ETH
```

---

## Paso 2: Levantar PostgreSQL (1 min)

```bash
# En la raíz del proyecto
docker-compose up -d

# Verificar que funciona
docker ps
```

---

## Paso 3: Desplegar Contratos (3 min)

```bash
cd contracts

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
nano .env
```

**Edita `.env`:**
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_INFURA_KEY
DEPLOYER_PRIVATE_KEY=tu_clave_privada_sin_0x
```

**Desplegar:**
```bash
npm run deploy:sepolia

# ✅ Copia las direcciones que aparecen:
# CertUniToken: 0x...
# CertificateAuthority: 0x...
```

---

## Paso 4: Configurar Frontend (2 min)

```bash
cd ../web

# Instalar dependencias
npm install

# Configurar .env.local
cp .env.example .env.local
nano .env.local
```

**Edita `.env.local` con las direcciones del paso anterior:**
```bash
DATABASE_URL=postgres://certuni_user:certuni_password@localhost:5334/certunivertity_db

NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS=0x... # Del paso 3
NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS=0x... # Del paso 3

SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_INFURA_KEY
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_INFURA_KEY

BACKEND_PRIVATE_KEY=tu_clave_privada_del_backend_sin_0x

NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Paso 5: Ejecutar (1 min)

```bash
# Desde web/
npm run dev

# Abre http://localhost:3000
```

---

## 🧪 Probar (1 min)

### Ver la Landing
1. Abre [http://localhost:3000](http://localhost:3000)
2. Deberías ver la landing de Certunivertity

---

## ⚠️ Troubleshooting Express

### PostgreSQL no se conecta
```bash
# Verificar que está corriendo
docker ps

# Reiniciar
docker-compose restart

# Ver logs
docker logs certunivertity_postgres
```

### Error "Contract not deployed"
- Verifica que copiaste bien las direcciones en `.env.local`
- Revisa `contracts/deployments/sepolia.json`

### Error "Insufficient funds"
- Tu wallet necesita más ETH de Sepolia
- Visita el faucet de nuevo

### MetaMask no conecta
- Verifica que estés en Sepolia Network
- Refresca la página

---

## 📚 Siguientes Pasos

Una vez que tengas todo corriendo:

1. **Lee la arquitectura**: [docs/arquitectura.md](docs/arquitectura.md)
2. **Entiende el modelo**: [docs/modelo-certificado.md](docs/modelo-certificado.md)
3. **Implementa las páginas faltantes** (ver PROJECT_SUMMARY.md)

---

## 🎯 Lo que Funciona Ahora

✅ Contratos desplegados en Sepolia
✅ PostgreSQL corriendo
✅ Landing page visible
✅ Utilities de blockchain y DB listas
✅ EIP-712 signing implementado

---

## 🔴 Lo que Falta

❌ Registro de universidades (necesitas crear `/register`)
❌ Login (necesitas crear `/login`)
❌ Dashboard (necesitas crear `/dashboard`)
❌ Emisión de certificados (necesitas crear API routes)
❌ Verificación (necesitas crear `/verify`)

**Ver [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) para detalles.**

---

## 💡 Comandos Útiles

```bash
# Ver logs de PostgreSQL
docker logs -f certunivertity_postgres

# Conectar a PostgreSQL manualmente
docker exec -it certunivertity_postgres psql -U certuni_user -d certunivertity_db

# Recompilar contratos
cd contracts && npm run compile

# Verificar contrato en Etherscan
cd contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Reiniciar todo
docker-compose down && docker-compose up -d
cd web && npm run dev
```

---

## 🆘 Ayuda

- **Documentación completa**: Ver carpeta `docs/`
- **Estructura del proyecto**: Ver [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Deployment detallado**: Ver [docs/guia-deployment.md](docs/guia-deployment.md)

---

¡Listo! 🎉 Ahora tienes la base de Certunivertity corriendo.
