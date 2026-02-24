"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaderboardTab } from "@/components/leaderboard/leaderboard-tab";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

const SCOPE_STORAGE_KEY = "leaderboardScope";

export default function LeaderboardPage() {
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

  // Debug: Log user UID
  useEffect(() => {
    if (user?.uid) {
      console.log("DEBUG UID:", user.uid);
    }
  }, [user]);

  // Ensure periodTab is always valid
  const safePeriodTab = periodTab && ["weekly", "monthly", "yearly", "allTime"].includes(periodTab)
    ? periodTab
    : "weekly";

  return (
    <RequireAuth>
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="hidden sm:inline">🏆 </span>Global Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compete with players worldwide and connect with friends
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {scope === "friends" ? "Friends (Top only)" : "Global"}
                <span className="sm:hidden"> · </span>
                <span className="hidden sm:inline"> • </span>
                {(() => {
                  switch (safePeriodTab) {
                    case "weekly": return "Week";
                    case "monthly": return "Month";
                    case "yearly": return "Year";
                    case "allTime": return "All Time";
                    default: return "Week";
                  }
                })()}
              </p>
            </CardHeader>
            <CardContent className="overflow-visible">
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
                    Friends (Top)
                  </Button>
                </div>
                {scope === "friends" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Shows friends who appear in this leaderboard page.
                  </p>
                )}
              </div>

              <Tabs
                value={safePeriodTab}
                onValueChange={(v) => setPeriodTab(v as LeaderboardPeriod)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="weekly">Week</TabsTrigger>
                  <TabsTrigger value="monthly">Month</TabsTrigger>
                  <TabsTrigger value="yearly">Year</TabsTrigger>
                  <TabsTrigger value="allTime">All Time</TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="mt-4 sm:mt-6">
                  <LeaderboardTab
                    period="weekly"
                    currentUserId={user?.uid || ""}
                    pageSize={10}
                    maxRows={10}
                    showViewAllLink={false}
                    maxHeightClass="max-h-none"
                    friendsOnly={scope === "friends"}
                  />
                </TabsContent>

                <TabsContent value="monthly" className="mt-4 sm:mt-6">
                  <LeaderboardTab
                    period="monthly"
                    currentUserId={user?.uid || ""}
                    pageSize={10}
                    maxRows={10}
                    showViewAllLink={false}
                    maxHeightClass="max-h-none"
                    friendsOnly={scope === "friends"}
                  />
                </TabsContent>

                <TabsContent value="yearly" className="mt-4 sm:mt-6">
                  <LeaderboardTab
                    period="yearly"
                    currentUserId={user?.uid || ""}
                    pageSize={10}
                    maxRows={10}
                    showViewAllLink={false}
                    maxHeightClass="max-h-none"
                    friendsOnly={scope === "friends"}
                  />
                </TabsContent>

                <TabsContent value="allTime" className="mt-4 sm:mt-6">
                  <LeaderboardTab
                    period="allTime"
                    currentUserId={user?.uid || ""}
                    pageSize={10}
                    maxRows={10}
                    showViewAllLink={false}
                    maxHeightClass="max-h-none"
                    friendsOnly={scope === "friends"}
                  />
                </TabsContent>

                <div className="pt-4 text-center border-t">
                  <Link
                    href="/leaderboard/all"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View full leaderboard →
                  </Link>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              href="/friends"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Connect with friends →
            </Link>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
