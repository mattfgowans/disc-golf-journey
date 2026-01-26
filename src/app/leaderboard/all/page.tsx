"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase-auth";
import { RequireAuth } from "@/components/auth/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LeaderboardTab } from "@/components/leaderboard/leaderboard-tab";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

const SCOPE_STORAGE_KEY = "leaderboardScope";

export default function FullLeaderboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"global" | "friends">(() => {
    if (typeof window === "undefined") return "global";
    return (localStorage.getItem(SCOPE_STORAGE_KEY) as "global" | "friends") ?? "global";
  });
  const [periodTab, setPeriodTab] = useState<LeaderboardPeriod>("weekly");

  // Persist scope changes to localStorage
  useEffect(() => {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  return (
    <RequireAuth>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏆 Full Leaderboard</h1>
          <p className="text-muted-foreground">
            Complete rankings across all time periods
          </p>
        </div>

        <div className="mb-4">
          <Link
            href="/leaderboard"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to leaderboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Scope Toggle */}
            <div className="sticky top-0 z-10 -mx-6 px-6 py-2 pb-3 bg-background/95 backdrop-blur border-b">
              <div className="flex gap-2">
                <Button
                  variant={scope === "global" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope("global")}
                  className="flex-1"
                >
                  Global
                </Button>
                <Button
                  variant={scope === "friends" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope("friends")}
                  className="flex-1"
                >
                  Friends
                </Button>
              </div>
            </div>

            <Tabs value={periodTab} onValueChange={(v) => setPeriodTab(v as LeaderboardPeriod)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="weekly">Week</TabsTrigger>
                <TabsTrigger value="monthly">Month</TabsTrigger>
                <TabsTrigger value="yearly">Year</TabsTrigger>
                <TabsTrigger value="allTime">All Time</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly" className="mt-6">
                <LeaderboardTab
                  period="weekly"
                  currentUserId={user?.uid || ""}
                  friendsOnly={scope === "friends"}
                  pageSize={25}
                  showViewAllLink={false}
                  maxHeightClass="max-h-[70vh]"
                />
              </TabsContent>

              <TabsContent value="monthly" className="mt-6">
                <LeaderboardTab
                  period="monthly"
                  currentUserId={user?.uid || ""}
                  friendsOnly={scope === "friends"}
                  pageSize={25}
                  showViewAllLink={false}
                  maxHeightClass="max-h-[70vh]"
                />
              </TabsContent>

              <TabsContent value="yearly" className="mt-6">
                <LeaderboardTab
                  period="yearly"
                  currentUserId={user?.uid || ""}
                  friendsOnly={scope === "friends"}
                  pageSize={25}
                  showViewAllLink={false}
                  maxHeightClass="max-h-[70vh]"
                />
              </TabsContent>

              <TabsContent value="allTime" className="mt-6">
                <LeaderboardTab
                  period="allTime"
                  currentUserId={user?.uid || ""}
                  friendsOnly={scope === "friends"}
                  pageSize={25}
                  showViewAllLink={false}
                  maxHeightClass="max-h-[70vh]"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}