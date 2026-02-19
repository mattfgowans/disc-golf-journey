"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { useUserProfile } from "@/lib/useUserProfile";

const DEBUG_AUTH = true;

const ONBOARDING_PATH = "/onboarding/username";
const LOGIN_PATH = "/login";
const DEFAULT_APP_PATH = "/dashboard"; // justified by src/app/dashboard/page.tsx

/** Paths that never force redirect to /login; auth callback must render so getRedirectResult() can run. */
const PUBLIC_PATHS = new Set([
  "/",
  LOGIN_PATH,
  "/register",
  "/auth/callback",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth/callback/")) return true;
  return false;
}

type UsernameStatus = "loading" | "missing" | "present" | "error";

/**
 * RequireAuth responsibilities (centralized):
 * - Logged-out -> /login
 * - Logged-in + no username -> /onboarding/username
 * - Logged-in + username -> cannot access onboarding (even direct URL)
 * - Avoid rendering protected content until decision is settled (prevents flashes)
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading: authLoading, authInitialized, redirectSettling } = useAuth();
  const [redirectProcessing, setRedirectProcessing] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const read = () => sessionStorage.getItem("dgjauth_processing") === "1";

    // initialize
    setRedirectProcessing(read());

    // If redirect is in progress, poll briefly until it clears (max 10s).
    let alive = true;
    let interval: number | null = null;
    let timeout: number | null = null;

    if (read()) {
      interval = window.setInterval(() => {
        if (!alive) return;
        const v = read();
        setRedirectProcessing(v);
        if (!v && interval != null) {
          window.clearInterval(interval);
          interval = null;
        }
      }, 250);

      timeout = window.setTimeout(() => {
        if (!alive) return;
        // Stop polling after 10s to avoid perpetual work
        if (interval != null) window.clearInterval(interval);
        interval = null;
        setRedirectProcessing(read());
      }, 10000);
    }

    return () => {
      alive = false;
      if (interval != null) window.clearInterval(interval);
      if (timeout != null) window.clearTimeout(timeout);
    };
  }, []);

  const {
    profile,
    exists,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(user?.uid);

  // Normalize "has username" to one place.
  const hasUsername = useMemo(() => {
    const username = profile?.username ?? profile?.profile?.username;
    return !!username && typeof username === "string" && username.trim().length > 0;
  }, [profile]);

  // Collapse all profile/username conditions into a single explicit status.
  const usernameStatus: UsernameStatus = useMemo(() => {
    if (authLoading) return "loading";
    if (!user) return "loading"; // auth settled but no user -> handled by redirect; treat as "not ready to render"
    if (profileError) return "error";
    if (profileLoading) return "loading";
    if (exists === null) return "loading";

    // If doc doesn't exist, definitely missing username.
    if (exists === false) return "missing";

    // Doc exists: username presence determines status.
    return hasUsername ? "present" : "missing";
  }, [authLoading, user, profileError, profileLoading, exists, hasUsername]);

  // Compute the one route we should be on (or null = ok to stay).
  const desiredPath = useMemo(() => {
    // 0) Public paths: never redirect, let the page render (critical for /auth/callback + getRedirectResult).
    if (isPublicPath(pathname)) {
      return null;
    }

    // 0b) Do NOT redirect while initiating sign-in redirect or redirect-in-progress.
    if (redirectSettling) return null;

    // 0c) Do NOT redirect while sessionStorage indicates redirect sign-in in progress.
    if (redirectProcessing) return null;

    // 1) Not logged in -> login. Only redirect when auth initialized, loading done, and user is null.
    if (authInitialized && !authLoading && !redirectSettling && !user) {
      return LOGIN_PATH;
    }

    // 2) Logged in user on login page -> redirect based on username status
    if (user && pathname === LOGIN_PATH) {
      if (usernameStatus === "loading" || usernameStatus === "error") {
        return null; // Wait for resolution
      }
      if (usernameStatus === "missing") {
        return ONBOARDING_PATH;
      }
      if (usernameStatus === "present") {
        return DEFAULT_APP_PATH;
      }
    }

    // If logged in but profile/username not resolved yet, don't redirect yet.
    if (!user || usernameStatus === "loading" || usernameStatus === "error") {
      return null;
    }

    // 2) Logged in + missing username -> onboarding (unless already there)
    if (usernameStatus === "missing") {
      return pathname === ONBOARDING_PATH ? null : ONBOARDING_PATH;
    }

    // 3) Logged in + has username -> block onboarding
    if (usernameStatus === "present") {
      return pathname === ONBOARDING_PATH ? DEFAULT_APP_PATH : null;
    }

    return null;
  }, [authInitialized, authLoading, redirectProcessing, redirectSettling, user, usernameStatus, pathname]);

  if (process.env.NODE_ENV === "development") {
    console.debug({ pathname, authLoading, uid: user?.uid, usernameStatus, desiredPath });
  }

  useEffect(() => {
    if (!desiredPath || redirectSettling || redirectProcessing) return;
    if (DEBUG_AUTH) {
      console.error("GUARD: redirect", { pathname, loading: authLoading, redirectSettling, hasUser: !!user });
    }
    router.replace(desiredPath);
  }, [desiredPath, router, pathname, user, authLoading, redirectSettling, redirectProcessing]);

  // If redirect sign-in appears in progress, start a 10s timeout; on expiry with no user, clear storage and redirect.
  useEffect(() => {
    if (!redirectProcessing || typeof window === "undefined") return;
    const tid = setTimeout(() => {
      if (userRef.current == null) {
        sessionStorage.removeItem("dgjauth_processing");
        sessionStorage.removeItem("dgjauth_return_to");
        router.replace("/login?reason=auth_timeout");
      }
    }, 10_000);
    return () => clearTimeout(tid);
  }, [redirectProcessing, user, router]);

  /**
   * Rendering rules (prevents flashes):
   * - If redirect sign-in is settling, show loading (do not redirect).
   * - Public paths: always render children (critical for /auth/callback + getRedirectResult).
   * - If we *know* we should be elsewhere, render nothing.
   * - If auth/profile state isn't settled, render nothing.
   * - If there's an error loading profile, show the error UI (no redirects).
   */
  if (authLoading || !authInitialized || redirectSettling || redirectProcessing) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
        Signing in…
      </div>
    );
  }

  // Public paths: never block—let /auth/callback run getRedirectResult() etc.
  if (isPublicPath(pathname)) {
    if (DEBUG_AUTH) console.log("GUARD: public route bypass", pathname);
    return <>{children}</>;
  }

  const shouldBlockRender =
    !!desiredPath || authLoading || !authInitialized || !user || usernameStatus === "loading" || redirectProcessing;

  if (DEBUG_AUTH && authLoading && !desiredPath) {
    console.log("GUARD: waiting (auth loading)", { authLoading });
  }
  if (shouldBlockRender) return null;

  if (usernameStatus === "error") {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-600">
          Error loading profile. Refresh to try again.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
