"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  walletAddress: string;
  credits: number;
  hasFreeTokensClaimed: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingCredits, setClaimingCredits] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleClaimCredits = async () => {
    if (!user) return;

    setClaimingCredits(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/credits/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim credits");
      }

      // Update user data
      const updatedUser = {
        ...user,
        credits: data.newBalance,
        hasFreeTokensClaimed: true,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      const tokenAddress = process.env.NEXT_PUBLIC_CERTUNI_TOKEN_ADDRESS || "0x99ef88b491793B58fE19bbC1cf31eFE7d7Bc9b81";
      setSuccess(`Successfully claimed 5 CERTUNI tokens! Token Address: ${tokenAddress} | Transaction: ${data.txHash.slice(0, 10)}...`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClaimingCredits(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-primary-600">🎓 Certunivertity</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">Manage your certificates and credits</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Institution Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Institution</h3>
            <p className="text-2xl font-bold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          </div>

          {/* Credits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Available Credits</h3>
            <p className="text-4xl font-bold text-primary-600">{user.credits}</p>
            <p className="text-sm text-gray-600 mt-1">CERTUNI tokens</p>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Address</h3>
            <p className="text-sm font-mono text-gray-900 break-all">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Sepolia Network</p>
          </div>
        </div>

        {/* Claim Free Credits */}
        {!user.hasFreeTokensClaimed && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">🎁 Claim Your Free Credits!</h3>
                <p className="text-primary-100">
                  Get 5 free CERTUNI tokens to start issuing certificates
                </p>
              </div>
              <button
                onClick={handleClaimCredits}
                disabled={claimingCredits}
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claimingCredits ? "Claiming..." : "Claim 5 Credits"}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📜</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Issue Certificate</h3>
                <p className="text-gray-600 mb-4">
                  Create a new blockchain-verified certificate for a student
                </p>
                <Link
                  href="/dashboard/issue"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Issue New Certificate
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔍</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">View Certificates</h3>
                <p className="text-gray-600 mb-4">
                  See all certificates issued by your institution
                </p>
                <Link
                  href="/dashboard/certificates"
                  className="inline-block bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 How it works:</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span>1.</span>
              <span>Each certificate costs 1 CERTUNI token</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2.</span>
              <span>You sign with MetaMask (no gas fees required)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3.</span>
              <span>Certificate is registered on Sepolia blockchain</span>
            </li>
            <li className="flex items-start gap-2">
              <span>4.</span>
              <span>Anyone can verify it using the certificate ID or QR code</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
