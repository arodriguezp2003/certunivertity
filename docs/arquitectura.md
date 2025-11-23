# Arquitectura de Certunivertity

## Visión General

Certunivertity es un sistema completo de certificados universitarios verificables en blockchain que utiliza **meta-transacciones gasless** para ofrecer una experiencia de usuario sin fricciones.

## Componentes Principales

### 1. Smart Contracts (Ethereum Sepolia)

#### CertUniToken (ERC-20)
- **Propósito**: Token que representa créditos de emisión de certificados
- **Ratio**: 1 CERTUNI = 1 certificado que puede emitirse
- **Funciones principales**:
  - `mintFor(address, uint256)`: Solo el owner puede mintear tokens
  - `burnFrom(address, uint256)`: Quema tokens al emitir certificados
  - `balanceOfInWholeTokens(address)`: Consulta el balance en tokens enteros

#### CertificateAuthority
- **Propósito**: Registro inmutable de certificados universitarios
- **Características**:
  - Soporte para meta-transacciones (EIP-712)
  - Privacidad mediante hashing de datos personales
  - Validación y revocación de certificados

- **Funciones principales**:
  - `issueCertificate(...)`: Emisión directa (solo owner)
  - `issueCertificateWithSignature(...)`: Emisión con meta-transacción
  - `revokeCertificate(bytes32)`: Revocación de certificados
  - `isCertificateValid(bytes32)`: Verificación de validez
  - `getCertificate(bytes32)`: Obtener datos del certificado

### 2. Backend (Next.js API Routes)

#### Responsabilidades:
1. **Relayer de transacciones**: Paga el gas de todas las transacciones on-chain
2. **Gestión de usuarios**: Autenticación y autorización de universidades
3. **Validación de créditos**: Verificar que la universidad tenga créditos antes de emitir
4. **Interfaz con blockchain**: Conectar frontend con smart contracts

#### Flujo de Meta-Transacciones:
```
Usuario → Firma EIP-712 → Backend recibe firma → Valida → Envía tx → Blockchain
```

### 3. Frontend (Next.js + React)

#### Páginas principales:
- **Landing** (`/`): Marketing y presentación del producto
- **Registro** (`/register`): Registro de nuevas universidades
- **Login** (`/login`): Autenticación
- **Dashboard** (`/dashboard`): Panel de control de la universidad
- **Verificación** (`/verify`): Verificación pública de certificados

#### Integración Web3:
- **ethers.js v6**: Para interacción con MetaMask
- **EIP-712**: Para firmas estructuradas y seguras
- **MetaMask**: Wallet del usuario (sin necesidad de ETH)

### 4. Base de Datos (PostgreSQL)

#### Tablas:

**universities**
```sql
id SERIAL PRIMARY KEY
name VARCHAR(255)
email VARCHAR(255) UNIQUE
password_hash VARCHAR(255)
wallet_address VARCHAR(42) UNIQUE
credits INTEGER DEFAULT 0
has_free_tokens_claimed BOOLEAN DEFAULT false
created_at TIMESTAMP
updated_at TIMESTAMP
```

**certificates**
```sql
id SERIAL PRIMARY KEY
cert_id VARCHAR(66) UNIQUE
university_id INTEGER REFERENCES universities(id)
student_name VARCHAR(255)
student_email VARCHAR(255)
certificate_name VARCHAR(255)
person_name_hash VARCHAR(66)
email_hash VARCHAR(66)
issue_date BIGINT
expiration_date BIGINT
metadata_uri TEXT
tx_hash VARCHAR(66)
valid BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
```

## Flujo de Datos

### Registro de Universidad
```
1. Usuario completa formulario (nombre, email, password, wallet)
2. Backend hashea password con bcrypt
3. Se crea registro en PostgreSQL
4. Credits = 0, has_free_tokens_claimed = false
5. Redirección a dashboard
```

### Obtención de Créditos Gratuitos
```
1. Usuario hace clic en "Obtener 5 créditos"
2. Backend verifica has_free_tokens_claimed = false
3. Backend llama a CertUniToken.mintFor(wallet, 5)
4. Espera confirmación de transacción
5. Actualiza DB: credits = 5, has_free_tokens_claimed = true
6. Frontend actualiza UI
```

### Emisión de Certificado (Meta-Transacción)
```
1. Usuario llena formulario del certificado
2. Frontend genera datos EIP-712
3. MetaMask pide firma (sin enviar transacción)
4. Frontend envía datos + firma al backend
5. Backend valida:
   - Créditos > 0
   - Firma es válida
   - Universidad existe
6. Backend genera certId único (keccak256)
7. Backend calcula hashes de nombre y email
8. Backend llama a issueCertificateWithSignature()
9. Paga el gas de la transacción
10. Espera confirmación
11. Actualiza DB:
    - credits -= 1
    - Registra certificado con tx_hash
12. Retorna éxito al frontend
```

### Verificación de Certificado
```
1. Usuario escanea QR o abre link con certId
2. Frontend llama a /api/certificates/verify?certId=...
3. Backend consulta CertificateAuthority.getCertificate()
4. Backend verifica isCertificateValid()
5. Backend opcionalmente cruza con DB para info adicional
6. Retorna datos del certificado
7. Frontend muestra:
   - Universidad emisora
   - Nombre del certificado
   - Estado (válido/revocado)
   - Fecha de emisión
   - Info adicional
```

## Seguridad

### Meta-Transacciones (EIP-712)
1. **Usuario firma offline**: No se envía transacción desde MetaMask
2. **Backend es relayer**: Envía la transacción real
3. **Contrato verifica firma**: Usa `ecrecover` para validar
4. **Emisor real**: El certificado se registra con la wallet de la universidad, no del backend

### Privacidad
- **Hashes on-chain**: Nombre y email se guardan hasheados en blockchain
- **Datos completos off-chain**: Solo en PostgreSQL
- **Verificación por hash**: Terceros pueden verificar sin exponer datos

### Autenticación
- **Passwords hasheados**: bcrypt con salt
- **NextAuth**: Sesiones seguras
- **Wallet binding**: Cada universidad tiene una wallet única

## Tecnologías

### Smart Contracts
- Solidity 0.8.20
- OpenZeppelin (ERC20, Ownable, ECDSA)
- Hardhat (compilación y despliegue)

### Backend
- Next.js 15
- TypeScript
- ethers.js v6
- PostgreSQL + pg driver
- NextAuth para autenticación

### Frontend
- React 19
- TailwindCSS
- ethers.js v6
- QR Code generation

### Infraestructura
- Docker (PostgreSQL)
- Ethereum Sepolia Testnet
- Infura/Alchemy (RPC provider)

## Escalabilidad

### Optimizaciones actuales:
- Índices en PostgreSQL para queries rápidas
- EIP-712 reduce gas costs vs transacciones normales
- Relayer centralizado evita esperas del usuario

### Mejoras futuras:
- Migrar a L2 (Polygon, Arbitrum) para costos menores
- IPFS para almacenar metadata de certificados
- Batch minting de tokens
- Sistema de reputación para universidades

## Limitaciones del MVP

1. **Backend centralizado**: El relayer es un punto único de falla
2. **Sin pagos reales**: Solo 5 créditos gratuitos por universidad
3. **Testnet**: Sepolia no es producción
4. **Sin KYC**: No se verifica identidad de universidades
5. **Metadata simple**: No se usa IPFS u otros sistemas descentralizados

## Roadmap de Producción

1. **Fase 1**: Sistema de pagos real (Stripe + mint automático)
2. **Fase 2**: KYC para universidades verificadas
3. **Fase 3**: Migración a mainnet o L2
4. **Fase 4**: IPFS para metadata descentralizada
5. **Fase 5**: API pública para terceros verificadores
6. **Fase 6**: SDK para integración con sistemas universitarios existentes
