# Certunivertity Architecture

## Overview

Certunivertity is a complete system for blockchain-verifiable university certificates that uses **gasless meta-transactions** to provide a frictionless user experience.

## Main Components

### 1. Smart Contracts (Ethereum Sepolia)

#### CertUniToken (ERC-20)
- **Purpose**: Token representing certificate issuance credits
- **Ratio**: 1 CERTUNI = 1 certificate that can be issued
- **Main Functions**:
  - `mintFor(address, uint256)`: Only owner can mint tokens
  - `burnFrom(address, uint256)`: Burns tokens when issuing certificates
  - `balanceOfInWholeTokens(address)`: Query balance in whole tokens

#### CertificateAuthority
- **Purpose**: Immutable registry of university certificates
- **Features**:
  - Support for meta-transactions (EIP-712)
  - Privacy through hashing of personal data
  - Certificate validation and revocation

- **Main Functions**:
  - `issueCertificate(...)`: Direct issuance (owner only)
  - `issueCertificateWithSignature(...)`: Issuance with meta-transaction
  - `revokeCertificate(bytes32)`: Certificate revocation
  - `isCertificateValid(bytes32)`: Validity verification
  - `getCertificate(bytes32)`: Get certificate data

### 2. Backend (Next.js API Routes)

#### Responsibilities:
1. **Transaction Relayer**: Pays gas for all on-chain transactions
2. **User Management**: Authentication and authorization for universities
3. **Credit Validation**: Verify that the university has credits before issuing
4. **Blockchain Interface**: Connect frontend with smart contracts

#### Meta-Transaction Flow:
```
User → EIP-712 Signature → Backend receives signature → Validates → Sends tx → Blockchain
```

### 3. Frontend (Next.js + React)

#### Main Pages:
- **Landing** (`/`): Marketing and product presentation
- **Register** (`/register`): Registration for new universities
- **Login** (`/login`): Authentication
- **Dashboard** (`/dashboard`): University control panel
- **Verification** (`/verify`): Public certificate verification

#### Web3 Integration:
- **ethers.js v6**: For MetaMask interaction
- **EIP-712**: For structured and secure signatures
- **MetaMask**: User wallet (no ETH required)

### 4. Database (PostgreSQL)

#### Tables:

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

## Data Flow

### University Registration
```
1. User completes form (name, email, password, wallet)
2. Backend hashes password with bcrypt
3. Record created in PostgreSQL
4. Credits = 0, has_free_tokens_claimed = false
5. Redirect to dashboard
```

### Obtaining Free Credits
```
1. User clicks "Get 5 free credits"
2. Backend verifies has_free_tokens_claimed = false
3. Backend calls CertUniToken.mintFor(wallet, 5)
4. Waits for transaction confirmation
5. Updates DB: credits = 5, has_free_tokens_claimed = true
6. Frontend updates UI
```

### Certificate Issuance (Meta-Transaction)
```
1. User fills out certificate form
2. Frontend generates EIP-712 data
3. MetaMask requests signature (without sending transaction)
4. Frontend sends data + signature to backend
5. Backend validates:
   - Credits > 0
   - Signature is valid
   - University exists
6. Backend generates unique certId (keccak256)
7. Backend calculates name and email hashes
8. Backend calls issueCertificateWithSignature()
9. Pays transaction gas
10. Waits for confirmation
11. Updates DB:
    - credits -= 1
    - Registers certificate with tx_hash
12. Returns success to frontend
```

### Certificate Verification
```
1. User scans QR or opens link with certId
2. Frontend calls /api/certificates/verify?certId=...
3. Backend queries CertificateAuthority.getCertificate()
4. Backend verifies isCertificateValid()
5. Backend optionally cross-references with DB for additional info
6. Returns certificate data
7. Frontend displays:
   - Issuing university
   - Certificate name
   - Status (valid/revoked)
   - Issue date
   - Additional info
```

## Security

### Meta-Transactions (EIP-712)
1. **User signs offline**: No transaction sent from MetaMask
2. **Backend is relayer**: Sends the real transaction
3. **Contract verifies signature**: Uses `ecrecover` to validate
4. **Real issuer**: Certificate is registered with university's wallet, not backend

### Privacy
- **On-chain hashes**: Name and email stored hashed on blockchain
- **Complete data off-chain**: Only in PostgreSQL
- **Hash verification**: Third parties can verify without exposing data

### Authentication
- **Hashed passwords**: bcrypt with salt
- **NextAuth**: Secure sessions
- **Wallet binding**: Each university has a unique wallet

## Technologies

### Smart Contracts
- Solidity 0.8.20
- OpenZeppelin (ERC20, Ownable, ECDSA)
- Hardhat (compilation and deployment)

### Backend
- Next.js 15
- TypeScript
- ethers.js v6
- PostgreSQL + pg driver
- NextAuth for authentication

### Frontend
- React 19
- TailwindCSS
- ethers.js v6
- QR Code generation

### Infrastructure
- Docker (PostgreSQL)
- Ethereum Sepolia Testnet
- Infura/Alchemy (RPC provider)

## Scalability

### Current Optimizations:
- PostgreSQL indexes for fast queries
- EIP-712 reduces gas costs vs normal transactions
- Centralized relayer avoids user waiting

### Future Improvements:
- Migrate to L2 (Polygon, Arbitrum) for lower costs
- IPFS for storing certificate metadata
- Batch minting of tokens
- Reputation system for universities

## MVP Limitations

1. **Centralized backend**: The relayer is a single point of failure
2. **No real payments**: Only 5 free credits per university
3. **Testnet**: Sepolia is not production
4. **No KYC**: University identity is not verified
5. **Simple metadata**: IPFS or other decentralized systems not used

## Production Roadmap

1. **Phase 1**: Real payment system (Stripe + automatic mint)
2. **Phase 2**: KYC for verified universities
3. **Phase 3**: Migration to mainnet or L2
4. **Phase 4**: IPFS for decentralized metadata
5. **Phase 5**: Public API for third-party verifiers
6. **Phase 6**: SDK for integration with existing university systems
