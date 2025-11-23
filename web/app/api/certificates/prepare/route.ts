import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashString } from "@/lib/blockchain";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { universityId, universityAddress, studentName, studentEmail, certificateName, expirationDate, metadataURI } = body;

    // Validate input
    if (!universityId || !universityAddress || !studentName || !studentEmail || !certificateName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get university data
    const universityResult = await query(
      `SELECT id, name, wallet_address, credits
       FROM universities
       WHERE id = $1`,
      [universityId]
    );

    if (universityResult.rows.length === 0) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      );
    }

    const university = universityResult.rows[0];

    // Check if university has enough credits
    if (university.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Verify wallet address matches
    if (universityAddress.toLowerCase() !== university.wallet_address.toLowerCase()) {
      return NextResponse.json(
        { error: "Wallet address mismatch" },
        { status: 403 }
      );
    }

    // Generate certificate ID (unique hash)
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 1000000);
    const certId = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "string", "uint256", "uint256"],
        [university.wallet_address, studentEmail.toLowerCase(), timestamp, nonce]
      )
    );

    // Hash sensitive data
    const personNameHash = hashString(studentName.trim());
    const emailHash = hashString(studentEmail.toLowerCase().trim());

    // Convert expiration date to timestamp (or 0 if not provided)
    let expirationTimestamp = 0;
    if (expirationDate) {
      expirationTimestamp = Math.floor(new Date(expirationDate).getTime() / 1000);
    }

    const certificateData = {
      certId,
      university: university.wallet_address,
      certificateName,
      personNameHash,
      emailHash,
      issueDate: timestamp,
      expirationDate: expirationTimestamp,
      metadataURI: metadataURI || "",
      // Store original data for database
      studentName,
      studentEmail,
      universityId,
    };

    // Create EIP-712 typed data matching the contract's CERTIFICATE_TYPEHASH
    const contractAddress = process.env.NEXT_PUBLIC_CERTIFICATE_AUTHORITY_ADDRESS;

    const domain = {
      name: "CertificateAuthority",
      version: "1",
      chainId: 11155111,
      verifyingContract: contractAddress,
    };

    // Must match the contract's CERTIFICATE_TYPEHASH exactly
    const types = {
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

    const message = {
      certId: certificateData.certId,
      university: certificateData.university,
      certificateName: certificateName,
      personNameHash: certificateData.personNameHash,
      emailHash: certificateData.emailHash,
      issueDate: certificateData.issueDate,
      expirationDate: certificateData.expirationDate,
      metadataURI: metadataURI || "",
    };

    const typedData = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        ...types,
      },
      domain,
      primaryType: "IssueCertificate",
      message,
    };

    return NextResponse.json(
      {
        success: true,
        certificateData,
        typedData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Prepare certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
