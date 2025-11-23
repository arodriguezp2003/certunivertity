# Guía de Deployment - Certunivertity

## Requisitos Previos

### Software Necesario
- Node.js 18+ instalado
- Docker y Docker Compose instalados
- Git instalado
- MetaMask extension instalada en el navegador

### Cuentas y Servicios
- Cuenta en Infura o Alchemy (para RPC de Sepolia)
- Wallet con ETH de Sepolia testnet (~0.1 ETH recomendado)
- Cuenta de Etherscan (opcional, para verificación de contratos)

---

## Paso 1: Obtener ETH de Sepolia Testnet

### Opción A: Faucets Públicos
1. Visita uno de estos faucets:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

2. Conecta tu wallet de MetaMask
3. Solicita 0.1 ETH de Sepolia
4. Espera confirmación (1-2 minutos)

### Opción B: Bridging desde mainnet (requiere ETH real)
1. Usa un bridge oficial si tienes ETH en mainnet
2. No recomendado para testing

---

## Paso 2: Clonar y Configurar el Proyecto

```bash
# Clonar el repositorio
git clone <repository-url>
cd certunivertity

# Estructura del proyecto
tree -L 1
# certunivertity/
# ├── contracts/
# ├── web/
# ├── docs/
# ├── docker-compose.yml
# └── README.md
```

---

## Paso 3: Levantar la Base de Datos

```bash
# Iniciar PostgreSQL en Docker
docker-compose up -d

# Verificar que está corriendo
docker ps
# Deberías ver: certunivertity_postgres

# Probar conexión
docker exec -it certunivertity_postgres psql -U certuni_user -d certunivertity_db
# Si conecta, escribe \q para salir
```

### Troubleshooting
- **Error: port 5334 already in use**
  - Cambia el puerto en `docker-compose.yml` línea 8
  - Actualiza también `DATABASE_URL` en `.env.local`

- **Error: permission denied**
  - Ejecuta `sudo docker-compose up -d`

---

## Paso 4: Desplegar Smart Contracts

```bash
cd contracts

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

### Contenido de `contracts/.env`
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_INFURA_PROJECT_ID
DEPLOYER_PRIVATE_KEY=tu_clave_privada_sin_0x
ETHERSCAN_API_KEY=tu_api_key_de_etherscan
```

⚠️ **IMPORTANTE**:
- La clave privada debe tener ETH de Sepolia
- Nunca subas el archivo `.env` a GitHub
- Usa una wallet de testing, no tu wallet principal

### Compilar y Desplegar

```bash
# Compilar contratos
npm run compile

# Verificar que compiló correctamente
ls artifacts/contracts/

# Desplegar a Sepolia
npm run deploy:sepolia

# Output esperado:
# ✅ CertUniToken deployed to: 0xABC...
# ✅ CertificateAuthority deployed to: 0xDEF...
```

### Guardar las Direcciones
Copia las direcciones de los contratos desplegados. Las necesitarás en el siguiente paso.

```bash
# Las direcciones también se guardan en:
cat deployments/sepolia.json
```

### Verificar Contratos en Etherscan (Opcional)

```bash
# CertUniToken
npx hardhat verify --network sepolia <DIRECCION_CERTUNI_TOKEN>

# CertificateAuthority
npx hardhat verify --network sepolia <DIRECCION_CERTIFICATE_AUTHORITY>
```

---

## Paso 5: Configurar el Frontend

```bash
cd ../web

# Instalar dependencias
npm install

# Crear archivo .env.local
cp .env.example .env.local

# Editar .env.local
nano .env.local
```

### Contenido de `web/.env.local`

```bash
# Database
DATABASE_URL=postgres://certuni_user:certuni_password@localhost:5334/certunivertity_db

# Smart Contract Addresses (usa las direcciones del paso 4)
NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS=0xABC...
NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS=0xDEF...

# Blockchain RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_INFURA_PROJECT_ID
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_INFURA_PROJECT_ID

# Backend Wallet (la misma que desplegó los contratos, o una diferente con ETH)
BACKEND_PRIVATE_KEY=tu_clave_privada_del_backend_sin_0x

# NextAuth (genera un secreto)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generar NEXTAUTH_SECRET

```bash
# En Mac/Linux
openssl rand -base64 32

# Copia el output y pégalo en .env.local
```

---

## Paso 6: Inicializar la Base de Datos

El schema se crea automáticamente la primera vez que ejecutas la aplicación, pero puedes hacerlo manualmente:

```bash
# Crear un script de inicialización (opcional)
# La app lo hará automáticamente en el primer run
```

---

## Paso 7: Ejecutar el Proyecto

```bash
# Desde la carpeta web/
npm run dev

# Output esperado:
# ▲ Next.js 15.1.0
# - Local:        http://localhost:3000
# - Environments: .env.local
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000)

---

## Paso 8: Probar el Flujo Completo

### 8.1 Registrar una Universidad

1. Haz clic en "Comenzar Gratis"
2. Completa el formulario:
   - Nombre: Universidad de Prueba
   - Email: test@universidad.edu
   - Password: Test1234!
   - Wallet: Tu dirección de MetaMask en Sepolia
3. Haz clic en "Registrar"
4. Deberías ser redirigido al dashboard

### 8.2 Obtener Créditos Gratuitos

1. En el dashboard, haz clic en "Obtener 5 créditos de prueba"
2. Espera la confirmación de la transacción
3. Tu balance debería cambiar a 5 CERTUNI
4. El botón debería deshabilitarse

### 8.3 Ver Tokens en MetaMask

1. Abre MetaMask
2. Asegúrate de estar en Sepolia
3. Haz clic en "Import tokens"
4. Pega la dirección del contrato CertUniToken
5. Deberías ver 5.00 CERTUNI

### 8.4 Emitir un Certificado

1. En el dashboard, haz clic en "Emitir Certificado"
2. Completa:
   - Nombre: Juan Pérez
   - Email: juan.perez@estudiante.edu
   - Certificado: Ingeniería en Informática
   - Expiración: (opcional)
3. Haz clic en "Firmar y Emitir"
4. MetaMask se abrirá pidiendo que **firmes** (no envíes transacción)
5. Acepta la firma
6. Espera confirmación
7. Deberías ver el certificado en el historial
8. Tu balance debería ser 4 CERTUNI

### 8.5 Verificar el Certificado

1. Copia el `certId` del certificado emitido
2. Abre `http://localhost:3000/verify?certId=<CERT_ID>`
3. Deberías ver:
   - Estado: ✅ Válido
   - Universidad emisora
   - Nombre del certificado
   - Fecha de emisión

---

## Troubleshooting Común

### Error: "Network not supported"
- Verifica que MetaMask esté en Sepolia
- Verifica que `NEXT_PUBLIC_SEPOLIA_RPC_URL` esté configurado

### Error: "Insufficient funds for gas"
- Tu `BACKEND_PRIVATE_KEY` no tiene ETH de Sepolia
- Consigue más ETH del faucet

### Error: "Contract not deployed"
- Verifica las direcciones en `.env.local`
- Asegúrate de que los contratos se desplegaron correctamente
- Revisa `contracts/deployments/sepolia.json`

### Error: "Database connection failed"
- Verifica que Docker esté corriendo: `docker ps`
- Verifica el puerto 5334: `lsof -i :5334`
- Reinicia el contenedor: `docker-compose restart`

### Error: "Invalid signature"
- Verifica que la wallet que firma sea la misma registrada
- Verifica que el `chainId` sea 11155111 (Sepolia)

### MetaMask no pide firma
- Verifica que MetaMask esté conectado al sitio
- Revisa la consola del navegador para errores
- Asegúrate de estar en Sepolia

---

## Deployment a Producción (Futuro)

### Opción A: Vercel + Serverless PostgreSQL

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel

# Configurar variables de entorno en Vercel dashboard
# Usar PostgreSQL de Vercel, Supabase, o Railway
```

### Opción B: VPS (AWS, DigitalOcean)

```bash
# Conectar a tu VPS
ssh user@your-server.com

# Clonar repo
git clone <repo-url>
cd certunivertity

# Usar Docker Compose para todo
docker-compose -f docker-compose.prod.yml up -d

# Configurar Nginx como reverse proxy
```

### Opción C: Render / Railway

1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno
3. Deploy automático con cada push

---

## Seguridad en Producción

### ⚠️ CRÍTICO:

1. **Nunca expongas claves privadas**
   - Usa variables de entorno
   - Usa servicios como AWS Secrets Manager

2. **Usa HTTPS**
   - Let's Encrypt gratuito
   - Cloudflare para protección DDoS

3. **Rate limiting**
   - Limita requests a API routes
   - Usa Redis para tracking

4. **Validación de inputs**
   - Siempre valida en backend
   - Usa Zod o similar

5. **Logging y monitoreo**
   - Sentry para errores
   - Datadog / New Relic para performance

6. **Backups de DB**
   - Backups automáticos diarios
   - Test de restauración mensual

---

## Migración a Mainnet

### Consideraciones:

1. **Costos de gas**:
   - Emisión de certificado: ~150,000 gas
   - A $30/ETH y 20 gwei: ~$0.09 por certificado
   - Multiplica por tu volumen esperado

2. **L2 alternativas**:
   - Polygon: ~1000x más barato
   - Arbitrum: ~100x más barato
   - Optimism: ~100x más barato

3. **Auditoría de contratos**:
   - Contratar auditoría profesional
   - OpenZeppelin, CertiK, etc.

4. **Testing extensivo**:
   - Unit tests con Hardhat
   - Integration tests
   - Testnet durante 1-2 meses

---

## Mantenimiento

### Tareas Semanales
- Revisar logs de errores
- Monitorear costos de gas
- Backup de base de datos

### Tareas Mensuales
- Actualizar dependencias de npm
- Revisar vulnerabilidades: `npm audit`
- Analizar métricas de uso

### Tareas Trimestrales
- Auditoría de seguridad
- Optimización de costos
- Actualización de documentación

---

## Recursos Adicionales

- [Documentación de Hardhat](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Sepolia Faucets](https://sepoliafaucet.com/)

---

## Soporte

Para preguntas o problemas:
1. Revisa los logs: `docker logs certunivertity_postgres`
2. Revisa la consola del navegador (F12)
3. Verifica transacciones en Sepolia Etherscan
4. Abre un issue en el repositorio de GitHub

---

¡Felicidades! 🎉 Ahora tienes Certunivertity corriendo localmente.
