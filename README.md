# 🎓 Certunivertity
### Blockchain-Verifiable University Certificates (MVP – Technical Demo 2025)

Certunivertity is a demonstration system that allows universities to **issue verifiable digital certificates** on the **Sepolia** Ethereum network.
It uses a custom token called **CertUni** that represents **signing credits**:

> **1 CertUni = 1 issued certificate**

This project combines:

- **Next.js** (landing page + dashboard)
- **PostgreSQL** (via Docker, port 5334)
- **Ethereum Sepolia** (Solidity smart contracts)
- **Web3 Integration (ethers.js)**
- **Relayed Meta-Transactions (gasless)**
- **Realistic SaaS design for educational institutions**

---

## 🧩 Meta-Transaction Mechanism (Gasless)

This system uses the **relayed meta-transaction** pattern:

> "The user **signs** an authorization in MetaMask (no gas required).
> The backend **sends the transaction** to the blockchain as a relayer.
> The contract **verifies the signature** and executes the action on behalf of the user."

### Benefits:

- **MetaMask requests confirmation** → the user controls authorization.
- **No gas payment** → The System pays using its admin wallet.
- **The certificate is issued with the university's real address.**
- **Secure** → The signature is verified with ECDSA (`ecrecover`).
- **Perfect UX** → neither the user nor MetaMask need ETH.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MetaMask installed
- A Sepolia account with test ETH (for the backend)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd certunivertity
```

2. **Start the database**
```bash
docker-compose up -d
```

3. **Configure the contracts project**
```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your credentials
```

4. **Deploy contracts to Sepolia**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

5. **Configure the web project**
```bash
cd ../web
npm install
cp .env.example .env.local
# Edit .env.local with the contract addresses
```

6. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
certunivertity/
├── contracts/           # Solidity smart contracts
│   ├── CertUniToken.sol
│   ├── CertificateAuthority.sol
│   └── scripts/
├── web/                 # Next.js application
│   ├── app/
│   ├── components/
│   └── lib/
├── docs/                # Documentation
└── docker-compose.yml   # PostgreSQL
```

---

## 🔑 Environment Variables

### Contracts (`contracts/.env`)
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

## 🦊 MetaMask Integration

Each university registers an **Ethereum wallet address (MetaMask)** on the **Sepolia** network.

### How to link MetaMask

1. Install MetaMask in your browser
2. Switch the network to **Sepolia Test Network**
3. Copy your address (0x...)
4. Paste it in the registration form

### View your CertUni in MetaMask

After claiming the 5 test credits:

1. Open MetaMask
2. Click **"Import Token"**
3. Paste the `CertUniToken` contract address
4. You'll see your balance of **5 CERTUNI**

---

## 🔄 Certificate Issuance Flow

1. University fills out the certificate form
2. Frontend generates an EIP-712 payload
3. MetaMask requests **Sign** (signature only, no transaction)
4. Frontend sends data + signature to backend
5. Backend validates credits and sends transaction to blockchain
6. Contract verifies signature with `ecrecover` and issues certificate

---

## 📜 License

MVP demonstration for educational use and personal portfolio.

---

## 📞 Support

To report issues or ask questions, open an issue in the repository.
