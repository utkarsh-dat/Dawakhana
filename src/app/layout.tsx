import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DawaKhana | Premium Online Pharmacy",
  description: "Experience the future of healthcare with DawaKhana. Clean, trustworthy, and professional online pharmacy.",
};

import { CartProvider } from "@/context/CartContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-inter antialiased bg-background text-foreground`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
