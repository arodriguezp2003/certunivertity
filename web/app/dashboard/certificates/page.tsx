"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  name: string;
}

interface Certificate {
  id: number;
  cert_id: string;
  student_name: string;
  student_email: string;
  certificate_name: string;
  issue_date: number;
  expiration_date: number;
  tx_hash: string;
  valid: boolean;
  created_at: string;
}

export default function CertificatesListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchCertificates(userData.id);
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  const fetchCertificates = async (universityId: number) => {
    try {
      const response = await fetch(`/api/certificates/list?universityId=${universityId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch certificates");
      }

      setCertificates(data.certificates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading certificates...</div>
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
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">Issued Certificates</h2>
            <p className="text-gray-600 mt-2">
              All certificates issued by {user.name}
            </p>
          </div>
          <Link
            href="/dashboard/issue"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Issue New
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Certificates Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven&apos;t issued any certificates yet. Start by issuing your first one!
            </p>
            <Link
              href="/dashboard/issue"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Issue First Certificate
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cert.student_name}</div>
                        <div className="text-sm text-gray-500">{cert.student_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{cert.certificate_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(cert.issue_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.valid ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Valid
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/verify?certId=${cert.cert_id}`}
                          target="_blank"
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Verify
                        </Link>
                        <span className="text-gray-300">|</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${cert.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          TX ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {certificates.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-blue-900 font-semibold">Total Certificates Issued: </span>
                <span className="text-blue-800">{certificates.length}</span>
              </div>
              <div>
                <span className="text-blue-900 font-semibold">Valid: </span>
                <span className="text-blue-800">
                  {certificates.filter((c) => c.valid).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
