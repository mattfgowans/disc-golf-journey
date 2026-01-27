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
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, redirectError } = useAuth();
  const router = useRouter();
  const [settling, setSettling] = useState(true);

  // Auth settling delay to prevent login UI flash after mobile auth redirect
  useEffect(() => {
    const timer = setTimeout(() => setSettling(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setSettling(true);
    try {
      await signInWithGoogle();
      // Redirect will happen automatically via useEffect
    } catch (error) {
      console.error("Error signing in:", error);
      setSettling(false);
    }
  };

  if (user) {
    return null; // Will redirect via useEffect
  }

  if (loading || settling) {
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
          <Button onClick={handleSignIn} className="w-full" size="lg">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
