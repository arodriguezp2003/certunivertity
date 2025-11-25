# Deployment Guide - Certunivertity

## Prerequisites

### Required Software
- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed
- MetaMask extension installed in browser

### Accounts and Services
- Infura or Alchemy account (for Sepolia RPC)
- Wallet with Sepolia testnet ETH (~0.1 ETH recommended)
- Etherscan account (optional, for contract verification)

---

## Step 1: Obtain Sepolia Testnet ETH

### Option A: Public Faucets
1. Visit one of these faucets:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

2. Connect your MetaMask wallet
3. Request 0.1 Sepolia ETH
4. Wait for confirmation (1-2 minutes)

### Option B: Bridging from mainnet (requires real ETH)
1. Use an official bridge if you have ETH on mainnet
2. Not recommended for testing

---

## Step 2: Clone and Configure the Project

```bash
# Clone the repository
git clone <repository-url>
cd certunivertity

# Project structure
tree -L 1
# certunivertity/
# ├── contracts/
# ├── web/
# ├── docs/
# ├── docker-compose.yml
# └── README.md
```

---

## Step 3: Start the Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Verify it's running
docker ps
# You should see: certunivertity_postgres

# Test connection
docker exec -it certunivertity_postgres psql -U certuni_user -d certunivertity_db
# If it connects, type \q to exit
```

### Troubleshooting
- **Error: port 5334 already in use**
  - Change the port in `docker-compose.yml` line 8
  - Also update `DATABASE_URL` in `.env.local`

- **Error: permission denied**
  - Run `sudo docker-compose up -d`

---

## Step 4: Deploy Smart Contracts

```bash
cd contracts

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Contents of `contracts/.env`
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **IMPORTANT**:
- The private key must have Sepolia ETH
- Never commit the `.env` file to GitHub
- Use a testing wallet, not your main wallet

### Compile and Deploy

```bash
# Compile contracts
npm run compile

# Verify compilation succeeded
ls artifacts/contracts/

# Deploy to Sepolia
npm run deploy:sepolia

# Expected output:
# ✅ CertUniToken deployed to: 0xABC...
# ✅ CertificateAuthority deployed to: 0xDEF...
```

### Save the Addresses
Copy the deployed contract addresses. You'll need them in the next step.

```bash
# Addresses are also saved in:
cat deployments/sepolia.json
```

### Verify Contracts on Etherscan (Optional)

```bash
# CertUniToken
npx hardhat verify --network sepolia <CERTUNI_TOKEN_ADDRESS>

# CertificateAuthority
npx hardhat verify --network sepolia <CERTIFICATE_AUTHORITY_ADDRESS>
```

---

## Step 5: Configure the Frontend

```bash
cd ../web

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

### Contents of `web/.env.local`

```bash
# Database
DATABASE_URL=postgres://certuni_user:certuni_password@localhost:5334/certunivertity_db

# Smart Contract Addresses (use addresses from step 4)
NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS=0xABC...
NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS=0xDEF...

# Blockchain RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Backend Wallet (same as deployed contracts, or different one with ETH)
BACKEND_PRIVATE_KEY=your_backend_private_key_without_0x

# NextAuth (generate a secret)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate NEXTAUTH_SECRET

```bash
# On Mac/Linux
openssl rand -base64 32

# Copy the output and paste it in .env.local
```

---

## Step 6: Initialize the Database

The schema is created automatically the first time you run the application, but you can do it manually:

```bash
# Create an initialization script (optional)
# The app will do it automatically on first run
```

---

## Step 7: Run the Project

```bash
# From the web/ folder
npm run dev

# Expected output:
# ▲ Next.js 15.1.0
# - Local:        http://localhost:3000
# - Environments: .env.local
```

Open your browser at [http://localhost:3000](http://localhost:3000)

---

## Step 8: Test the Complete Flow

### 8.1 Register a University

1. Click "Get Started Free"
2. Complete the form:
   - Name: Test University
   - Email: test@university.edu
   - Password: Test1234!
   - Wallet: Your MetaMask address on Sepolia
3. Click "Register"
4. You should be redirected to the dashboard

### 8.2 Obtain Free Credits

1. In the dashboard, click "Get 5 test credits"
2. Wait for transaction confirmation
3. Your balance should change to 5 CERTUNI
4. The button should become disabled

### 8.3 View Tokens in MetaMask

1. Open MetaMask
2. Make sure you're on Sepolia
3. Click "Import tokens"
4. Paste the CertUniToken contract address
5. You should see 5.00 CERTUNI

### 8.4 Issue a Certificate

1. In the dashboard, click "Issue Certificate"
2. Complete:
   - Name: Juan Pérez
   - Email: juan.perez@estudiante.edu
   - Certificate: Computer Engineering
   - Expiration: (optional)
3. Click "Sign and Issue"
4. MetaMask will open asking you to **sign** (not send transaction)
5. Accept the signature
6. Wait for confirmation
7. You should see the certificate in history
8. Your balance should be 4 CERTUNI

### 8.5 Verify the Certificate

1. Copy the `certId` of the issued certificate
2. Open `http://localhost:3000/verify?certId=<CERT_ID>`
3. You should see:
   - Status: ✅ Valid
   - Issuing university
   - Certificate name
   - Issue date

---

## Common Troubleshooting

### Error: "Network not supported"
- Verify that MetaMask is on Sepolia
- Verify that `NEXT_PUBLIC_SEPOLIA_RPC_URL` is configured

### Error: "Insufficient funds for gas"
- Your `BACKEND_PRIVATE_KEY` doesn't have Sepolia ETH
- Get more ETH from the faucet

### Error: "Contract not deployed"
- Verify the addresses in `.env.local`
- Make sure contracts deployed successfully
- Check `contracts/deployments/sepolia.json`

### Error: "Database connection failed"
- Verify Docker is running: `docker ps`
- Verify port 5334: `lsof -i :5334`
- Restart container: `docker-compose restart`

### Error: "Invalid signature"
- Verify the signing wallet is the same as registered
- Verify `chainId` is 11155111 (Sepolia)

### MetaMask doesn't request signature
- Verify MetaMask is connected to the site
- Check browser console for errors
- Make sure you're on Sepolia

---

## Production Deployment (Future)

### Option A: Vercel + Serverless PostgreSQL

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel

# Configure environment variables in Vercel dashboard
# Use PostgreSQL from Vercel, Supabase, or Railway
```

### Option B: VPS (AWS, DigitalOcean)

```bash
# Connect to your VPS
ssh user@your-server.com

# Clone repo
git clone <repo-url>
cd certunivertity

# Use Docker Compose for everything
docker-compose -f docker-compose.prod.yml up -d

# Configure Nginx as reverse proxy
```

### Option C: Render / Railway

1. Connect your GitHub repository
2. Configure environment variables
3. Automatic deploy with each push

---

## Production Security

### ⚠️ CRITICAL:

1. **Never expose private keys**
   - Use environment variables
   - Use services like AWS Secrets Manager

2. **Use HTTPS**
   - Free Let's Encrypt
   - Cloudflare for DDoS protection

3. **Rate limiting**
   - Limit API route requests
   - Use Redis for tracking

4. **Input validation**
   - Always validate in backend
   - Use Zod or similar

5. **Logging and monitoring**
   - Sentry for errors
   - Datadog / New Relic for performance

6. **DB backups**
   - Daily automatic backups
   - Monthly restoration tests

---

## Mainnet Migration

### Considerations:

1. **Gas costs**:
   - Certificate issuance: ~150,000 gas
   - At $30/ETH and 20 gwei: ~$0.09 per certificate
   - Multiply by your expected volume

2. **L2 alternatives**:
   - Polygon: ~1000x cheaper
   - Arbitrum: ~100x cheaper
   - Optimism: ~100x cheaper

3. **Contract audit**:
   - Hire professional audit
   - OpenZeppelin, CertiK, etc.

4. **Extensive testing**:
   - Unit tests with Hardhat
   - Integration tests
   - Testnet for 1-2 months

---

## Maintenance

### Weekly Tasks
- Review error logs
- Monitor gas costs
- Database backup

### Monthly Tasks
- Update npm dependencies
- Review vulnerabilities: `npm audit`
- Analyze usage metrics

### Quarterly Tasks
- Security audit
- Cost optimization
- Documentation updates

---

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Sepolia Faucets](https://sepoliafaucet.com/)

---

## Support

For questions or issues:
1. Check the logs: `docker logs certunivertity_postgres`
2. Check browser console (F12)
3. Verify transactions on Sepolia Etherscan
4. Open an issue on the GitHub repository

---

Congratulations! 🎉 You now have Certunivertity running locally.
