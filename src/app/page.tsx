"use client";

import { useAuth } from "@/lib/firebase-auth";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If signed in, this won't render (redirects to dashboard)
  // But keep it as a fallback
  if (user) {
    return null;
  }

  return <SignInPanel />;
}
