"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

function normalizePath(p: string | null | undefined) {
  if (!p) return "/";
  if (p === "/") return "/";
  return p.endsWith("/") ? p.slice(0, -1) : p;
}

function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isCriOS = /CriOS/i.test(ua);
  const isFxiOS = /FxiOS/i.test(ua);
  const hasSafari = /Safari/i.test(ua);
  const hasVersion = /Version\//i.test(ua);

  const isKnownInApp =
    /Instagram|FBAN|FBAV|FBIOS|FB_IAB|Line|LinkedInApp|Twitter|TikTok/i.test(ua);

  // iMessage/SFSafariViewController often looks Safari-ish but missing Version/
  const isIOSSafariLikeInApp = isIOS && hasSafari && !hasVersion && !isCriOS && !isFxiOS;

  // Extra: presence of window.webkit.messageHandlers is common in embedded webviews
  const hasIOSWebkitHandlers = !!(window as any)?.webkit?.messageHandlers;

  return Boolean(isKnownInApp || isIOSSafariLikeInApp || hasIOSWebkitHandlers);
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
  const path = normalizePath(pathname);

  const { user, loading: authLoading, authInitialized, redirectSettling, signOut, userDocReady } = useAuth();
  const [stuck, setStuck] = useState(false);
  const inApp = isInAppBrowser();
  const userRef = useRef(user);
  userRef.current = user;

  const redirectProcessing = (() => {
    if (typeof window === "undefined") return false;
    if (user) return false; // if we already have a user, never block app rendering
    try {
      const v = sessionStorage.getItem("dgjauth_processing") === "1";
      if (!v) return false;

      // Optional: expire stale flags after 2 minutes
      const startedAt = Number(sessionStorage.getItem("dgjauth_redirect_started_at") || "0");
      if (startedAt && Date.now() - startedAt > 2 * 60 * 1000) {
        sessionStorage.removeItem("dgjauth_processing");
        sessionStorage.removeItem("dgjauth_redirect_started_at");
        return false;
      }

      return true;
    } catch {
      return false;
    }
  })();

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
    if (isPublicPath(path)) {
      return null;
    }

    // 0b) Do NOT redirect while initiating sign-in redirect or redirect-in-progress.
    if (redirectSettling) return null;

    // 0c) Do NOT redirect while sessionStorage indicates redirect sign-in in progress.
    if (redirectProcessing) return null;

    // 0d) Do NOT redirect while user doc is being bootstrapped.
    if (user && !userDocReady) return null;

    // 1) Not logged in -> login. Only redirect when auth initialized, loading done, and user is null.
    if (authInitialized && !authLoading && !redirectSettling && !user) {
      return LOGIN_PATH;
    }

    // 2) Logged in user on login page -> redirect based on username status
    if (user && path === LOGIN_PATH) {
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
      return path === ONBOARDING_PATH ? null : ONBOARDING_PATH;
    }

    // 3) Logged in + has username -> block onboarding
    if (usernameStatus === "present") {
      return path === ONBOARDING_PATH ? DEFAULT_APP_PATH : null;
    }

    return null;
  }, [authInitialized, authLoading, redirectProcessing, redirectSettling, user, userDocReady, usernameStatus, path]);

  if (process.env.NODE_ENV === "development") {
    console.debug({ pathname, authLoading, uid: user?.uid, usernameStatus, desiredPath });
  }

  useEffect(() => {
    if (!desiredPath || redirectSettling || redirectProcessing) return;
    if (DEBUG_AUTH) {
      console.error("GUARD: redirect", { pathname, loading: authLoading, redirectSettling, hasUser: !!user });
    }
    router.replace(desiredPath);
  }, [desiredPath, router, pathname, user, authLoading, redirectSettling, redirectProcessing, userDocReady]);

  // Watchdog: if signed in but usernameStatus never resolves, set stuck after 6s.
  useEffect(() => {
    if (usernameStatus !== "loading") {
      setStuck(false);
      return;
    }
    if (!authInitialized || !user || isPublicPath(path)) return;
    if (user && !userDocReady) return;

    const tid = window.setTimeout(() => setStuck(true), 6000);
    return () => {
      window.clearTimeout(tid);
    };
  }, [authInitialized, user, usernameStatus, path]);

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
  const LoadingSplash = (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );

  const LoadingRecoveryPanel = (
    <div className="flex min-h-[200px] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Still loading…</h2>
        <p className="mt-1 text-xs text-muted-foreground">Build: 2026-02-20-1</p>
        <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
          {JSON.stringify(
            {
              pathname,
              authInitialized,
              authLoading,
              userUid: user?.uid ?? "none",
              redirectSettling,
              redirectProcessing,
              usernameStatus,
              exists,
              profileError: String(profileError ?? ""),
            },
            null,
            2
          )}
        </pre>
        <div className="mt-4 flex flex-col gap-2">
          <button
            className="w-full rounded-md bg-black px-4 py-2 text-white"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <button
            className="w-full rounded-md border px-4 py-2"
            onClick={() => router.replace("/login")}
          >
            Go to login
          </button>
          <button
            className="w-full rounded-md border px-4 py-2"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
          {inApp && (
            <>
              <button
                className="w-full rounded-md border px-4 py-2"
                onClick={() => {
                  window.location.href = window.location.href;
                }}
              >
                Open in Browser (Safari/Chrome)
              </button>
              <button
                className="w-full rounded-md border px-4 py-2"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                Copy link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (authLoading || !authInitialized || redirectSettling || redirectProcessing || (user && !userDocReady)) {
    return stuck ? LoadingRecoveryPanel : LoadingSplash;
  }

  // Public paths: never block—let /auth/callback run getRedirectResult() etc.
  if (isPublicPath(path)) {
    if (DEBUG_AUTH) console.log("GUARD: public route bypass", path);
    return <>{children}</>;
  }

  const shouldBlockRender =
    !!desiredPath || authLoading || !authInitialized || !user || !userDocReady || usernameStatus === "loading" || redirectProcessing;

  if (DEBUG_AUTH && authLoading && !desiredPath) {
    console.log("GUARD: waiting (auth loading)", { authLoading });
  }

  if (shouldBlockRender) {
    if (!isPublicPath(path) && inApp) {
      return (
        <div className="flex min-h-[200px] items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Open in Safari to continue</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The Messages in-app browser can break sign-in and loading. Open this page in Safari/Chrome, then sign in.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="w-full rounded-md bg-black px-4 py-2 text-white"
                onClick={() => { window.location.href = window.location.href; }}
              >
                Open in Browser (Safari/Chrome)
              </button>
              <button
                className="w-full rounded-md border px-4 py-2"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      );
    }
    return LoadingSplash;
  }

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
