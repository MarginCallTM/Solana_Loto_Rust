import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is loaded once here and exposed as the CSS variable --font-inter.
// globals.css maps --font-sans and --font-display onto it.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solvault — The On-Chain Lottery on Solana",
  description:
    "Provably fair lottery on Solana. Buy a ticket, win the vault. Transparent, secure, instant payouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
