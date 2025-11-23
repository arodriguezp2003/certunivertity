import { NextRequest, NextResponse } from "next/server";
import { query, initDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionName, email, password, walletAddress } = body;

    // Validate input
    if (!institutionName || !email || !password || !walletAddress) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Initialize database if needed
    try {
      await initDatabase();
    } catch (dbError) {
      console.log("Database already initialized or error:", dbError);
    }

    // Check if email already exists
    const existingUser = await query(
      "SELECT id FROM universities WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if wallet already exists
    const existingWallet = await query(
      "SELECT id FROM universities WHERE wallet_address = $1",
      [walletAddress.toLowerCase()]
    );

    if (existingWallet.rows.length > 0) {
      return NextResponse.json(
        { error: "Wallet address already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new university
    const result = await query(
      `INSERT INTO universities (name, email, password_hash, wallet_address, credits, has_free_tokens_claimed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, wallet_address, credits`,
      [institutionName, email.toLowerCase(), passwordHash, walletAddress.toLowerCase(), 0, false]
    );

    const university = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: "University registered successfully",
        university: {
          id: university.id,
          name: university.name,
          email: university.email,
          walletAddress: university.wallet_address,
          credits: university.credits,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
