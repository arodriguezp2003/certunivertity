# Certificate Data Model

## Overview

The Certunivertity system uses a **hybrid model** that separates on-chain (blockchain) and off-chain (database) data to optimize costs, privacy, and functionality.

## On-Chain / Off-Chain Separation

### Design Principle
- **On-chain**: Only immutable data essential for verification
- **Off-chain**: Complementary data, sensitive information in plain text

### Advantages
1. **Lower gas cost**: Less data = less gas
2. **Enhanced privacy**: Personal data hashed on blockchain
3. **Flexibility**: Off-chain changes without modifying blockchain
4. **Performance**: Fast queries in PostgreSQL

---

## On-Chain Data (CertificateAuthority)

### Certificate Structure

```solidity
struct Certificate {
    bytes32 certId;           // Unique certificate ID
    address university;       // University's Ethereum address
    string certificateName;   // Certificate/degree name
    bytes32 personNameHash;   // keccak256 hash of full name
    bytes32 emailHash;        // keccak256 hash of email
    uint256 issueDate;        // Issue timestamp (seconds)
    uint256 expirationDate;   // Expiration timestamp (0 = never)
    string metadataURI;       // URI to additional metadata (IPFS, HTTP)
    bool valid;               // Whether the certificate is valid
}
```

### Detailed Fields

#### certId (bytes32)
- **Type**: Unique certificate hash
- **Generation**: `keccak256(abi.encodePacked(university, studentEmail, timestamp, nonce))`
- **Purpose**: Unique and immutable identifier
- **Usage**: Key for all queries

#### university (address)
- **Type**: Ethereum address (20 bytes)
- **Source**: University's MetaMask wallet
- **Verification**: EIP-712 signature guarantees it comes from this address
- **Importance**: Proof of who issued the certificate

#### certificateName (string)
- **Type**: Readable text
- **Examples**:
  - "Computer Engineering"
  - "Bachelor of Business Administration"
  - "Master of Data Science"
- **Suggested Limit**: 100 characters

#### personNameHash (bytes32)
- **Type**: keccak256 hash
- **Generation**: `keccak256(abi.encodePacked(fullName))`
- **Example Input**: "Juan Carlos Pérez Rodríguez"
- **Example Output**: `0x3f7a...d8c2`
- **Privacy**: Cannot reverse the hash without knowing the input
- **Verification**: Third parties calculate name hash and compare

#### emailHash (bytes32)
- **Type**: keccak256 hash
- **Generation**: `keccak256(abi.encodePacked(email.toLowerCase()))`
- **Example Input**: "juan.perez@universidad.edu"
- **Example Output**: `0x9b2c...4f1a`
- **Normalization**: Always lowercase before hashing

#### issueDate (uint256)
- **Type**: Unix timestamp (seconds since 1970-01-01)
- **Generation**: `Math.floor(Date.now() / 1000)` in backend
- **Example**: `1735689600` → 2025-01-01 00:00:00 UTC
- **Immutable**: Never changes after issuance

#### expirationDate (uint256)
- **Type**: Unix timestamp or 0
- **Meaning**:
  - `0` → Certificate never expires
  - `> 0` → Expiration timestamp
- **Validation**: Contract verifies `block.timestamp <= expirationDate`
- **Common usage**: Most university degrees don't expire → `0`

#### metadataURI (string)
- **Type**: URI/URL
- **Supported Formats**:
  - IPFS: `ipfs://QmX...`
  - HTTP: `https://certunivertity.com/metadata/cert123`
  - Inline data: `data:application/json;base64,...`
- **Content**: JSON with additional information
- **Optional**: Can be empty `""`

#### valid (bool)
- **Type**: Boolean
- **States**:
  - `true` → Valid and current certificate
  - `false` → Revoked certificate
- **Change**: Only contract owner can change from `true` to `false`
- **Irreversible**: Once revoked, cannot be reactivated (by design)

---

## Off-Chain Data (PostgreSQL)

### certificates Table

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

### Additional Off-Chain Fields

#### id (SERIAL)
- PostgreSQL internal primary key
- Not related to `cert_id`

#### university_id (INTEGER)
- Foreign key to `universities` table
- Allows fast joins to display university name

#### student_name (VARCHAR)
- **Plain text** of student's full name
- Only stored off-chain
- Used to display in university's dashboard

#### student_email (VARCHAR)
- **Plain text** of student's email
- Only stored off-chain
- Used to send notifications (future)

#### tx_hash (VARCHAR)
- Ethereum transaction hash
- Format: `0x...` (66 characters)
- Allows tracking transaction on Etherscan

#### created_at / updated_at
- PostgreSQL timestamps
- Useful for auditing and debugging

---

## Hashing Flow

### Hash Generation (Backend)

```typescript
import { ethers } from "ethers";

function hashPersonName(name: string): string {
  // Normalize: trim and case-sensitive
  const normalized = name.trim();
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

function hashEmail(email: string): string {
  // Normalize: lowercase and trim
  const normalized = email.trim().toLowerCase();
  return ethers.keccak256(ethers.toUtf8Bytes(normalized));
}

// Example
const nameHash = hashPersonName("Juan Carlos Pérez");
// → 0x3f7a...d8c2

const emailHash = hashEmail("juan.perez@uni.edu");
// → 0x9b2c...4f1a
```

### Hash Verification (Third Parties)

```typescript
// An employer wants to verify that the certificate belongs to "Juan Pérez"
const certFromBlockchain = await contract.getCertificate(certId);

const candidateName = "Juan Pérez";
const candidateNameHash = hashPersonName(candidateName);

if (candidateNameHash === certFromBlockchain.personNameHash) {
  console.log("✅ The certificate belongs to Juan Pérez");
} else {
  console.log("❌ The name does not match");
}
```

---

## Metadata URI (Optional)

### Suggested JSON Format

```json
{
  "name": "Computer Engineering Certificate",
  "description": "University degree awarded by XYZ University",
  "image": "ipfs://QmXXX.../diploma.png",
  "attributes": [
    {
      "trait_type": "University",
      "value": "National Autonomous University"
    },
    {
      "trait_type": "Program",
      "value": "Computer Engineering"
    },
    {
      "trait_type": "Graduation Year",
      "value": "2024"
    },
    {
      "trait_type": "Honors",
      "value": "Cum Laude"
    }
  ],
  "external_url": "https://certunivertity.com/verify?certId=0x123..."
}
```

### Use Cases
- **Diploma image**: IPFS hash of PDF or image
- **Additional attributes**: GPA, honors, specialization
- **NFT compatibility**: Can be displayed in wallets like OpenSea

---

## Privacy and GDPR

### Why Use Hashes

1. **Blockchain is immutable**: Plain text data remains exposed forever
2. **GDPR right to be forgotten**: In theory, off-chain data can be deleted
3. **Selective verification**: Only those who know the name can verify it

### Limitations

- **Rainbow tables**: Common names can be discovered by brute force
- **Not encryption**: Hashing is one-way, not reversible with a key
- **Best practice**: Combine with individual salt (not implemented in MVP)

### Future Improvement: Salted Hashes

```typescript
// Use a unique salt per certificate
const salt = generateRandomSalt();
const saltedHash = keccak256(concat([toUtf8Bytes(name), salt]));

// Store the salt off-chain
// Only with the salt can verification occur
```

---

## certId Generation

### Current Method

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

### Guarantees
- **Uniqueness**: Collision is nearly impossible with keccak256
- **Determinism**: Same inputs produce same output
- **Not predictable**: Includes timestamp and nonce

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Certificate Issuance                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Frontend Form   │
                    │ - Name           │
                    │ - Email          │
                    │ - Certificate    │
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
                    │ - Validates sig  │
                    │ - Generates ID   │
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

## Complete Example

### Input Data
```json
{
  "studentName": "María Fernanda González",
  "studentEmail": "maria.gonzalez@estudiante.edu",
  "certificateName": "Bachelor of Psychology",
  "expirationDate": null,
  "metadataURI": "https://certunivertity.com/metadata/cert-12345"
}
```

### Processing

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
university: 0x1234... (university wallet)
certificateName: "Bachelor of Psychology"
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
certificate_name: "Bachelor of Psychology"
tx_hash: "0xabc..."
```

---

## Common Queries

### 1. Verify certificate by ID
```typescript
const cert = await contract.getCertificate(certId);
const isValid = await contract.isCertificateValid(certId);
```

### 2. Verify certificate with name and email
```typescript
const nameHash = hashPersonName("María Fernanda González");
const emailHash = hashEmail("maria.gonzalez@estudiante.edu");

const matches = await contract.verifyCertificate(
  certId,
  nameHash,
  emailHash
);
// → true if matches
```

### 3. List university certificates (off-chain)
```sql
SELECT * FROM certificates
WHERE university_id = 42
ORDER BY issue_date DESC
LIMIT 10;
```

---

## Conclusion

Certunivertity's hybrid model offers:

✅ **Immutability**: Critical data on blockchain
✅ **Privacy**: Hashes instead of plain text
✅ **Efficiency**: Optimized gas costs
✅ **Functionality**: Fast queries in PostgreSQL
✅ **Verifiability**: Anyone can verify with the hash

This design is scalable, private, and cost-effective for a university certification system.
