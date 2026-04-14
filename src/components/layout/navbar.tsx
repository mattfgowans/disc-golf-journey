"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/navigation/BackButton";
import { useHeader } from "@/components/layout/header-context";
import { PendingRequestsBell } from "@/components/notifications/pending-requests-bell";
import { useAuth } from "@/lib/firebase-auth";
import { HeaderBar } from "@/components/layout/header";

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
      <nav
        id="dg-navbar"
        className="sticky top-0 z-50 border-b bg-background shadow-sm"
      >
        <div className="relative mx-auto flex h-[60px] w-full max-w-4xl items-center justify-center px-4 sm:px-6">
          <div className="min-w-0 max-w-[min(100%,20rem)] px-8 text-center">
            <Link href="/" className="block min-w-0 truncate text-center transition-all duration-100 active:scale-95">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                Disc Golf Journey
              </h1>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const center = header?.title ?? (
    <Link href="/" className="block min-w-0 truncate text-center transition-all duration-100 active:scale-95">
      <h1 className="truncate text-base font-semibold sm:text-lg">
        Disc Golf Journey
      </h1>
    </Link>
  );

  const rightDefault = !user ? (
    <Button
      variant="ghost"
      onClick={handleSignIn}
      disabled={loading || redirectSettling}
      className="h-9 w-9 shrink-0 px-0 sm:w-auto sm:px-3"
      aria-label={redirectSettling ? "Signing in…" : "Sign in with Google"}
    >
      {/* Icon-only on small screens, icon + text on larger screens */}
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-semibold sm:mr-2">
        G
      </span>
      <span className="hidden truncate whitespace-nowrap text-sm sm:inline">
        {redirectSettling ? "Signing in…" : "Sign in with Google"}
      </span>
    </Button>
  ) : (
    <Link
      href="/notifications"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all duration-100 hover:bg-transparent active:scale-95"
      aria-label="Notifications"
    >
      <PendingRequestsBell />
    </Link>
  );

  const leftSlot =
    !isRootTabPath(normalizedPath) &&
    (header?.left
      ? header.left
      : backConfig
        ? (
          <BackButton
            fallbackHref={backConfig.fallbackHref}
            label="Back"
            className="-ml-1 h-8 px-2"
          />
          )
        : null);

  const leftOffsetForInvite = Boolean(
    user && !isRootTabPath(normalizedPath) && (header?.left || backConfig)
  );

  return (
    <nav
      id="dg-navbar"
      className="sticky top-0 z-50 border-b bg-background shadow-sm"
    >
      <HeaderBar
        center={center}
        right={header?.right ?? rightDefault}
        left={leftSlot}
        user={Boolean(user)}
        leftOffsetForInvite={leftOffsetForInvite}
      />
    </nav>
  );
}

