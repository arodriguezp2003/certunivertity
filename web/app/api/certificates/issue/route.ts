import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { issueCertificateWithSignature, burnTokensFromUniversity } from "@/lib/blockchain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateData, signature } = body;

    // Validate input
    if (!certificateData || !signature) {
      return NextResponse.json(
        { error: "Missing certificate data or signature" },
        { status: 400 }
      );
    }

    // Validate signature components
    if (!signature.v || !signature.r || !signature.s) {
      return NextResponse.json(
        { error: "Invalid signature format" },
        { status: 400 }
      );
    }

    // Get university data from certificateData
    const { universityId, studentName, studentEmail } = certificateData;

    // Get university data from database
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

    try {
      // Issue certificate on blockchain with signature (meta-transaction)
      const txHash = await issueCertificateWithSignature(
        {
          certId: certificateData.certId,
          university: certificateData.university,
          certificateName: certificateData.certificateName,
          personNameHash: certificateData.personNameHash,
          emailHash: certificateData.emailHash,
          issueDate: certificateData.issueDate,
          expirationDate: certificateData.expirationDate,
          metadataURI: certificateData.metadataURI,
        },
        {
          v: signature.v,
          r: signature.r,
          s: signature.s,
        }
      );

      // Burn 1 token from university
      try {
        await burnTokensFromUniversity(university.wallet_address, 1);
      } catch (burnError) {
        console.error("Token burn error:", burnError);
        // Continue even if burn fails - the important part is the certificate was issued
      }

      // Update database
      await query(
        `UPDATE universities
         SET credits = credits - 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [universityId]
      );

      // Save certificate to database
      await query(
        `INSERT INTO certificates (
          cert_id, university_id, student_name, student_email,
          certificate_name, person_name_hash, email_hash,
          issue_date, expiration_date, metadata_uri, tx_hash, valid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          certificateData.certId,
          universityId,
          studentName,
          studentEmail,
          certificateData.certificateName,
          certificateData.personNameHash,
          certificateData.emailHash,
          certificateData.issueDate,
          certificateData.expirationDate,
          certificateData.metadataURI,
          txHash,
          true,
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Certificate issued successfully with meta-transaction",
          certId: certificateData.certId,
          txHash,
          issueDate: certificateData.issueDate,
        },
        { status: 201 }
      );
    } catch (blockchainError: any) {
      console.error("Blockchain error:", blockchainError);
      return NextResponse.json(
        { error: "Failed to issue certificate on blockchain: " + blockchainError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Issue certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
