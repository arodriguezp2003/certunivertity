const { ethers } = require('ethers');

// Simulate what MetaMask signs
async function testSignature() {
  // Test data from the transaction
  const certId = "0xa20abf9277c0e6bf7e6b931f10bc82d79c158e88816ec07615ab9f095a542aec";
  const university = "0xcc37e6de9f8c79721c9bddca232f4db4f23b8828";
  const certificateName = "asdasd";
  const personNameHash = "0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d";
  const emailHash = "0x1921296f1107eb035f8d529d6df86f2c05156a1bb0370fa89c0d935c9e5ba0d0";
  const issueDate = 1763728334;
  const expirationDate = 1764464640;
  const metadataURI = "https://sepolia.etherscan.io/address/0xcc37e6de9f8c79721c9bddca232f4db4f23b88283#tokentxns";

  const contractAddress = "0x32428b5e6471e04a33361de685397c25f90c31fe";

  // Domain separator
  const DOMAIN_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
  );

  const domainSeparator = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        DOMAIN_TYPEHASH,
        ethers.keccak256(ethers.toUtf8Bytes("CertificateAuthority")),
        ethers.keccak256(ethers.toUtf8Bytes("1")),
        11155111,
        contractAddress
      ]
    )
  );

  console.log("Domain Separator:", domainSeparator);

  // Certificate typehash
  const CERTIFICATE_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes("IssueCertificate(bytes32 certId,address university,string certificateName,bytes32 personNameHash,bytes32 emailHash,uint256 issueDate,uint256 expirationDate,string metadataURI)")
  );

  console.log("Certificate Typehash:", CERTIFICATE_TYPEHASH);

  // Struct hash - EIP-712 standard way (strings are hashed)
  const structHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "bytes32", "address", "bytes32", "bytes32", "bytes32", "uint256", "uint256", "bytes32"],
      [
        CERTIFICATE_TYPEHASH,
        certId,
        university,
        ethers.keccak256(ethers.toUtf8Bytes(certificateName)),
        personNameHash,
        emailHash,
        issueDate,
        expirationDate,
        ethers.keccak256(ethers.toUtf8Bytes(metadataURI))
      ]
    )
  );

  console.log("Struct Hash:", structHash);

  // Final digest
  const digest = ethers.keccak256(
    ethers.solidityPacked(
      ["string", "bytes32", "bytes32"],
      ["\x19\x01", domainSeparator, structHash]
    )
  );

  console.log("Expected Digest:", digest);
  console.log("\nThis should match what MetaMask signed");

  // Now let's check the signature recovery
  const signature = "0xc374b42b56aeea5523e2454522f75797486de499f314a8fed69475c9ebd7a1f25896bf4bb9978da0b74aa0909973093dfb0187b5ab31f1d6bba991c140209862";

  console.log("\nSignature (r+s):", signature);

  // Try both v values
  for (let v of [27, 28]) {
    const fullSig = signature + (v === 27 ? "1b" : "1c");
    try {
      const recovered = ethers.recoverAddress(digest, fullSig);
      console.log(`\nV=${v}: Recovered address: ${recovered}`);
      console.log(`Match with ${university}:`, recovered.toLowerCase() === university.toLowerCase());
    } catch (e) {
      console.log(`\nV=${v}: Recovery failed:`, e.message);
    }
  }
}

testSignature().catch(console.error);
