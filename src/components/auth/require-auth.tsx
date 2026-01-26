"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { useUserProfile } from "@/lib/useUserProfile";

const ONBOARDING_PATH = "/onboarding/username";
const LOGIN_PATH = "/login";
const DEFAULT_APP_PATH = "/dashboard"; // justified by src/app/dashboard/page.tsx

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (pathname !== LOGIN_PATH) router.replace(LOGIN_PATH);
      return;
    }

    if (profileLoading) return;

    const hasUsername = !!profile?.username;

    if (!hasUsername && pathname !== ONBOARDING_PATH) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    if (hasUsername && pathname === ONBOARDING_PATH) {
      router.replace(DEFAULT_APP_PATH);
    }
  }, [authLoading, user, profileLoading, profile, pathname, router]);

  if (authLoading) return null;
  if (!user) return null;
  if (profileLoading) return null;
  if (!profile?.username && pathname !== ONBOARDING_PATH) return null;

  return <>{children}</>;
}
