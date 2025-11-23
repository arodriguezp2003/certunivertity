import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await query(
      `SELECT id, name, email, password_hash, wallet_address, credits, has_free_tokens_claimed
       FROM universities
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const university = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, university.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return user data (excluding password hash)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: university.id,
          name: university.name,
          email: university.email,
          walletAddress: university.wallet_address,
          credits: university.credits,
          hasFreeTokensClaimed: university.has_free_tokens_claimed,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
