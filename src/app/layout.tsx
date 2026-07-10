import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DawaKhana | Premium Online Pharmacy - Authentic Medicines Delivered",
    template: "%s | DawaKhana Online Pharmacy",
  },
  description: "DawaKhana - Your trusted online pharmacy for authentic medicines. Buy cardiac, diabetic, psychiatric medicines at best prices. Free delivery on orders above ₹200. 100% genuine products with COD available.",
  keywords: [
    "online pharmacy",
    "buy medicines online",
    "authentic medicines",
    "cardiac medicines",
    "diabetic medicines",
    "psychiatric medicines",
    "medicine delivery",
    "pharmacy India",
    "dawakhana",
    "online medical store",
    "prescription medicines",
    "healthcare products",
  ],
  authors: [{ name: "DawaKhana" }],
  creator: "DawaKhana",
  publisher: "DawaKhana",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://dawakhana.netlify.app",
    siteName: "DawaKhana Online Pharmacy",
    title: "DawaKhana | Premium Online Pharmacy - Authentic Medicines Delivered",
    description: "Your trusted online pharmacy for authentic medicines. Buy cardiac, diabetic, psychiatric medicines at best prices with free delivery.",
    images: [
      {
        url: "/images/logo.jpg",
        width: 1200,
        height: 630,
        alt: "DawaKhana - Online Pharmacy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DawaKhana | Premium Online Pharmacy",
    description: "Your trusted online pharmacy for authentic medicines. Free delivery on orders above ₹200.",
    images: ["/images/logo.jpg"],
  },
  alternates: {
    canonical: "https://dawakhana.netlify.app",
  },
  category: "Healthcare",
};
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import JsonLd from "@/components/JsonLd";
import ChatBot from "@/components/ChatBot";

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
        <JsonLd />
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              {children}
              <ChatBot />
              {/* Version 1.2: SEO Updated */}
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
