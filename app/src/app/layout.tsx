import type { Metadata } from "next";
import { Archivo_Black, Inter} from "next/font/google";
import "./globals.css";

// Display font (heading). Archive Black has a single weight -> weight is required.
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archive-black",
});

// Body font. Inter is a variable font, no explicit weight needed.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Solvault - On-chain lottery on Solana (devnet)",
  description: "Provably fair lottery on Solana devnet. Buy a ticket, win the vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${inter.variable}antialiased`}>
      <body>{children}</body>
    </html>
  );
}