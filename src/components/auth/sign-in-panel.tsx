"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase-auth";

type Props = {
  title?: string;
  subtitle?: string;
};

export function SignInPanel({
  title = "Welcome to Disc Golf Journey",
  subtitle = "Track your achievements, celebrate your progress, and become a better disc golfer.",
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // Safety net: if auth finishes and there's still no user, re-enable UI
  useEffect(() => {
    if (!loading && !user) {
      setSigningIn(false);
    }
  }, [loading, user]);

  const handleSignIn = () => {
    if (signingIn || loading) return;
    console.error("LOGIN: routing to /auth/callback?start=1");
    setSigningIn(true);
    router.push("/auth/callback?start=1");
  };

  const disabled = signingIn || loading;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-4xl font-bold mb-6">{title}</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">{subtitle}</p>

      <Button size="lg" onClick={handleSignIn} disabled={disabled}>
        {disabled ? "Signing in..." : "Sign in with Google"}
      </Button>

      <p className="text-sm text-gray-500 mt-4">Sign in with Google to get started</p>
    </div>
  );
}
