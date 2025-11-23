import { ethers } from "ethers";

// Contract ABIs (simplified for the functions we need)
export const CERTUNI_TOKEN_ABI = [
  "function mintFor(address to, uint256 amountInWholeTokens) external",
  "function burnFrom(address from, uint256 amountInWholeTokens) external",
  "function balanceOfInWholeTokens(address account) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

export const CERTIFICATE_AUTHORITY_ABI = [
  "function issueCertificate(bytes32 certId, address university, string certificateName, bytes32 personNameHash, bytes32 emailHash, uint256 issueDate, uint256 expirationDate, string metadataURI) external",
  "function issueCertificateWithSignature(bytes32 certId, address university, string certificateName, bytes32 personNameHash, bytes32 emailHash, uint256 issueDate, uint256 expirationDate, string metadataURI, uint8 v, bytes32 r, bytes32 s) external",
  "function revokeCertificate(bytes32 certId) external",
  "function isCertificateValid(bytes32 certId) external view returns (bool)",
  "function getCertificate(bytes32 certId) external view returns (tuple(bytes32 certId, address university, string certificateName, bytes32 personNameHash, bytes32 emailHash, uint256 issueDate, uint256 expirationDate, string metadataURI, bool valid))",
  "function verifyCertificate(bytes32 certId, bytes32 personNameHash, bytes32 emailHash) external view returns (bool)",
  "function getDomainSeparator() external view returns (bytes32)",
];

// Get provider for Sepolia
export function getProvider() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("Sepolia RPC URL not configured");
  }
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Get backend signer (for relaying transactions)
export function getBackendSigner() {
  const provider = getProvider();
  const privateKey = process.env.BACKEND_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Backend private key not configured");
  }

  return new ethers.Wallet(privateKey, provider);
}

// Get CertUniToken contract instance
export function getCertUniTokenContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = process.env.NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS;
  if (!address) {
    throw new Error("CertUniToken address not configured");
  }

  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(address, CERTUNI_TOKEN_ABI, provider);
}

// Get CertificateAuthority contract instance
export function getCertificateAuthorityContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = process.env.NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS;
  if (!address) {
    throw new Error("CertificateAuthority address not configured");
  }

  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(address, CERTIFICATE_AUTHORITY_ABI, provider);
}

// Mint tokens to a university
export async function mintTokensToUniversity(universityAddress: string, amount: number) {
  const signer = getBackendSigner();
  const contract = getCertUniTokenContract(signer);

  const tx = await contract.mintFor(universityAddress, amount);
  await tx.wait();

  return tx.hash;
}

// Burn tokens from a university
export async function burnTokensFromUniversity(universityAddress: string, amount: number) {
  const signer = getBackendSigner();
  const contract = getCertUniTokenContract(signer);

  const tx = await contract.burnFrom(universityAddress, amount);
  await tx.wait();

  return tx.hash;
}

// Get university token balance
export async function getUniversityBalance(universityAddress: string): Promise<number> {
  const contract = getCertUniTokenContract();
  const balance = await contract.balanceOfInWholeTokens(universityAddress);
  return Number(balance);
}

// Hash a string (for name and email privacy)
export function hashString(input: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}

// Issue a certificate (direct method, owner only)
export async function issueCertificate(params: {
  certId: string;
  university: string;
  certificateName: string;
  personNameHash: string;
  emailHash: string;
  issueDate: number;
  expirationDate: number;
  metadataURI: string;
}) {
  const signer = getBackendSigner();
  const contract = getCertificateAuthorityContract(signer);

  const tx = await contract.issueCertificate(
    params.certId,
    params.university,
    params.certificateName,
    params.personNameHash,
    params.emailHash,
    params.issueDate,
    params.expirationDate,
    params.metadataURI
  );

  await tx.wait();
  return tx.hash;
}

// Issue a certificate with signature (meta-transaction)
export async function issueCertificateWithSignature(
  params: {
    certId: string;
    university: string;
    certificateName: string;
    personNameHash: string;
    emailHash: string;
    issueDate: number;
    expirationDate: number;
    metadataURI: string;
  },
  signature: { v: number; r: string; s: string }
) {
  const signer = getBackendSigner();
  const contract = getCertificateAuthorityContract(signer);

  const tx = await contract.issueCertificateWithSignature(
    params.certId,
    params.university,
    params.certificateName,
    params.personNameHash,
    params.emailHash,
    params.issueDate,
    params.expirationDate,
    params.metadataURI,
    signature.v,
    signature.r,
    signature.s
  );

  await tx.wait();
  return tx.hash;
}

// Get certificate from blockchain
export async function getCertificateFromBlockchain(certId: string) {
  const contract = getCertificateAuthorityContract();
  const cert = await contract.getCertificate(certId);
  return cert;
}

// Check if certificate is valid
export async function isCertificateValid(certId: string): Promise<boolean> {
  const contract = getCertificateAuthorityContract();
  return await contract.isCertificateValid(certId);
}

// Revoke a certificate
export async function revokeCertificate(certId: string) {
  const signer = getBackendSigner();
  const contract = getCertificateAuthorityContract(signer);

  const tx = await contract.revokeCertificate(certId);
  await tx.wait();

  return tx.hash;
}
