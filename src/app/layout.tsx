import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthDebugHud } from "@/components/AuthDebugHud";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/lib/firebase-auth";

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
      <body className="font-sans">
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Suspense fallback={null}>
            <AuthDebugHud />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
