export const dynamic = "force-dynamic";

import "./globals.css";
import type { Metadata } from "next";
import { HeaderProvider } from "@/components/layout/header-context";
import { OrientationGuard } from "@/components/layout/orientation-guard";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/lib/firebase-auth";

export const metadata: Metadata = {
  title: "Disc Golf Journey",
  description: "Track your progress",
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
          <OrientationGuard />
          <HeaderProvider>
            <Navbar />
            <div className="px-4 pb-24 max-w-screen-md mx-auto w-full">
              {children}
            </div>
            <BottomNav />
          </HeaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
