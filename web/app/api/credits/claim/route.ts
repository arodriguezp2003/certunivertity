import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mintTokensToUniversity } from "@/lib/blockchain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { universityId } = body;

    if (!universityId) {
      return NextResponse.json(
        { error: "University ID is required" },
        { status: 400 }
      );
    }

    // Get university data
    const result = await query(
      `SELECT id, name, wallet_address, credits, has_free_tokens_claimed
       FROM universities
       WHERE id = $1`,
      [universityId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      );
    }

    const university = result.rows[0];

    // Check if already claimed
    if (university.has_free_tokens_claimed) {
      return NextResponse.json(
        { error: "Free credits have already been claimed" },
        { status: 409 }
      );
    }

    // Mint 5 tokens on blockchain
    try {
      const txHash = await mintTokensToUniversity(university.wallet_address, 5);

      // Update database
      await query(
        `UPDATE universities
         SET credits = credits + 5,
             has_free_tokens_claimed = true,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [universityId]
      );

      return NextResponse.json(
        {
          success: true,
          message: "5 CERTUNI tokens minted successfully",
          txHash,
          newBalance: university.credits + 5,
        },
        { status: 200 }
      );
    } catch (blockchainError: any) {
      console.error("Blockchain error:", blockchainError);
      return NextResponse.json(
        { error: "Failed to mint tokens on blockchain: " + blockchainError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Claim credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
