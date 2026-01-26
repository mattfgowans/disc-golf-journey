"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/firebase-auth";
import { useUserDoc } from "@/lib/useUserDoc";
import { usePathname, useRouter } from "next/navigation";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function RequireAuth({
  children,
  title = "Sign in to continue",
  subtitle = "Sign in with Google to access your account.",
}: RequireAuthProps) {
  const { user, loading } = useAuth();
  const { userData, loading: userDataLoading } = useUserDoc();
  const pathname = usePathname();
  const router = useRouter();

  const userDocReady = userData !== null;

  // Check if user has completed username onboarding
  const hasUsername =
    Boolean((userData as any)?.username) ||
    Boolean(userData?.profile?.username);

  const hasAnyProgress =
    (userData?.stats?.points?.allTime ?? 0) > 0 ||
    (userData?.stats?.points?.week ?? 0) > 0 ||
    (userData?.stats?.points?.month ?? 0) > 0 ||
    (userData?.stats?.points?.year ?? 0) > 0 ||
    (userData?.stats?.points?.weekly ?? 0) > 0 ||
    (userData?.stats?.points?.monthly ?? 0) > 0 ||
    (userData?.stats?.points?.yearly ?? 0) > 0;
  const isOnOnboardingPage = pathname === "/onboarding/username";

  // Handle redirect to onboarding in useEffect to avoid side effects in render
  useEffect(() => {
    if (
      user &&
      !userDataLoading &&
      userDocReady &&
      !hasUsername &&
      !hasAnyProgress &&
      !isOnOnboardingPage
    ) {
      router.replace("/onboarding/username");
    }
  }, [user, userDataLoading, userDocReady, hasUsername, hasAnyProgress, isOnOnboardingPage, router]);

  if (loading || userDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <SignInPanel title={title} subtitle={subtitle} />;
  }

  if (userDocReady && !hasUsername && !hasAnyProgress && !isOnOnboardingPage) {
    // Show loading while redirect happens in useEffect
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    );
  }

  // Allow access if on onboarding page, or if user has a username, or if user already has progress
  return <>{children}</>;
}
