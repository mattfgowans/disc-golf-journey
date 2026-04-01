export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { HeaderProvider } from "@/components/layout/header-context";
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
          <HeaderProvider>
            {children}
          </HeaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
