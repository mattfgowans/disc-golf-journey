"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LeaderboardTab } from "@/components/leaderboard/leaderboard-tab";
import { ClubBadge } from "@/components/club/club-badge";
import { ClubLeaderboardContent } from "@/components/leaderboard/club-leaderboard-content";
import { ClubEmptyState } from "@/components/leaderboard/club-empty-state";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import { hrefWithPreview } from "@/lib/previewRoutes";
import { useUserDoc } from "@/lib/useUserDoc";
import { createClub, joinClubByCode, getUserClub } from "@/lib/clubs";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

const SCOPE_STORAGE_KEY = "leaderboardScope";
const PERIOD_STORAGE_KEY = "leaderboardPeriod";

type LeaderboardScope = "global" | "friends" | "club";

export function LeaderboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
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
  useEffect(() => {
    if (!isPreview) return;
    setScope("global");
  }, [isPreview]);

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
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (params.get("preview") === "true" && tabParam && tabParam !== "global") {
        setScope("global");
        return;
      }
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
    if (isPreview && newScope !== "global") return;
    setScope(newScope);
  };

  const isClubScope = scope === "club";

  return (
    <RequireAuth>
      <div className="w-full">
        {isPreview && (
          <div className="mb-4 bg-yellow-100 text-yellow-800 text-sm px-3 py-2 flex flex-wrap items-center justify-center gap-2 text-center">
            <span>
              Explore the leaderboard — sign in to claim your spot.
            </span>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full bg-yellow-800 text-white px-3 py-1 text-xs font-medium transition-all duration-100 active:scale-95"
            >
              Sign in
            </button>
          </div>
        )}
        <div className="mb-4 text-center mt-2">
          <h1 className="text-3xl font-bold tracking-tight">
            🏆 Leaderboard
          </h1>

          <p className="text-muted-foreground mt-1">
            Compete with players worldwide and connect with friends
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            {isClubScope && clubId && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild className="mt-0.5 shrink-0">
                  <Link href={hrefWithPreview("/club", isPreview)}>View club</Link>
                </Button>
              </div>
            )}
            <div className="overflow-visible space-y-2.5">
              {/* Scope Toggle */}
              <div className="sticky top-0 z-10 -mx-4 border-y bg-background/95 px-4 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={scope === "global" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange("global")}
                    className="h-9 rounded-full"
                  >
                    Global
                  </Button>
                  <Button
                    variant={scope === "friends" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange("friends")}
                    disabled={isPreview}
                    className="h-9 rounded-full"
                  >
                    Friends (Top)
                  </Button>
                  <Button
                    variant={scope === "club" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScopeChange("club")}
                    disabled={isPreview}
                    className="h-9 justify-center gap-2 rounded-full"
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
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Shows friends who appear in this leaderboard page.
                  </p>
                )}
              </div>

              {isClubScope ? (
                <div className="pt-1">
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
                  className="w-full space-y-2.5"
                >
                  <TabsList className="grid h-9 w-full grid-cols-4 rounded-full bg-muted/70 p-1">
                    <TabsTrigger value="weekly" className="h-7 rounded-full text-sm text-muted-foreground hover:bg-muted/60 data-[state=active]:bg-foreground data-[state=active]:font-medium data-[state=active]:text-background data-[state=active]:shadow-sm">Week</TabsTrigger>
                    <TabsTrigger value="monthly" className="h-7 rounded-full text-sm text-muted-foreground hover:bg-muted/60 data-[state=active]:bg-foreground data-[state=active]:font-medium data-[state=active]:text-background data-[state=active]:shadow-sm">Month</TabsTrigger>
                    <TabsTrigger value="yearly" className="h-7 rounded-full text-sm text-muted-foreground hover:bg-muted/60 data-[state=active]:bg-foreground data-[state=active]:font-medium data-[state=active]:text-background data-[state=active]:shadow-sm">Year</TabsTrigger>
                    <TabsTrigger value="allTime" className="h-7 rounded-full text-sm text-muted-foreground hover:bg-muted/60 data-[state=active]:bg-foreground data-[state=active]:font-medium data-[state=active]:text-background data-[state=active]:shadow-sm">All Time</TabsTrigger>
                  </TabsList>

                  <TabsContent value="weekly" className="mt-0">
                    <LeaderboardTab
                      period="weekly"
                      currentUserId={user?.uid || ""}
                      pageSize={10}
                      maxRows={10}
                      showViewAllLink={false}
                      maxHeightClass="max-h-none"
                      friendsOnly={scope === "friends"}
                      previewGuest={isPreview}
                    />
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-0">
                    <LeaderboardTab
                      period="monthly"
                      currentUserId={user?.uid || ""}
                      pageSize={10}
                      maxRows={10}
                      showViewAllLink={false}
                      maxHeightClass="max-h-none"
                      friendsOnly={scope === "friends"}
                      previewGuest={isPreview}
                    />
                  </TabsContent>

                  <TabsContent value="yearly" className="mt-0">
                    <LeaderboardTab
                      period="yearly"
                      currentUserId={user?.uid || ""}
                      pageSize={10}
                      maxRows={10}
                      showViewAllLink={false}
                      maxHeightClass="max-h-none"
                      friendsOnly={scope === "friends"}
                      previewGuest={isPreview}
                    />
                  </TabsContent>

                  <TabsContent value="allTime" className="mt-0">
                    <LeaderboardTab
                      period="allTime"
                      currentUserId={user?.uid || ""}
                      pageSize={10}
                      maxRows={10}
                      showViewAllLink={false}
                      maxHeightClass="max-h-none"
                      friendsOnly={scope === "friends"}
                      previewGuest={isPreview}
                    />
                  </TabsContent>

                  <div className="border-t pt-2.5 text-center">
                    <Link
                      href={hrefWithPreview("/leaderboard/all", isPreview)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View full leaderboard →
                    </Link>
                  </div>
                </Tabs>
              )}
            </div>
          </div>

          <div className="border-t pt-2.5 text-center">
            <Link
              href={hrefWithPreview("/friends", isPreview)}
              className="text-sm text-muted-foreground/90 transition-colors hover:text-primary"
            >
              Connect with friends →
            </Link>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
