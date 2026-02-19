"use client";

import { useAuth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, authInitialized, redirectSettling } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !authInitialized || redirectSettling) return;
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [user, loading, authInitialized, redirectSettling, router]);

  if (loading || !authInitialized || redirectSettling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return null;
}
