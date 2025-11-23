const { ethers } = require('ethers');

// Test data (using lowercase to avoid checksum issues in test)
const certId = "0x8e719171b444007e92cb091f7c065dda83e7349083fd1c28ba79da2fd9306dfe";
const university = "0xcc37e6de9f8c79721c9bddca232f4db4f23b8828";
const certificateName = "Demo demo";
const personNameHash = "0x33643e6f091103d475925854a8139abcb9dd859f4906fbe92113c2839df55243";
const emailHash = "0x6e3175e6ba76d8655d50e850536ae862697b55e22512fe0aad0b9ef3ddd36a16";
const issueDate = 1763693969;
const expirationDate = 1764298752;
const metadataURI = "https://google.dl";

const contractAddress = "0x32428b5e6471e04a33361de685397c25f90c31fe";
const chainId = 11155111;

console.log("Testing EIP-712 Signature Construction\n");

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
      chainId,
      contractAddress
    ]
  )
);

console.log("Domain Separator:", domainSeparator);

// Certificate typehash - exactly as in contract
const CERTIFICATE_TYPEHASH = ethers.keccak256(
  ethers.toUtf8Bytes("IssueCertificate(bytes32 certId,address university,string certificateName,bytes32 personNameHash,bytes32 emailHash,uint256 issueDate,uint256 expirationDate,string metadataURI)")
);

console.log("Certificate Typehash:", CERTIFICATE_TYPEHASH);

// Struct hash - exactly as contract does it (with hashed strings)
const structHash = ethers.keccak256(
  ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "address", "bytes32", "bytes32", "bytes32", "uint256", "uint256", "bytes32"],
    [
      CERTIFICATE_TYPEHASH,
      certId,
      university,
      ethers.keccak256(ethers.toUtf8Bytes(certificateName)), // Hash the string
      personNameHash,
      emailHash,
      issueDate,
      expirationDate,
      ethers.keccak256(ethers.toUtf8Bytes(metadataURI)) // Hash the string
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

console.log("Final Digest:", digest);
console.log("\nThis is the hash that should be signed by the university wallet");
