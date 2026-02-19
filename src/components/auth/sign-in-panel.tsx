"use client";

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
  const { loading, redirectSettling, redirectError, signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    if (loading || redirectSettling) return;
    console.log("LOGIN -> signInWithGoogle");
    await signInWithGoogle();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-4xl font-bold mb-6">{title}</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">{subtitle}</p>

      {redirectError && (
        <p className="mb-4 max-w-xl text-sm text-red-600">{redirectError}</p>
      )}

      <Button size="lg" onClick={handleSignIn} disabled={loading || redirectSettling}>
        {redirectSettling ? "Signing in…" : "Sign in with Google"}
      </Button>

      <p className="text-sm text-gray-500 mt-4">Sign in with Google to get started</p>
    </div>
  );
}
