const { ethers } = require('ethers');

async function main() {
  const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/oG-sH4baPHuZkfYQCgUOJGVoywG4qy8j";
  const contractAddress = "0x32428b5E6471e04A33361De685397c25F90c31fE";

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const abi = [
    "function getDomainSeparator() external view returns (bytes32)"
  ];

  const contract = new ethers.Contract(contractAddress, abi, provider);

  console.log("Querying contract at:", contractAddress);
  const domainSeparator = await contract.getDomainSeparator();

  console.log("\nContract Domain Separator:", domainSeparator);
  console.log("Expected from test script: ", "0xfb1f4c6f81e1faa2d4a231c06c400df5849a71782e5ad95d93a77a4236848137");

  if (domainSeparator === "0xfb1f4c6f81e1faa2d4a231c06c400df5849a71782e5ad95d93a77a4236848137") {
    console.log("\n✅ Domain separators MATCH!");
  } else {
    console.log("\n❌ Domain separators DO NOT MATCH");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
