# 🚀 Quick Start - Certunivertity

Quick guide to get Certunivertity running in 10 minutes.

---

## Quick Prerequisites

✅ Node.js 18+ installed
✅ Docker installed and running
✅ MetaMask installed in browser
✅ ~0.1 ETH from Sepolia testnet

---

## Step 1: Get Sepolia ETH (2 min)

```bash
# Visit one of these faucets:
# https://sepoliafaucet.com/
# https://www.alchemy.com/faucets/ethereum-sepolia

# Connect your wallet and request ETH
```

---

## Step 2: Start PostgreSQL (1 min)

```bash
# In the project root
docker-compose up -d

# Verify it's running
docker ps
```

---

## Step 3: Deploy Contracts (3 min)

```bash
cd contracts

# Install dependencies
npm install

# Configure .env
cp .env.example .env
nano .env
```

**Edit `.env`:**
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
```

**Deploy:**
```bash
npm run deploy:sepolia

# ✅ Copy the addresses that appear:
# CertUniToken: 0x...
# CertificateAuthority: 0x...
```

---

## Step 4: Configure Frontend (2 min)

```bash
cd ../web

# Install dependencies
npm install

# Configure .env.local
cp .env.example .env.local
nano .env.local
```

**Edit `.env.local` with addresses from step 3:**
```bash
DATABASE_URL=postgres://certuni_user:certuni_password@localhost:5334/certunivertity_db

NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS=0x... # From step 3
NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS=0x... # From step 3

SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

BACKEND_PRIVATE_KEY=your_backend_private_key_without_0x

NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Run (1 min)

```bash
# From web/
npm run dev

# Open http://localhost:3000
```

---

## 🧪 Test (1 min)

### View the Landing Page
1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the Certunivertity landing page

---

## ⚠️ Quick Troubleshooting

### PostgreSQL won't connect
```bash
# Verify it's running
docker ps

# Restart
docker-compose restart

# View logs
docker logs certunivertity_postgres
```

### Error "Contract not deployed"
- Verify you copied the addresses correctly in `.env.local`
- Check `contracts/deployments/sepolia.json`

### Error "Insufficient funds for gas"
- Your `BACKEND_PRIVATE_KEY` doesn't have Sepolia ETH
- Get more ETH from the faucet

### MetaMask won't connect
- Verify you're on Sepolia Network
- Refresh the page

---

## 📚 Next Steps

Once you have everything running:

1. **Read the architecture**: [docs/architecture.md](docs/architecture.md)
2. **Understand the model**: [docs/certificate-model.md](docs/certificate-model.md)
3. **Implement missing pages** (see PROJECT_SUMMARY.md)

---

## 🎯 What Works Now

✅ Contracts deployed on Sepolia
✅ PostgreSQL running
✅ Landing page visible
✅ Blockchain and DB utilities ready
✅ EIP-712 signing implemented

---

## 🔴 What's Missing

❌ University registration (need to create `/register`)
❌ Login (need to create `/login`)
❌ Dashboard (need to create `/dashboard`)
❌ Certificate issuance (need to create API routes)
❌ Verification (need to create `/verify`)

**See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for details.**

---

## 💡 Useful Commands

```bash
# View PostgreSQL logs
docker logs -f certunivertity_postgres

# Connect to PostgreSQL manually
docker exec -it certunivertity_postgres psql -U certuni_user -d certunivertity_db

# Recompile contracts
cd contracts && npm run compile

# Verify contract on Etherscan
cd contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Restart everything
docker-compose down && docker-compose up -d
cd web && npm run dev
```

---

## 🆘 Help

- **Complete documentation**: See `docs/` folder
- **Project structure**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Detailed deployment**: See [docs/deployment-guide.md](docs/deployment-guide.md)

---

Ready! 🎉 You now have the Certunivertity base running.
