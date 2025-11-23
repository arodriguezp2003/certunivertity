"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ethers } from "ethers";

interface User {
  id: number;
  name: string;
  email: string;
  walletAddress: string;
  credits: number;
  hasFreeTokensClaimed: boolean;
}

export default function IssueCertificatePage() {
  const router = useRouter();
  const metamask = useMetaMask();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    certificateName: "",
    expirationDate: "",
    metadataURI: "",
  });

  useEffect(() => {
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

  const handleConnectMetaMask = async () => {
    try {
      setError("");
      const account = await metamask.connect();

      if (!user) return;

      // Check if connected wallet matches registered wallet
      if (account.toLowerCase() !== user.walletAddress.toLowerCase()) {
        setError(
          `Wrong wallet connected. Please connect with ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
        );
        return;
      }

      // Check if on Sepolia
      if (metamask.chainId !== 11155111) {
        await metamask.switchToSepolia();
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect MetaMask");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (user.credits < 1) {
      setError("Insufficient credits. You need at least 1 CERTUNI token to issue a certificate.");
      return;
    }

    // Check MetaMask connection
    if (!metamask.isConnected) {
      setError("Please connect your MetaMask wallet first");
      return;
    }

    if (metamask.account?.toLowerCase() !== user.walletAddress.toLowerCase()) {
      setError("Connected wallet does not match your registered wallet");
      return;
    }

    if (metamask.chainId !== 11155111) {
      setError("Please switch to Sepolia network");
      return;
    }

    setIssuing(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Request certificate data from backend (generates certId, hashes, etc.)
      const prepareResponse = await fetch("/api/certificates/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: user.id,
          universityAddress: user.walletAddress,
          ...formData,
        }),
      });

      const prepareData = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || "Failed to prepare certificate");
      }

      // Step 2: Get the typed data
      const typedData = prepareData.typedData;

      // Step 3: Request signature from MetaMask using EIP-712
      setSuccess("Please sign the message in MetaMask...");

      const signature = await metamask.provider!.send("eth_signTypedData_v4", [
        user.walletAddress,
        JSON.stringify(typedData),
      ]);

      // Step 4: Split signature into v, r, s
      const sig = ethers.Signature.from(signature);

      // Step 5: Send signed data to backend
      setSuccess("Submitting to blockchain...");

      const issueResponse = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateData: prepareData.certificateData,
          signature: {
            v: sig.v,
            r: sig.r,
            s: sig.s,
          },
        }),
      });

      const issueData = await issueResponse.json();

      if (!issueResponse.ok) {
        throw new Error(issueData.error || "Failed to issue certificate");
      }

      // Update user credits
      const updatedUser = { ...user, credits: user.credits - 1 };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess(
        `✅ Certificate issued successfully! Certificate ID: ${issueData.certId.slice(0, 10)}... | TX: ${issueData.txHash.slice(0, 10)}...`
      );

      // Reset form
      setFormData({
        studentName: "",
        studentEmail: "",
        certificateName: "",
        expirationDate: "",
        metadataURI: "",
      });

      // Redirect to certificates list after 3 seconds
      setTimeout(() => {
        router.push("/dashboard/certificates");
      }, 3000);
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Signature rejected by user");
      } else {
        setError(err.message || "Failed to issue certificate");
      }
    } finally {
      setIssuing(false);
    }
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
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-primary-600">🎓 Certunivertity</h1>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Credits: <span className="font-bold text-primary-600">{user.credits}</span>
              </span>
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Issue New Certificate</h2>
          <p className="text-gray-600 mt-2">Create a blockchain-verified certificate with MetaMask signature</p>
        </div>

        {/* MetaMask Connection */}
        {!metamask.isInstalled && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-900">
              🦊 <strong>MetaMask not detected.</strong> Please install{" "}
              <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline">
                MetaMask
              </a>{" "}
              to continue.
            </p>
          </div>
        )}

        {metamask.isInstalled && !metamask.isConnected && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 mb-3">
              🦊 <strong>Connect your MetaMask wallet</strong> to sign the certificate issuance
            </p>
            <button
              onClick={handleConnectMetaMask}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect MetaMask
            </button>
          </div>
        )}

        {metamask.isConnected && metamask.chainId !== 11155111 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-900 mb-3">
              ⚠️ <strong>Wrong network.</strong> Please switch to Sepolia Testnet
            </p>
            <button
              onClick={metamask.switchToSepolia}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Switch to Sepolia
            </button>
          </div>
        )}

        {metamask.isConnected && metamask.account?.toLowerCase() !== user.walletAddress.toLowerCase() && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-900">
              ❌ <strong>Wrong wallet connected.</strong> Expected: {user.walletAddress.slice(0, 10)}...
              {user.walletAddress.slice(-4)}
            </p>
          </div>
        )}

        {metamask.isConnected && metamask.chainId === 11155111 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-900 font-semibold">MetaMask Connected</p>
              <p className="text-green-700 text-sm">
                {metamask.account?.slice(0, 6)}...{metamask.account?.slice(-4)} • Sepolia Network
              </p>
            </div>
          </div>
        )}

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

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                Student Full Name *
              </label>
              <input
                id="studentName"
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., John Michael Smith"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be hashed for privacy on blockchain
              </p>
            </div>

            <div>
              <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Student Email *
              </label>
              <input
                id="studentEmail"
                type="email"
                required
                value={formData.studentEmail}
                onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="student@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be hashed for privacy on blockchain
              </p>
            </div>

            <div>
              <label htmlFor="certificateName" className="block text-sm font-medium text-gray-700 mb-2">
                Certificate/Degree Name *
              </label>
              <input
                id="certificateName"
                type="text"
                required
                value={formData.certificateName}
                onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Bachelor of Science in Computer Science"
              />
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date (Optional)
              </label>
              <input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty if certificate never expires
              </p>
            </div>

            <div>
              <label htmlFor="metadataURI" className="block text-sm font-medium text-gray-700 mb-2">
                Metadata URI (Optional)
              </label>
              <input
                id="metadataURI"
                type="url"
                value={formData.metadataURI}
                onChange={(e) => setFormData({ ...formData, metadataURI: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://... or ipfs://..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to additional certificate data (JSON, PDF, etc.)
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">🔥 Gasless Meta-Transaction:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Cost: <strong>1 CERTUNI token</strong></li>
                  <li>• Your balance after: <strong>{user.credits - 1} credits</strong></li>
                  <li>• Network: <strong>Sepolia Testnet</strong></li>
                  <li>• MetaMask will ask you to <strong>sign</strong> (not send transaction)</li>
                  <li>• You will NOT pay gas fees (we pay it for you)</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={issuing || user.credits < 1 || !metamask.isConnected || metamask.chainId !== 11155111}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {issuing ? "Issuing Certificate..." : `Sign & Issue Certificate (1 Credit)`}
              </button>

              {user.credits < 1 && (
                <p className="text-center text-red-600 text-sm mt-2">
                  Insufficient credits. Please claim free credits or purchase more.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
