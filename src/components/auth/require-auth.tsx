"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/firebase-auth";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function RequireAuth({
  children,
  title = "Sign in to continue",
  subtitle = "Sign in with Google to access your account.",
}: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <SignInPanel title={title} subtitle={subtitle} />;
  }

  return <>{children}</>;
}
