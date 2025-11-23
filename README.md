# 🎓 Certunivertity
### Certificados Universitarios Verificables en Blockchain (MVP – Demo Técnica 2025)

Certunivertity es un sistema de demostración que permite a universidades **emitir certificados digitales verificables** mediante la red **Sepolia** de Ethereum.
Utiliza un token propio llamado **CertUni** que representa **créditos de firma**:

> **1 CertUni = 1 certificado emitido**

Este proyecto combina:

- **Next.js** (landing + dashboard)
- **PostgreSQL** (vía Docker, puerto 5334)
- **Ethereum Sepolia** (smart contracts en Solidity)
- **Integración Web3 (ethers.js)**
- **Meta-Transacciones Relayed (gasless)**
- **Diseño SaaS realista para instituciones educativas**

---

## 🧩 Mecanismo de Meta-Transacciones (Gasless)

Este sistema utiliza el patrón de **meta-transacciones relayed**:

> "El usuario **firma** una autorización en MetaMask (sin gas).
> El backend **envía la transacción** a la blockchain como relayer.
> El contrato **verifica la firma** y ejecuta la acción en nombre del usuario."

### Beneficios:

- **MetaMask pide confirmación** → el usuario controla la autorización.
- **No paga gas** → el Sistema lo paga usando su wallet admin.
- **El certificado queda emitido con la dirección real de la universidad.**
- **Seguro** → La firma se verifica con ECDSA (`ecrecover`).
- **UX perfecta** → ni el usuario ni MetaMask necesitan ETH.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- MetaMask instalado
- Una cuenta de Sepolia con ETH de prueba (para el backend)

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd certunivertity
```

2. **Iniciar la base de datos**
```bash
docker-compose up -d
```

3. **Configurar el proyecto de contratos**
```bash
cd contracts
npm install
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Desplegar contratos en Sepolia**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

5. **Configurar el proyecto web**
```bash
cd ../web
npm install
cp .env.example .env.local
# Editar .env.local con las direcciones de los contratos
```

6. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

---

## 📁 Estructura del Proyecto

```
certunivertity/
├── contracts/           # Smart contracts Solidity
│   ├── CertUniToken.sol
│   ├── CertificateAuthority.sol
│   └── scripts/
├── web/                 # Aplicación Next.js
│   ├── app/
│   ├── components/
│   └── lib/
├── docs/                # Documentación
└── docker-compose.yml   # PostgreSQL
```

---

## 🔑 Variables de Entorno

### Contratos (`contracts/.env`)
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key
```

### Web (`web/.env.local`)
```
DATABASE_URL=postgres://certuni_user:certuni_password@localhost:5334/certunivertity_db
NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS=0x...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BACKEND_PRIVATE_KEY=your_backend_private_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 🦊 Integración con MetaMask

Cada universidad registra una **dirección de wallet Ethereum (MetaMask)** en la red **Sepolia**.

### Cómo vincular MetaMask

1. Instala MetaMask en tu navegador
2. Cambia la red a **Sepolia Test Network**
3. Copia tu dirección (0x...)
4. Pégala en el formulario de registro

### Ver tus CertUni en MetaMask

Después de reclamar los 5 créditos de prueba:

1. Abre MetaMask
2. Haz clic en **"Import Token"**
3. Pega la dirección del contrato `CertUniToken`
4. Verás tu balance de **5 CERTUNI**

---

## 🔄 Flujo de Emisión de Certificado

1. Universidad llena el formulario del certificado
2. Frontend genera un payload EIP-712
3. MetaMask pide **Firmar** (solo firma, no transacción)
4. Frontend envía datos + firma al backend
5. Backend valida créditos y envía transacción a blockchain
6. Contrato verifica firma con `ecrecover` y emite certificado

---

## 📜 Licencia

MVP de demostración para uso educativo y portfolio personal.

---

## 📞 Soporte

Para reportar problemas o hacer preguntas, abre un issue en el repositorio.
