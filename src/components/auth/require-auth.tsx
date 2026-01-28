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
  const { profile, exists, loading: profileLoading, error: profileError } = useUserProfile(user?.uid);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (pathname !== LOGIN_PATH) router.replace(LOGIN_PATH);
      return;
    }

    if (profileLoading) return;
    if (exists === null) return;
    if (profileError) return;

    const username = profile?.username ?? profile?.profile?.username;
    const hasUsername = !!username;
    const needsUsername = (exists === false) || (exists === true && !hasUsername);

    if (needsUsername && pathname !== ONBOARDING_PATH) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    if (!needsUsername && pathname === ONBOARDING_PATH) {
      router.replace(DEFAULT_APP_PATH);
    }
  }, [authLoading, user, profileLoading, exists, profileError, profile, pathname, router]);

  if (authLoading) return null;
  if (!user) return null;
  if (profileLoading) return null;
  if (exists === null) return null;
  if (profileError) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-gray-600">Error loading profile. Refresh to try again.</p>
    </div>
  );
  const username = profile?.username ?? profile?.profile?.username;
  const hasUsername = !!username;
  const needsUsername = (exists === false) || (exists === true && !hasUsername);
  if (needsUsername && pathname !== ONBOARDING_PATH) return null;

  return <>{children}</>;
}
