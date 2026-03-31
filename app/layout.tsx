export const dynamic = "force-dynamic";
"use client";

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
// import InstallPrompt from "@/components/install-prompt";
// import PWARegister from "@/components/pwa-register";
import { AuthDebugHud } from "@/components/AuthDebugHud";
import { BetaBanner } from "@/components/layout/beta-banner";
import { HeaderProvider } from "@/components/layout/header-context";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/lib/firebase-auth";

export const metadata: Metadata = {
  title: "Disc Golf Journey",
  description: "Track achievements, progress, and milestones in your disc golf journey.",
  manifest: "/manifest.webmanifest",
  applicationName: "Disc Golf Journey",
  appleWebApp: {
    capable: true,
    title: "Disc Golf Journey",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
