"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaderboardTab } from "@/components/leaderboard/leaderboard-tab";
import { ClubBadge } from "@/components/club/club-badge";
import { ClubLeaderboardContent } from "@/components/leaderboard/club-leaderboard-content";
import { ClubEmptyState } from "@/components/leaderboard/club-empty-state";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import { useUserDoc } from "@/lib/useUserDoc";
import { createClub, joinClubByCode, getClubMemberCount, getUserClub } from "@/lib/clubs";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

const SCOPE_STORAGE_KEY = "leaderboardScope";

type LeaderboardScope = "global" | "friends" | "club";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { userData, loading: userLoading } = useUserDoc();
  const clubId = (userData as { clubId?: string } | null)?.clubId as string | undefined;

  const [clubName, setClubName] = useState<string | null>(null);
  const [scope, setScope] = useState<LeaderboardScope>(() => {
    if (typeof window === "undefined") return "global";
    const stored = localStorage.getItem(SCOPE_STORAGE_KEY) as LeaderboardScope | null;
    return stored && ["global", "friends", "club"].includes(stored) ? stored : "global";
  });
  const [periodTab, setPeriodTab] = useState<LeaderboardPeriod>("weekly");
  const [clubMemberCount, setClubMemberCount] = useState<number | null>(null);

  useEffect(() => {
    if (!clubId) {
      setClubName(null);
      return;
    }
    let cancelled = false;
    getUserClub(clubId).then((c) => {
      if (!cancelled) setClubName(c?.name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  useEffect(() => {
    if (scope !== "club" || !clubId) {
      setClubMemberCount(null);
      return;
    }
    let cancelled = false;
    getClubMemberCount(clubId)
      .then((n) => {
        if (!cancelled) setClubMemberCount(n);
      })
      .catch(() => {
        if (!cancelled) setClubMemberCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, clubId]);

  useEffect(() => {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  }, [scope]);

  const safePeriodTab =
    periodTab && ["weekly", "monthly", "yearly", "allTime"].includes(periodTab)
      ? periodTab
      : "weekly";

  const handleJoinClub = async (code: string) => {
    if (!user) return;
    await joinClubByCode(code, user.uid);
  };

  const handleCreateClub = async (name: string) => {
    if (!user) return;
    await createClub(name.trim(), user.uid);
  };

  const isClubScope = scope === "club";

  return (
    <RequireAuth>
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="hidden sm:inline">🏆 </span>Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compete with players worldwide and connect with friends
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Rankings</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {scope === "friends" && "Friends (Top only)"}
                    {scope === "global" && (
                      <>
                        Global
                        <span className="sm:hidden"> · </span>
                        <span className="hidden sm:inline"> • </span>
                        {(() => {
                          switch (safePeriodTab) {
                            case "weekly":
                              return "Week";
                            case "monthly":
                              return "Month";
                            case "yearly":
                              return "Year";
                            case "allTime":
                              return "All Time";
                            default:
                              return "Week";
                          }
                        })()}
                      </>
                    )}
                    {scope === "club" && (
                      <>
                        Club · All Time
                        {clubMemberCount !== null && (
                          <> · Members: {clubMemberCount}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
                {isClubScope && clubId && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/club">Manage club</Link>
                  </Button>
                )}
              </div>
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
                  <Button
                    variant={scope === "club" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScope("club")}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {clubId ? (
                      <>
                        <ClubBadge clubId={clubId} name={clubName ?? "Club"} size="sm" />
                        Club
                      </>
                    ) : (
                      "Club"
                    )}
                  </Button>
                </div>
                {scope === "friends" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Shows friends who appear in this leaderboard page.
                  </p>
                )}
              </div>

              {isClubScope ? (
                <div className="mt-4 sm:mt-6">
                  {!userLoading && clubId ? (
                    <ClubLeaderboardContent clubId={clubId} currentUserId={user?.uid || ""} />
                  ) : !userLoading ? (
                    <ClubEmptyState onJoin={handleJoinClub} onCreate={handleCreateClub} />
                  ) : (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              )}
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
