import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">🎓 Certunivertity</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            University Certificates
            <br />
            <span className="text-primary-600">Verified on Blockchain</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Issue unforgeable digital degrees using Ethereum.
            Global and instant verification with cryptographic security.
          </p>
          <Link
            href="/register"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            ⚡ 5 free credits to test the platform
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Register Your Institution</h4>
              <p className="text-gray-600">
                Create your account and connect your MetaMask wallet on Sepolia network.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Get CertUni Credits</h4>
              <p className="text-gray-600">
                Receive 5 free credits to test the platform. 1 CertUni = 1 certificate.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Issue Verified Certificates</h4>
              <p className="text-gray-600">
                Each certificate is registered on the blockchain and can be verified via QR code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Benefits
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">✅</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Global Instant Verification</h4>
                <p className="text-gray-600">
                  Anyone in the world can verify the authenticity of a certificate in seconds.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔐</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Cryptographic Security by Design</h4>
                <p className="text-gray-600">
                  Certificates are protected by Ethereum blockchain, impossible to alter.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">QR Code Integration</h4>
                <p className="text-gray-600">
                  Generate QR codes for quick verification from any mobile device.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🚫</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Prevents Forgery</h4>
                <p className="text-gray-600">
                  Blockchain technology makes it virtually impossible to forge or duplicate degrees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meta-Transactions Info */}
      <section className="bg-primary-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            🔥 Gasless Technology (Meta-Transactions)
          </h3>
          <p className="text-lg text-gray-700 mb-4">
            We use <strong>relayed meta-transactions</strong> for a frictionless experience:
          </p>
          <ul className="text-left max-w-2xl mx-auto space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>MetaMask asks for confirmation - you control the authorization</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>No need to pay gas - the system pays for you</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Certificate is issued with your real address</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>100% secure - Signature verified with ECDSA</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="bg-yellow-50 border-y border-yellow-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-yellow-900">
            <strong>⚠️ MVP Note:</strong> This demo grants 5 free credits to test
            the complete certificate issuance flow on blockchain. No real payments are processed;
            all token purchase flow is simulated for demonstration purposes.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Register your institution now and receive 5 free credits to issue certificates.
          </p>
          <Link
            href="/register"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Certunivertity - MVP demonstration for blockchain university certificates
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Sepolia Network • Ethereum • Meta-Transactions
          </p>
        </div>
      </footer>
    </div>
  );
}
