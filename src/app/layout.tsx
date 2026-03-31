'use client'

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HeaderProvider } from "@/components/layout/header-context";
import { AuthProvider } from "@/lib/firebase-auth";

export const metadata: Metadata = {
  title: "Disc Golf Journey",
  description: "Track achievements, progress, and milestones in your disc golf journey.",
  manifest: "/manifest.webmanifest",
  applicationName: "Disc Golf Journey",
  appleWebApp: {
    capable: true,
    title: "Disc Golf Journey",
    statusBarStyle: "black-translucent",
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
          <HeaderProvider>
            {children}
          </HeaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
