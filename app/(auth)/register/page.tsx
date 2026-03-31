"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { user, loading, redirectSettling, redirectError, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    console.log("LOGIN -> signInWithGoogle");
    await signInWithGoogle();
  };

  if (loading || redirectSettling) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start Your Journey</CardTitle>
          <CardDescription>
            Sign in with Google to track your disc golf achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirectError && (
            <p className="mb-4 text-sm text-red-600">{redirectError}</p>
          )}
          <Button
            onClick={handleSignIn}
            disabled={loading || redirectSettling}
            className="w-full"
            size="lg"
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
