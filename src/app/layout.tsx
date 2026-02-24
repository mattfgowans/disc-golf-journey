import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthDebugHud } from "@/components/AuthDebugHud";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/lib/firebase-auth";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Disc Golf Journey",
  description: "Track your disc golf achievements and progress through putting, distance, specialty shots, and social milestones.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-muted/30">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-4xl px-4 pt-4 pb-[calc(88px+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-8">
            <div className="rounded-2xl bg-background shadow-sm ring-1 ring-black/5 p-4 md:p-6">
              {children}
            </div>
          </main>
          <BottomNav />
          <Suspense fallback={null}>
            <AuthDebugHud />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
