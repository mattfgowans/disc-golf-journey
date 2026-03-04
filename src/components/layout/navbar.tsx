"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/navigation/BackButton";
import { useHeader } from "@/components/layout/header-context";
import { PendingRequestsBell } from "@/components/notifications/pending-requests-bell";
import { useAuth } from "@/lib/firebase-auth";

function normalizePath(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const ROOT_TAB_PATHS = new Set(["/dashboard", "/leaderboard", "/friends", "/patches", "/profile"]);

function isRootTabPath(normalizedPath: string): boolean {
  return ROOT_TAB_PATHS.has(normalizedPath);
}

function getBackButtonConfig(pathname: string): { fallbackHref: string } | null {
  const path = normalizePath(pathname) || "/";
  if (path === "/u") return { fallbackHref: "/friends" };
  if (path === "/club") return { fallbackHref: "/leaderboard?tab=club" };
  if (path.startsWith("/club/")) return { fallbackHref: "/leaderboard?tab=club" };
  if (path.startsWith("/dashboard/")) return { fallbackHref: "/dashboard" };
  if (path.startsWith("/leaderboard/")) return { fallbackHref: "/leaderboard" };
  if (path.startsWith("/friends/")) return { fallbackHref: "/friends" };
  if (path.startsWith("/patches/")) return { fallbackHref: "/patches" };
  if (path.startsWith("/profile/")) return { fallbackHref: "/profile" };
  return null;
}

export function Navbar() {
  const pathname = usePathname();
  const { header } = useHeader();
  const { user, loading, redirectSettling, signInWithGoogle } = useAuth();

  const backConfig = getBackButtonConfig(pathname);
  const normalizedPath = normalizePath(pathname);

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

  const center = header?.title ?? (
    <Link href="/">
      <h1 className="text-lg font-semibold">Disc Golf Journey</h1>
    </Link>
  );

  const rightDefault = !user ? (
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
  );

  return (
    <nav
      id="dg-navbar"
      className="sticky top-0 z-50 relative flex items-center justify-center h-[60px] border-b bg-background shadow-sm"
    >
      {/* Left slot */}
      <div className="absolute left-2 flex items-center sm:left-4">
        {isRootTabPath(normalizedPath)
          ? null
          : header?.left
            ? header.left
            : backConfig
              ? <BackButton fallbackHref={backConfig.fallbackHref} label="Back" className="-ml-1 h-8 px-2" />
              : null}
      </div>

      {/* Center */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {center}
      </div>

      {/* Right slot */}
      <div className="absolute right-4 flex items-center">
        {header?.right ?? rightDefault}
      </div>
    </nav>
  );
}

