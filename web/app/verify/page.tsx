"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface CertificateData {
  certId: string;
  university: string;
  universityName: string;
  certificateName: string;
  issueDate: number;
  expirationDate: number;
  metadataURI: string;
  valid: boolean;
  studentName?: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("certId");

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!certId) {
      setError("No certificate ID provided");
      setLoading(false);
      return;
    }

    fetchCertificate(certId);
  }, [certId]);

  const fetchCertificate = async (id: string) => {
    try {
      const response = await fetch(`/api/certificates/verify?certId=${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify certificate");
      }

      if (!data.exists) {
        throw new Error("Certificate not found");
      }

      setCertificate(data.certificate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "Never";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (expirationDate: number) => {
    if (expirationDate === 0) return false;
    return Date.now() / 1000 > expirationDate;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary-600">🎓 Certunivertity</h1>
            </Link>
            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium">
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Certificate Verification
          </h2>
          <p className="text-gray-600">
            Blockchain-verified university certificate
          </p>
        </div>

        {error ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        ) : certificate ? (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Status Banner */}
            {certificate.valid && !isExpired(certificate.expirationDate) ? (
              <div className="bg-green-500 text-white px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xl font-bold">VERIFIED & VALID</span>
                </div>
              </div>
            ) : (
              <div className="bg-red-500 text-white px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xl font-bold">
                    {!certificate.valid ? "REVOKED" : "EXPIRED"}
                  </span>
                </div>
              </div>
            )}

            {/* Certificate Details */}
            <div className="p-8">
              <div className="border-b pb-6 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Certificate Details</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Certificate/Degree
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {certificate.certificateName}
                    </p>
                  </div>

                  {certificate.studentName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Student Name
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {certificate.studentName}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Issuing Institution
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {certificate.universityName || "Unknown"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Issue Date
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(certificate.issueDate)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Expiration Date
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(certificate.expirationDate)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <p className="text-lg font-semibold">
                      {certificate.valid ? (
                        isExpired(certificate.expirationDate) ? (
                          <span className="text-orange-600">Expired</span>
                        ) : (
                          <span className="text-green-600">Valid</span>
                        )
                      ) : (
                        <span className="text-red-600">Revoked</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blockchain Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">🔗 Blockchain Information</h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Certificate ID
                    </label>
                    <p className="text-xs font-mono text-gray-900 break-all bg-white px-3 py-2 rounded">
                      {certificate.certId}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Issuer Wallet Address
                    </label>
                    <p className="text-xs font-mono text-gray-900 break-all bg-white px-3 py-2 rounded">
                      {certificate.university}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Network
                    </label>
                    <p className="text-sm text-gray-900">
                      Ethereum Sepolia Testnet
                    </p>
                  </div>

                  <a
                    href={`https://sepolia.etherscan.io/address/${certificate.university}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View on Etherscan ↗
                  </a>
                </div>
              </div>

              {/* Metadata */}
              {certificate.metadataURI && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">📎 Additional Information</h4>
                  <a
                    href={certificate.metadataURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-sm break-all"
                  >
                    {certificate.metadataURI}
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">ℹ️ About This Verification</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• This certificate is stored on the Ethereum Sepolia blockchain</li>
            <li>• The data cannot be altered or forged</li>
            <li>• Anyone can verify this certificate using the Certificate ID</li>
            <li>• Sensitive student information is hashed for privacy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
