"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { shouldPreferRedirect } from "@/lib/authEnv";
import { useAuth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, redirectError, redirectSettling } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      if (shouldPreferRedirect()) {
        router.push("/auth/callback?start=1");
        return;
      }
      await signInWithGoogle();
      // Redirect will happen automatically via useEffect
    } catch (error) {
      console.error("Error signing in:", error);
      setSigningIn(false);
    }
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  if (loading || redirectSettling) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Continue Your Journey</CardTitle>
          <CardDescription>
            Sign in with Google to access your achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirectError && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {redirectError}
            </div>
          )}
          <Button
            onClick={handleSignIn}
            disabled={loading || redirectSettling || signingIn}
            className="w-full"
            size="lg"
          >
            {loading || redirectSettling || signingIn ? "Signing in..." : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
