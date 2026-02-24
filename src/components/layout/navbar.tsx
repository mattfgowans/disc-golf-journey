"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase-auth";
import { PendingRequestsBell } from "@/components/notifications/pending-requests-bell";

export function Navbar() {
  const { user, loading, redirectSettling, signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    if (loading || redirectSettling) return;
    console.log("LOGIN -> signInWithGoogle");
    await signInWithGoogle();
  };

  if (loading) {
    return (
      <nav id="dg-navbar" className="sticky top-0 z-50 relative flex items-center justify-center h-[60px] border-b bg-background shadow-sm">
        <Link href="/">
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
            Disc Golf Journey
          </h1>
        </Link>
      </nav>
    );
  }

  return (
    <nav id="dg-navbar" className="sticky top-0 z-50 relative flex items-center justify-center h-[60px] border-b bg-background shadow-sm">
      <Link href="/">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Disc Golf Journey
        </h1>
      </Link>
      <div className="absolute right-4 flex items-center">
        {!user ? (
          <Button
            variant="ghost"
            onClick={handleSignIn}
            disabled={loading || redirectSettling}
          >
            {redirectSettling ? "Signing in…" : "Sign in with Google"}
          </Button>
        ) : (
          <Link
            href="/notifications"
            className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-transparent"
            aria-label="Notifications"
          >
            <PendingRequestsBell />
          </Link>
        )}
      </div>
    </nav>
  );
}

