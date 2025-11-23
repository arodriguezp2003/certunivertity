import { ethers } from "ethers";

// EIP-712 Domain for CertificateAuthority
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

// Certificate issuance data structure
export interface CertificateIssuanceData {
  certId: string;
  university: string;
  certificateName: string;
  personNameHash: string;
  emailHash: string;
  issueDate: number;
  expirationDate: number;
  metadataURI: string;
}

// Get the EIP-712 domain for the CertificateAuthority contract
export function getEIP712Domain(): EIP712Domain {
  const contractAddress = process.env.NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS;
  if (!contractAddress) {
    throw new Error("CertificateAuthority address not configured");
  }

  return {
    name: "CertificateAuthority",
    version: "1",
    chainId: 11155111, // Sepolia
    verifyingContract: contractAddress,
  };
}

// EIP-712 Type definitions
export const EIP712_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
  IssueCertificate: [
    { name: "certId", type: "bytes32" },
    { name: "university", type: "address" },
    { name: "certificateName", type: "string" },
    { name: "personNameHash", type: "bytes32" },
    { name: "emailHash", type: "bytes32" },
    { name: "issueDate", type: "uint256" },
    { name: "expirationDate", type: "uint256" },
    { name: "metadataURI", type: "string" },
  ],
};

/**
 * Creates the EIP-712 typed data for certificate issuance
 * This is what the university will sign in MetaMask
 */
export function createEIP712TypedData(certificateData: CertificateIssuanceData) {
  const domain = getEIP712Domain();

  return {
    types: {
      EIP712Domain: EIP712_TYPES.EIP712Domain,
      IssueCertificate: EIP712_TYPES.IssueCertificate,
    },
    domain,
    primaryType: "IssueCertificate",
    message: certificateData,
  };
}

/**
 * Splits a signature into v, r, s components
 * Required for calling the smart contract
 */
export function splitSignature(signature: string) {
  const sig = ethers.Signature.from(signature);
  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
  };
}

/**
 * Client-side: Request signature from MetaMask
 * This function should be called from the frontend
 */
export async function requestSignatureFromMetaMask(
  signer: ethers.Signer,
  certificateData: CertificateIssuanceData
): Promise<string> {
  const typedData = createEIP712TypedData(certificateData);

  // Get the signer's address
  const signerAddress = await signer.getAddress();

  // Verify the signer matches the university in the data
  if (signerAddress.toLowerCase() !== certificateData.university.toLowerCase()) {
    throw new Error("Signer address does not match university address");
  }

  // Request signature using EIP-712
  // @ts-ignore - MetaMask provider typing
  const signature = await signer.provider.send("eth_signTypedData_v4", [
    signerAddress,
    JSON.stringify(typedData),
  ]);

  return signature;
}

/**
 * Verify a signature (optional, for testing)
 */
export function verifySignature(
  certificateData: CertificateIssuanceData,
  signature: string,
  expectedSigner: string
): boolean {
  const typedData = createEIP712TypedData(certificateData);

  // Reconstruct the hash
  const domain = getEIP712Domain();
  const domainSeparator = ethers.TypedDataEncoder.hashDomain(domain);
  const structHash = ethers.TypedDataEncoder.hash(domain, EIP712_TYPES, certificateData);

  const digest = ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes("\x19\x01"), domainSeparator, structHash])
  );

  const recoveredAddress = ethers.recoverAddress(digest, signature);

  return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
}
