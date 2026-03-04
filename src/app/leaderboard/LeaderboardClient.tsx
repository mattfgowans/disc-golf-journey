"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardTitle } from "@/components/ui/card";
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
const PERIOD_STORAGE_KEY = "leaderboardPeriod";

type LeaderboardScope = "global" | "friends" | "club";

export function LeaderboardClient() {
  const { user } = useAuth();
  const { userData, loading: userLoading } = useUserDoc();
  const clubId = (userData as { clubId?: string } | null)?.clubId as string | undefined;

  const [clubName, setClubName] = useState<string | null>(null);
  const [scope, setScope] = useState<LeaderboardScope>(() => {
    if (typeof window === "undefined") return "global";
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam && ["global", "friends", "club"].includes(tabParam)) {
      return tabParam as LeaderboardScope;
    }
    const stored = localStorage.getItem(SCOPE_STORAGE_KEY) as LeaderboardScope | null;
    return stored && ["global", "friends", "club"].includes(stored) ? stored : "global";
  });
  const [periodTab, setPeriodTab] = useState<LeaderboardPeriod>(() => {
    if (typeof window === "undefined") return "weekly";
    const stored = localStorage.getItem(PERIOD_STORAGE_KEY) as LeaderboardPeriod | null;
    return stored && ["weekly", "monthly", "yearly", "allTime"].includes(stored) ? stored : "weekly";
  });
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
    const url = new URL(window.location.href);
    url.searchParams.set("tab", scope);
    window.history.replaceState(null, "", url.toString());
  }, [scope]);

  useEffect(() => {
    localStorage.setItem(PERIOD_STORAGE_KEY, periodTab);
  }, [periodTab]);

  useEffect(() => {
    if (scope === "club") {
      setPeriodTab("allTime");
    }
  }, [scope]);

  useEffect(() => {
    const handler = () => {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam && ["global", "friends", "club"].includes(tabParam)) {
        setScope(tabParam as LeaderboardScope);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

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

  const handleScopeChange = (newScope: LeaderboardScope) => {
    setScope(newScope);
  };

  const isClubScope = scope === "club";

  return (
    <RequireAuth>
      <div className="w-full">
        <div className="text-left mb-4 mt-[-4px]">
          <h1 className="text-2xl sm:text-2xl font-bold mb-2">
            <span className="hidden sm:inline">🏆 </span>Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-snug">
            Compete with players worldwide and connect with friends
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
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
                    <Link href="/club">View club</Link>
                  </Button>
                )}
              </div>
            <div className="overflow-visible space-y-4">
              <div className="space-y-2">
              {/* Scope Toggle */}
              <div className="sticky top-0 z-10 -mx-4 px-4 md:-mx-6 md:px-6 py-2 pb-3 bg-background/95 backdrop-blur">
                <div className="flex gap-2">
                  <Button
                    variant={scope === "global" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange("global")}
                    className="flex-1"
                  >
                    Global
                  </Button>
                  <Button
                    variant={scope === "friends" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange("friends")}
                    className="flex-1"
                  >
                    Friends (Top)
                  </Button>
                  <Button
                    variant={scope === "club" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange("club")}
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
                  <TabsList className="grid w-full grid-cols-4 rounded-full bg-muted p-1 h-9">
                    <TabsTrigger value="weekly" className="rounded-full h-7 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-medium">Week</TabsTrigger>
                    <TabsTrigger value="monthly" className="rounded-full h-7 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-medium">Month</TabsTrigger>
                    <TabsTrigger value="yearly" className="rounded-full h-7 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-medium">Year</TabsTrigger>
                    <TabsTrigger value="allTime" className="rounded-full h-7 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-medium">All Time</TabsTrigger>
                  </TabsList>

                  <TabsContent value="weekly">
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

                  <TabsContent value="monthly">
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

                  <TabsContent value="yearly">
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

                  <TabsContent value="allTime">
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
              </div>
            </div>
          </div>

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
