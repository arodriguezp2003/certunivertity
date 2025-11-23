// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CertificateAuthority
 * @dev Contract for managing university certificates with meta-transaction support
 * Only the owner (backend) can issue and revoke certificates
 * Supports gasless meta-transactions using EIP-712 signatures
 */
contract CertificateAuthority is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // EIP-712 Domain
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    bytes32 private constant CERTIFICATE_TYPEHASH =
        keccak256(
            "IssueCertificate(bytes32 certId,address university,string certificateName,bytes32 personNameHash,bytes32 emailHash,uint256 issueDate,uint256 expirationDate,string metadataURI)"
        );

    bytes32 private immutable DOMAIN_SEPARATOR;

    struct Certificate {
        bytes32 certId; // Unique certificate ID
        address university; // University that issued the certificate
        string certificateName; // Name of the certificate/degree
        bytes32 personNameHash; // Hash of student's full name (for privacy)
        bytes32 emailHash; // Hash of student's email (for privacy)
        uint256 issueDate; // Timestamp of issuance
        uint256 expirationDate; // Expiration timestamp (0 = never expires)
        string metadataURI; // URI to additional metadata (IPFS, etc.)
        bool valid; // Whether the certificate is currently valid
    }

    // Mapping from certificate ID to Certificate
    mapping(bytes32 => Certificate) public certificates;

    // Mapping to track which certificate IDs exist
    mapping(bytes32 => bool) public certificateExists;

    // Nonces for meta-transactions (prevent replay attacks)
    mapping(address => uint256) public nonces;

    // Events
    event CertificateIssued(
        bytes32 indexed certId,
        address indexed university,
        string certificateName,
        uint256 issueDate
    );

    event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy);

    constructor() Ownable(msg.sender) {
        // Initialize EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("CertificateAuthority")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Issues a certificate directly (only owner can call)
     * @param certId Unique certificate identifier
     * @param university Address of the issuing university
     * @param certificateName Name of the certificate
     * @param personNameHash Hash of the student's name
     * @param emailHash Hash of the student's email
     * @param issueDate Timestamp of issuance
     * @param expirationDate Expiration timestamp (0 for no expiration)
     * @param metadataURI URI to additional metadata
     */
    function issueCertificate(
        bytes32 certId,
        address university,
        string memory certificateName,
        bytes32 personNameHash,
        bytes32 emailHash,
        uint256 issueDate,
        uint256 expirationDate,
        string memory metadataURI
    ) external onlyOwner {
        require(!certificateExists[certId], "CertificateAuthority: certificate already exists");
        require(university != address(0), "CertificateAuthority: invalid university address");
        require(bytes(certificateName).length > 0, "CertificateAuthority: certificate name required");
        require(issueDate > 0, "CertificateAuthority: invalid issue date");

        certificates[certId] = Certificate({
            certId: certId,
            university: university,
            certificateName: certificateName,
            personNameHash: personNameHash,
            emailHash: emailHash,
            issueDate: issueDate,
            expirationDate: expirationDate,
            metadataURI: metadataURI,
            valid: true
        });

        certificateExists[certId] = true;

        emit CertificateIssued(certId, university, certificateName, issueDate);
    }

    /**
     * @dev Issues a certificate using a meta-transaction (gasless)
     * The university signs the data, and the backend submits it
     *
     * @param certId Unique certificate identifier
     * @param university Address of the issuing university
     * @param certificateName Name of the certificate
     * @param personNameHash Hash of the student's name
     * @param emailHash Hash of the student's email
     * @param issueDate Timestamp of issuance
     * @param expirationDate Expiration timestamp (0 for no expiration)
     * @param metadataURI URI to additional metadata
     * @param v Signature component
     * @param r Signature component
     * @param s Signature component
     */
    function issueCertificateWithSignature(
        bytes32 certId,
        address university,
        string memory certificateName,
        bytes32 personNameHash,
        bytes32 emailHash,
        uint256 issueDate,
        uint256 expirationDate,
        string memory metadataURI,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        require(!certificateExists[certId], "CertificateAuthority: certificate already exists");
        require(university != address(0), "CertificateAuthority: invalid university address");
        require(bytes(certificateName).length > 0, "CertificateAuthority: certificate name required");
        require(issueDate > 0, "CertificateAuthority: invalid issue date");

        // Construct the EIP-712 hash
        // According to EIP-712, string and bytes types should be hashed
        // This is done automatically by abi.encode for the typehash
        bytes32 structHash = keccak256(
            abi.encode(
                CERTIFICATE_TYPEHASH,
                certId,
                university,
                keccak256(bytes(certificateName)),  // EIP-712 requires hashing strings
                personNameHash,
                emailHash,
                issueDate,
                expirationDate,
                keccak256(bytes(metadataURI))  // EIP-712 requires hashing strings
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        // Recover the signer from the signature
        address signer = ECDSA.recover(digest, v, r, s);

        // Verify that the signer is the university
        require(signer == university, "CertificateAuthority: invalid signature");

        // Issue the certificate
        certificates[certId] = Certificate({
            certId: certId,
            university: university,
            certificateName: certificateName,
            personNameHash: personNameHash,
            emailHash: emailHash,
            issueDate: issueDate,
            expirationDate: expirationDate,
            metadataURI: metadataURI,
            valid: true
        });

        certificateExists[certId] = true;

        emit CertificateIssued(certId, university, certificateName, issueDate);
    }

    /**
     * @dev Revokes a certificate (only owner can call)
     * @param certId The certificate ID to revoke
     */
    function revokeCertificate(bytes32 certId) external onlyOwner {
        require(certificateExists[certId], "CertificateAuthority: certificate does not exist");
        require(certificates[certId].valid, "CertificateAuthority: certificate already revoked");

        certificates[certId].valid = false;

        emit CertificateRevoked(certId, msg.sender);
    }

    /**
     * @dev Checks if a certificate is valid
     * @param certId The certificate ID to check
     * @return bool True if the certificate exists and is valid
     */
    function isCertificateValid(bytes32 certId) external view returns (bool) {
        if (!certificateExists[certId]) {
            return false;
        }

        Certificate memory cert = certificates[certId];

        // Check if revoked
        if (!cert.valid) {
            return false;
        }

        // Check if expired
        if (cert.expirationDate > 0 && block.timestamp > cert.expirationDate) {
            return false;
        }

        return true;
    }

    /**
     * @dev Gets complete certificate information
     * @param certId The certificate ID
     * @return Certificate struct with all details
     */
    function getCertificate(bytes32 certId) external view returns (Certificate memory) {
        require(certificateExists[certId], "CertificateAuthority: certificate does not exist");
        return certificates[certId];
    }

    /**
     * @dev Verifies a student's certificate by matching hashes
     * @param certId The certificate ID
     * @param personNameHash Hash of the person's name to verify
     * @param emailHash Hash of the email to verify
     * @return bool True if the hashes match and certificate is valid
     */
    function verifyCertificate(
        bytes32 certId,
        bytes32 personNameHash,
        bytes32 emailHash
    ) external view returns (bool) {
        if (!certificateExists[certId]) {
            return false;
        }

        Certificate memory cert = certificates[certId];

        // Check validity
        if (!cert.valid) {
            return false;
        }

        // Check expiration
        if (cert.expirationDate > 0 && block.timestamp > cert.expirationDate) {
            return false;
        }

        // Verify hashes match
        return (cert.personNameHash == personNameHash && cert.emailHash == emailHash);
    }

    /**
     * @dev Returns the EIP-712 domain separator
     * @return bytes32 The domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }
}
