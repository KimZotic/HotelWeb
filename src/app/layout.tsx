import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // <-- Tambah baris ini

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "MUSE ECOPARK | Premium Homestay",
  description: "Elegance meets nature.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-muse-bg text-gray-900 antialiased`}>
        <Navbar /> {/* <-- Tambah komponen ini di sini */}
        {children}
      </body>
    </html>
  );
}