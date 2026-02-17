"use client";

import React, { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { useUserProfile } from "@/lib/useUserProfile";

const DEBUG_AUTH = true;

const ONBOARDING_PATH = "/onboarding/username";
const LOGIN_PATH = "/login";
const DEFAULT_APP_PATH = "/dashboard"; // justified by src/app/dashboard/page.tsx

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

  const { user, loading: authLoading, redirectSettling } = useAuth();
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
    // 1) Not logged in -> login (unless already there). Do NOT redirect while redirect sign-in is settling.
    if (!authLoading && !redirectSettling && !user) {
      return pathname === LOGIN_PATH ? null : LOGIN_PATH;
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
  }, [authLoading, redirectSettling, user, usernameStatus, pathname]);

  if (process.env.NODE_ENV === "development") {
    console.debug({ pathname, authLoading, uid: user?.uid, usernameStatus, desiredPath });
  }

  useEffect(() => {
    if (!desiredPath || redirectSettling) return;
    if (DEBUG_AUTH) {
      console.error("GUARD: redirect", { pathname, loading: authLoading, redirectSettling, hasUser: !!user });
    }
    router.replace(desiredPath);
  }, [desiredPath, router, pathname, user, authLoading, redirectSettling]);

  /**
   * Rendering rules (prevents flashes):
   * - If redirect sign-in is settling, show loading (do not redirect).
   * - If we *know* we should be elsewhere, render nothing.
   * - If auth/profile state isn't settled, render nothing.
   * - If there's an error loading profile, show the error UI (no redirects).
   */
  if (redirectSettling) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
        Signing in…
      </div>
    );
  }

  const shouldBlockRender =
    !!desiredPath ||
    authLoading ||
    !user ||
    usernameStatus === "loading";

  if (DEBUG_AUTH && authLoading && !desiredPath) {
    console.error("GUARD: loading, no redirect");
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
