import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { BrandProvider } from "@/lib/contexts/brand-context";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI智能招聘助手 - 餐饮兼职招聘平台",
  description:
    "基于AI的智能招聘助手平台，专为餐饮品牌提供高效的兼职招聘解决方案。支持多品牌门店管理、智能候选人匹配、自动化面试邀约，让招聘更精准、更高效。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <BrandProvider>
            {children}
            <Toaster />
            <Analytics />
          </BrandProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
