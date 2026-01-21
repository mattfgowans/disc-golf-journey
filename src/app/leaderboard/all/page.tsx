"use client";

import { useAuth } from "@/lib/firebase-auth";
import { RequireAuth } from "@/components/auth/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTab } from "@/components/leaderboard/leaderboard-tab";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

export default function FullLeaderboardPage() {
  const { user } = useAuth();

  return (
    <RequireAuth
      title="Sign in to view leaderboards"
      subtitle="Sign in with Google to see how you rank against other players."
    >
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏆 Full Leaderboard</h1>
          <p className="text-muted-foreground">
            Complete rankings across all time periods
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All-Time Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardTab
              period="allTime"
              currentUserId={user?.uid || ""}
              pageSize={25}
              showViewAllLink={false}
              maxHeightClass="max-h-[70vh]"
            />
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}