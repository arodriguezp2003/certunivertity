# Modelo de Datos del Certificado

## Visión General

El sistema Certunivertity utiliza un **modelo híbrido** que separa datos on-chain (blockchain) y off-chain (base de datos) para optimizar costos, privacidad y funcionalidad.

## Separación On-Chain / Off-Chain

### Principio de Diseño
- **On-chain**: Solo datos inmutables, esenciales para verificación
- **Off-chain**: Datos complementarios, información sensible en texto plano

### Ventajas
1. **Menor costo de gas**: Menos datos = menos gas
2. **Privacidad mejorada**: Datos personales hasheados en blockchain
3. **Flexibilidad**: Cambios off-chain sin modificar blockchain
4. **Performance**: Queries rápidas en PostgreSQL

---

## Datos On-Chain (CertificateAuthority)

### Estructura del Certificado

```solidity
struct Certificate {
    bytes32 certId;           // ID único del certificado
    address university;       // Dirección Ethereum de la universidad
    string certificateName;   // Nombre del certificado/título
    bytes32 personNameHash;   // Hash keccak256 del nombre completo
    bytes32 emailHash;        // Hash keccak256 del email
    uint256 issueDate;        // Timestamp de emisión (segundos)
    uint256 expirationDate;   // Timestamp de expiración (0 = nunca)
    string metadataURI;       // URI a metadata adicional (IPFS, HTTP)
    bool valid;               // Si el certificado está vigente
}
```

### Campos Detallados

#### certId (bytes32)
- **Tipo**: Hash único del certificado
- **Generación**: `keccak256(abi.encodePacked(university, studentEmail, timestamp, nonce))`
- **Propósito**: Identificador único e inmutable
- **Uso**: Clave para todas las consultas

#### university (address)
- **Tipo**: Dirección Ethereum (20 bytes)
- **Fuente**: Wallet de MetaMask de la universidad
- **Verificación**: La firma EIP-712 garantiza que proviene de esta address
- **Importancia**: Prueba de quién emitió el certificado

#### certificateName (string)
- **Tipo**: Texto legible
- **Ejemplos**:
  - "Ingeniería en Informática"
  - "Licenciatura en Administración de Empresas"
  - "Maestría en Ciencias de Datos"
- **Límite sugerido**: 100 caracteres

#### personNameHash (bytes32)
- **Tipo**: Hash keccak256
- **Generación**: `keccak256(abi.encodePacked(nombreCompleto))`
- **Ejemplo Input**: "Juan Carlos Pérez Rodríguez"
- **Ejemplo Output**: `0x3f7a...d8c2`
- **Privacidad**: No se puede revertir el hash sin conocer el input
- **Verificación**: Terceros calculan el hash del nombre y lo comparan

#### emailHash (bytes32)
- **Tipo**: Hash keccak256
- **Generación**: `keccak256(abi.encodePacked(email.toLowerCase()))`
- **Ejemplo Input**: "juan.perez@universidad.edu"
- **Ejemplo Output**: `0x9b2c...4f1a`
- **Normalización**: Siempre lowercase antes de hashear

#### issueDate (uint256)
- **Tipo**: Timestamp Unix (segundos desde 1970-01-01)
- **Generación**: `Math.floor(Date.now() / 1000)` en backend
- **Ejemplo**: `1735689600` → 2025-01-01 00:00:00 UTC
- **Inmutable**: Nunca cambia después de emisión

#### expirationDate (uint256)
- **Tipo**: Timestamp Unix o 0
- **Significado**:
  - `0` → El certificado nunca expira
  - `> 0` → Timestamp de expiración
- **Validación**: El contrato verifica `block.timestamp <= expirationDate`
- **Uso común**: La mayoría de títulos universitarios no expiran → `0`

#### metadataURI (string)
- **Tipo**: URI/URL
- **Formatos soportados**:
  - IPFS: `ipfs://QmX...`
  - HTTP: `https://certunivertity.com/metadata/cert123`
  - Datos inline: `data:application/json;base64,...`
- **Contenido**: JSON con información adicional
- **Opcional**: Puede estar vacío `""`

#### valid (bool)
- **Tipo**: Booleano
- **Estados**:
  - `true` → Certificado válido y vigente
  - `false` → Certificado revocado
- **Cambio**: Solo el owner del contrato puede cambiar de `true` a `false`
- **Irreversible**: Una vez revocado, no se puede reactivar (por diseño)

---

## Datos Off-Chain (PostgreSQL)

### Tabla certificates

```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    cert_id VARCHAR(66) UNIQUE NOT NULL,
    university_id INTEGER REFERENCES universities(id),
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    person_name_hash VARCHAR(66) NOT NULL,
    email_hash VARCHAR(66) NOT NULL,
    issue_date BIGINT NOT NULL,
    expiration_date BIGINT DEFAULT 0,
    metadata_uri TEXT,
    tx_hash VARCHAR(66),
    valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Campos Adicionales Off-Chain

#### id (SERIAL)
- Clave primaria interna de PostgreSQL
- No tiene relación con `cert_id`

#### university_id (INTEGER)
- Foreign key a tabla `universities`
- Permite joins rápidos para mostrar nombre de universidad

#### student_name (VARCHAR)
- **Texto plano** del nombre completo del estudiante
- Solo guardado off-chain
- Usado para mostrar en el dashboard de la universidad

#### student_email (VARCHAR)
- **Texto plano** del email del estudiante
- Solo guardado off-chain
- Usado para enviar notificaciones (futuro)

#### tx_hash (VARCHAR)
- Hash de la transacción de Ethereum
- Formato: `0x...` (66 caracteres)
- Permite rastrear la transacción en Etherscan

#### created_at / updated_at
- Timestamps de PostgreSQL
- Útiles para auditoría y debugging

---

## Flujo de Hashing

### Generación de Hashes (Backend)

```typescript
import { ethers } from "ethers";

function hashPersonName(name: string): string {
  // Normalizar: trim y case-sensitive
  const normalized = name.trim();
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

function hashEmail(email: string): string {
  // Normalizar: lowercase y trim
  const normalized = email.trim().toLowerCase();
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

// Ejemplo
const nameHash = hashPersonName("Juan Carlos Pérez");
// → 0x3f7a...d8c2

const emailHash = hashEmail("juan.perez@uni.edu");
// → 0x9b2c...4f1a
```

### Verificación de Hashes (Terceros)

```typescript
// Un empleador quiere verificar que el certificado pertenece a "Juan Pérez"
const certFromBlockchain = await contract.getCertificate(certId);

const candidateName = "Juan Pérez";
const candidateNameHash = hashPersonName(candidateName);

if (candidateNameHash === certFromBlockchain.personNameHash) {
  console.log("✅ El certificado pertenece a Juan Pérez");
} else {
  console.log("❌ El nombre no coincide");
}
```

---

## Metadata URI (Opcional)

### Formato JSON Sugerido

```json
{
  "name": "Certificado de Ingeniería en Informática",
  "description": "Título universitario otorgado por la Universidad XYZ",
  "image": "ipfs://QmXXX.../diploma.png",
  "attributes": [
    {
      "trait_type": "Universidad",
      "value": "Universidad Nacional Autónoma"
    },
    {
      "trait_type": "Programa",
      "value": "Ingeniería en Informática"
    },
    {
      "trait_type": "Año de graduación",
      "value": "2024"
    },
    {
      "trait_type": "Mención",
      "value": "Cum Laude"
    }
  ],
  "external_url": "https://certunivertity.com/verify?certId=0x123..."
}
```

### Casos de Uso
- **Imagen del diploma**: IPFS hash del PDF o imagen
- **Atributos adicionales**: GPA, menciones, especialización
- **Compatibilidad NFT**: Puede mostrarse en wallets como OpenSea

---

## Privacidad y GDPR

### Por qué usar hashes

1. **Blockchain es inmutable**: Datos en texto plano quedan expuestos para siempre
2. **GDPR derecho al olvido**: En teoría, datos off-chain pueden borrarse
3. **Verificación selectiva**: Solo quien conoce el nombre puede verificarlo

### Limitaciones

- **Rainbow tables**: Nombres comunes pueden ser descubiertos por fuerza bruta
- **No es encriptación**: Hashing es one-way, no reversible con clave
- **Mejor práctica**: Combinar con salt individual (no implementado en MVP)

### Mejora Futura: Salted Hashes

```typescript
// Usar un salt único por certificado
const salt = generateRandomSalt();
const saltedHash = keccak256(concat([toUtf8Bytes(name), salt]));

// Guardar el salt off-chain
// Solo con el salt se puede verificar
```

---

## Generación de certId

### Método Actual

```typescript
function generateCertId(
  universityAddress: string,
  studentEmail: string,
  timestamp: number,
  nonce: number
): string {
  return ethers.keccak256(
    ethers.solidityPacked(
      ["address", "string", "uint256", "uint256"],
      [universityAddress, studentEmail, timestamp, nonce]
    )
  );
}
```

### Garantías
- **Unicidad**: Es casi imposible colisión con keccak256
- **Determinismo**: Con los mismos inputs, mismo output
- **No predecible**: Incluye timestamp y nonce

---

## Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     Emisión de Certificado                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Frontend Form   │
                    │ - Nombre         │
                    │ - Email          │
                    │ - Certificado    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Hash Generation │
                    │ nameHash         │
                    │ emailHash        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  EIP-712 Sign    │
                    │  (MetaMask)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backend API     │
                    │ - Valida firma   │
                    │ - Genera certId  │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌──────────────────┐  ┌──────────────────┐
          │   Blockchain     │  │   PostgreSQL     │
          │ - certId         │  │ - student_name   │
          │ - university     │  │ - student_email  │
          │ - nameHash       │  │ - tx_hash        │
          │ - emailHash      │  │ - full data      │
          └──────────────────┘  └──────────────────┘
```

---

## Ejemplo Completo

### Datos de Entrada
```json
{
  "studentName": "María Fernanda González",
  "studentEmail": "maria.gonzalez@estudiante.edu",
  "certificateName": "Licenciatura en Psicología",
  "expirationDate": null,
  "metadataURI": "https://certunivertity.com/metadata/cert-12345"
}
```

### Procesamiento

```typescript
const personNameHash = hashPersonName("María Fernanda González");
// → 0xa7b3...

const emailHash = hashEmail("maria.gonzalez@estudiante.edu");
// → 0x5f21...

const issueDate = Math.floor(Date.now() / 1000);
// → 1735689600

const certId = generateCertId(
  universityAddress,
  "maria.gonzalez@estudiante.edu",
  issueDate,
  nonce
);
// → 0x9c44...
```

### On-Chain
```
certId: 0x9c44...
university: 0x1234... (wallet de la universidad)
certificateName: "Licenciatura en Psicología"
personNameHash: 0xa7b3...
emailHash: 0x5f21...
issueDate: 1735689600
expirationDate: 0
metadataURI: "https://certunivertity.com/metadata/cert-12345"
valid: true
```

### Off-Chain (PostgreSQL)
```
cert_id: "0x9c44..."
university_id: 42
student_name: "María Fernanda González"
student_email: "maria.gonzalez@estudiante.edu"
certificate_name: "Licenciatura en Psicología"
tx_hash: "0xabc..."
```

---

## Consultas Comunes

### 1. Verificar certificado por ID
```typescript
const cert = await contract.getCertificate(certId);
const isValid = await contract.isCertificateValid(certId);
```

### 2. Verificar certificado con nombre y email
```typescript
const nameHash = hashPersonName("María Fernanda González");
const emailHash = hashEmail("maria.gonzalez@estudiante.edu");

const matches = await contract.verifyCertificate(
  certId,
  nameHash,
  emailHash
);
// → true si coincide
```

### 3. Listar certificados de una universidad (off-chain)
```sql
SELECT * FROM certificates
WHERE university_id = 42
ORDER BY issue_date DESC
LIMIT 10;
```

---

## Conclusión

El modelo híbrido de Certunivertity ofrece:

✅ **Inmutabilidad**: Datos críticos en blockchain
✅ **Privacidad**: Hashes en lugar de texto plano
✅ **Eficiencia**: Costos de gas optimizados
✅ **Funcionalidad**: Queries rápidas en PostgreSQL
✅ **Verificabilidad**: Cualquiera puede verificar con el hash

Este diseño es escalable, privado y cost-effective para un sistema de certificación universitaria.
