import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCertificateFromBlockchain, isCertificateValid } from "@/lib/blockchain";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const certId = searchParams.get("certId");

    if (!certId) {
      return NextResponse.json(
        { error: "Certificate ID is required" },
        { status: 400 }
      );
    }

    try {
      // Get certificate from blockchain
      const blockchainCert = await getCertificateFromBlockchain(certId);
      const isValid = await isCertificateValid(certId);

      // Get additional info from database (optional)
      const dbResult = await query(
        `SELECT c.student_name, u.name as university_name
         FROM certificates c
         LEFT JOIN universities u ON c.university_id = u.id
         WHERE c.cert_id = $1`,
        [certId]
      );

      const dbData = dbResult.rows[0] || {};

      return NextResponse.json(
        {
          success: true,
          exists: true,
          certificate: {
            certId: blockchainCert.certId,
            university: blockchainCert.university,
            universityName: dbData.university_name || "Unknown",
            certificateName: blockchainCert.certificateName,
            issueDate: Number(blockchainCert.issueDate),
            expirationDate: Number(blockchainCert.expirationDate),
            metadataURI: blockchainCert.metadataURI,
            valid: isValid,
            studentName: dbData.student_name || null,
          },
        },
        { status: 200 }
      );
    } catch (blockchainError: any) {
      // Certificate not found on blockchain
      if (blockchainError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            success: false,
            exists: false,
            error: "Certificate not found",
          },
          { status: 404 }
        );
      }

      throw blockchainError;
    }
  } catch (error: any) {
    console.error("Verify certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
