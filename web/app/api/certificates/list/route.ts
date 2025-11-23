import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const universityId = searchParams.get("universityId");

    if (!universityId) {
      return NextResponse.json(
        { error: "University ID is required" },
        { status: 400 }
      );
    }

    // Get all certificates for this university
    const result = await query(
      `SELECT
        id, cert_id, student_name, student_email, certificate_name,
        issue_date, expiration_date, metadata_uri, tx_hash, valid, created_at
       FROM certificates
       WHERE university_id = $1
       ORDER BY created_at DESC`,
      [universityId]
    );

    return NextResponse.json(
      {
        success: true,
        certificates: result.rows,
        total: result.rows.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("List certificates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
