"use client";

import { AuthProvider } from "@/lib/firebase-auth";
import { HeaderProvider } from "@/components/layout/header-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Prevent running providers during build
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <HeaderProvider>
        {children}
      </HeaderProvider>
    </AuthProvider>
  );
}
