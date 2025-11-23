const hre = require("hardhat");

async function main() {
  const contractAddress = "0x32428b5E6471e04A33361De685397c25F90c31fE";

  const CertificateAuthority = await hre.ethers.getContractAt(
    "CertificateAuthority",
    contractAddress
  );

  const domainSeparator = await CertificateAuthority.getDomainSeparator();
  console.log("Contract Domain Separator:", domainSeparator);

  console.log("\nExpected from test script:", "0xfb1f4c6f81e1faa2d4a231c06c400df5849a71782e5ad95d93a77a4236848137");

  if (domainSeparator === "0xfb1f4c6f81e1faa2d4a231c06c400df5849a71782e5ad95d93a77a4236848137") {
    console.log("✅ Domain separators MATCH!");
  } else {
    console.log("❌ Domain separators DO NOT MATCH");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
