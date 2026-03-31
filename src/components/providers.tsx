"use client";

import { AuthProvider } from "@/lib/firebase-auth";
import { HeaderProvider } from "@/components/layout/header-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HeaderProvider>
        {children}
      </HeaderProvider>
    </AuthProvider>
  );
}
