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
  const { user, loading, redirectSettling, redirectError, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isInApp =
      /Instagram|FBAN|FBAV|FBIOS|FB_IAB|Line|LinkedInApp|Twitter|TikTok/i.test(ua) ||
      (isIOS && !/Safari/i.test(ua)); // iOS in-app webviews often omit "Safari"
    setInApp(isInApp);
  }, []);

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (user) {
    return null; // Will redirect via useEffect
  }

  if (loading || redirectSettling) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">{redirectSettling ? "Signing in…" : "Loading..."}</p>
      </div>
    );
  }

  if (inApp) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Open in Safari to sign in</CardTitle>
            <CardDescription>
              In-app browsers can block Google sign-in. Tap below to open Disc Golf Journey in Safari, then sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => window.open(window.location.href, "_blank")}
              className="w-full"
              size="lg"
            >
              Open in Safari
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="w-full"
              size="lg"
            >
              Copy link
            </Button>
          </CardContent>
        </Card>
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
            onClick={async () => {
              console.log("LOGIN -> signInWithGoogle");
              await signInWithGoogle();
            }}
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
