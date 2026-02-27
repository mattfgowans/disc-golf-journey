"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import { useUserDoc } from "@/lib/useUserDoc";
import { ClubLeaderboardContent } from "@/components/leaderboard/club-leaderboard-content";

function ClubLeaderboardInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { userData, loading: userLoading } = useUserDoc();
  const clubId = (userData as { clubId?: string } | null)?.clubId as string | undefined;

  useEffect(() => {
    if (!userLoading && user && !clubId) {
      router.replace("/club");
    }
  }, [userLoading, user, clubId, router]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!clubId) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <ClubLeaderboardContent
        clubId={clubId}
        currentUserId={user.uid}
        showHeader
        backHref="/club"
      />
    </div>
  );
}

export default function ClubLeaderboardPage() {
  return (
    <RequireAuth>
      <ClubLeaderboardInner />
    </RequireAuth>
  );
}
