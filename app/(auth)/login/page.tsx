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
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    const isCriOS = /CriOS/i.test(ua); // Chrome iOS
    const isFxiOS = /FxiOS/i.test(ua); // Firefox iOS

    const isKnownInApp =
      /Instagram|FBAN|FBAV|FBIOS|FB_IAB|Line|LinkedInApp|Twitter|TikTok/i.test(ua);

    // Full Safari on iOS typically includes "Version/x" and "Safari"
    const isFullSafari = isIOS && /Safari/i.test(ua) && /Version\//i.test(ua);

    // iOS webviews / in-app browsers often expose window.webkit.messageHandlers
    const hasIOSWebkitHandlers =
      typeof window !== "undefined" &&
      (window as any).webkit &&
      (window as any).webkit.messageHandlers;

    // Treat as in-app if:
    // - it's a known in-app UA OR
    // - it's iOS but NOT full Safari/Chrome/Firefox OR
    // - it has iOS webkit messageHandlers (webview signal)
    const isIOSSuspicious =
      isIOS && !isFullSafari && !isCriOS && !isFxiOS;

    setInApp(Boolean(isKnownInApp || hasIOSWebkitHandlers || isIOSSuspicious));
    setIsIOS(isIOS);
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
            <div className="text-3xl mb-2 text-center">⚠️</div>
            <CardTitle>Open this in Safari to continue</CardTitle>
            <CardDescription className="space-y-2">
              <span className="block">
                This link opened inside Facebook, which blocks Google sign-in.
              </span>
              <span className="block">
                Tap the ••• in the top right corner, then select “Open in Safari” to continue.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard.writeText("https://disc-golf-journey.web.app/login")
              }
              className="w-full"
              size="lg"
            >
              Copy link and open in Safari
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Then paste it into Safari or Chrome
            </p>
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
          {isIOS && (
            <button
              type="button"
              className="mt-2 text-xs text-muted-foreground underline transition-all duration-100 hover:text-foreground active:scale-95"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                } catch {}
                window.location.href = window.location.href;
              }}
            >
              Having trouble? Open in Safari/Chrome
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
