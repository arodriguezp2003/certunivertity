import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Starting deployment to Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy CertUniToken
  console.log("Deploying CertUniToken...");
  const CertUniToken = await ethers.getContractFactory("CertUniToken");
  const certUniToken = await CertUniToken.deploy();
  await certUniToken.waitForDeployment();
  const certUniTokenAddress = await certUniToken.getAddress();
  console.log("✅ CertUniToken deployed to:", certUniTokenAddress);

  // Deploy CertificateAuthority
  console.log("\nDeploying CertificateAuthority...");
  const CertificateAuthority = await ethers.getContractFactory("CertificateAuthority");
  const certificateAuthority = await CertificateAuthority.deploy();
  await certificateAuthority.waitForDeployment();
  const certificateAuthorityAddress = await certificateAuthority.getAddress();
  console.log("✅ CertificateAuthority deployed to:", certificateAuthorityAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CertUniToken: {
        address: certUniTokenAddress,
        name: "CertUni",
        symbol: "CERTUNI",
      },
      CertificateAuthority: {
        address: certificateAuthorityAddress,
      },
    },
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, "sepolia.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment info saved to:", deploymentPath);
  console.log("\n📋 Summary:");
  console.log("=".repeat(60));
  console.log("CertUniToken:         ", certUniTokenAddress);
  console.log("CertificateAuthority: ", certificateAuthorityAddress);
  console.log("=".repeat(60));
  console.log("\n💡 Next steps:");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${certUniTokenAddress}`);
  console.log(`   npx hardhat verify --network sepolia ${certificateAuthorityAddress}`);
  console.log("\n2. Update your .env.local in the web/ directory with these addresses");
  console.log("\n3. Test minting tokens:");
  console.log("   - Use the CertUniToken contract");
  console.log("   - Call mintFor(universityAddress, 5) to give a university 5 credits");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
