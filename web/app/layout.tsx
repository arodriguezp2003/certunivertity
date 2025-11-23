import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Certunivertity - Verifiable University Certificates on Blockchain",
  description:
    "Issue unforgeable digital degrees using Ethereum. Demonstration system for blockchain-verified university certificates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
