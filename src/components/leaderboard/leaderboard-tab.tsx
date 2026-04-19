"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/leaderboard";
import type { DocumentSnapshot } from "firebase/firestore";
import { getFriends } from "@/lib/friends";
import { LeaderboardRow } from "./leaderboard-row";

function getRankTimeframeSuffix(period: LeaderboardPeriod): string {
  switch (period) {
    case "weekly":
      return "this week";
    case "monthly":
      return "this month";
    case "yearly":
      return "this year";
    case "allTime":
      return "all time";
    default:
      return "this week";
  }
}

export function LeaderboardTab({
  period,
  currentUserId,
  pageSize = 10,
  showViewAllLink = true,
  maxHeightClass = "max-h-[420px]",
  maxRows,
  friendsOnly = false,
  previewGuest = false,
}: {
  period: LeaderboardPeriod;
  currentUserId: string;
  pageSize?: number;
  showViewAllLink?: boolean;
  maxHeightClass?: string;
  maxRows?: number;
  friendsOnly?: boolean;
  /** Logged-out preview: show global list but hide personalized rank */
  previewGuest?: boolean;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadLeaderboard = async () => {
      // Friends scope requires a signed-in user (unless preview forces global-only elsewhere).
      if (!currentUserId && friendsOnly && !previewGuest) {
        setLoading(false);
        setEntries([]);
        setCursor(null);
        setHasMore(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const page = await getLeaderboard(period, {
          pageSize,
          cursor: null,
          previewGuest,
        });
        let filteredEntries = page.entries;

        if (friendsOnly && currentUserId) {
          // Load friends list
          try {
            const friends = await getFriends(currentUserId);
            const friendUidSet = new Set(friends.map(friend => friend.uid));
            setFriendUids(friendUidSet);

            // Filter entries to only include current user and friends
            filteredEntries = page.entries.filter(entry =>
              entry.uid === currentUserId || friendUidSet.has(entry.uid)
            );
          } catch (friendsError) {
            console.error("Error loading friends:", friendsError);
            // If friends fail to load, just show current user
            filteredEntries = page.entries.filter(entry => entry.uid === currentUserId);
          }
        }

        setEntries(filteredEntries);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
        setError((error as any)?.message ?? "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [period, pageSize, friendsOnly, currentUserId, previewGuest]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    if (!currentUserId && friendsOnly && !previewGuest) return;

    setLoadingMore(true);
    try {
      const page = await getLeaderboard(period, { pageSize, cursor, previewGuest });
      let filteredEntries = page.entries;

      if (friendsOnly) {
        // Filter new entries to only include current user and friends
        filteredEntries = page.entries.filter(entry =>
          entry.uid === currentUserId || friendUids.has(entry.uid)
        );
      }

      setEntries(prev => [...prev, ...filteredEntries]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error("Error loading more leaderboard entries:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2.5 rounded-xl bg-muted/20 p-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/70 animate-pulse" />
        ))}
      </div>
    );
  }

  // Compute rendered entries (filtered for friends if needed)
  const renderedEntries = friendsOnly
    ? entries.filter(entry => entry.uid === currentUserId || friendUids.has(entry.uid))
    : entries;

  // Compute displayed entries and current user position
  const displayed = maxRows ? renderedEntries.slice(0, maxRows) : renderedEntries;
  const currentIndex = renderedEntries.findIndex(e => e.uid === currentUserId);
  const userRank = currentIndex !== -1 ? currentIndex + 1 : null;

  const totalPlayers = renderedEntries.length;
  const percentile =
    userRank && totalPlayers
      ? Math.round((1 - userRank / totalPlayers) * 100)
      : null;

  // Show "Your rank" if user is not in top list but exists in loaded entries
  const showYourRank = maxRows &&
    currentIndex >= maxRows &&
    currentIndex !== -1 &&
    renderedEntries.length > maxRows;

  if (entries.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center space-y-3 rounded-xl bg-muted/20 px-6 py-8">
          <Trophy className="h-11 w-11 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No entries yet</h3>
            <p className="text-sm text-muted-foreground">
          Be the first to earn XP and claim the top spot!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Special empty state for friends-only view
  if (friendsOnly && renderedEntries.length <= 1) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center space-y-4 rounded-xl bg-muted/20 px-6 py-8">
          <Trophy className="h-11 w-11 text-muted-foreground" />
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold">No friends ranked yet</h3>
            <p className="text-sm text-muted-foreground">
              Add friends to see how you stack up each week.
            </p>
          </div>
          <Button asChild>
            <Link href="/friends">Add friends</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-medium text-destructive">Leaderboard failed to load</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      )}
      {!previewGuest && (
        <>
          {currentUserId && userRank !== null && (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {`You're #${userRank} ${getRankTimeframeSuffix(period)}`}
              </p>
              {percentile !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  You're ahead of {percentile}% of players
                </p>
              )}
            </>
          )}
          {userRank === null && currentUserId && (
            <p className="text-sm text-muted-foreground mb-3">
              You're outside the top 10 — you're closer than you think 👀
            </p>
          )}
        </>
      )}
      <div className={`${maxHeightClass} space-y-2 overflow-y-auto pr-2`}>
        {(maxRows ? renderedEntries.slice(0, maxRows) : renderedEntries).map((entry, index) => (
          <LeaderboardRow
            key={entry.uid}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.uid === currentUserId}
          />
        ))}
      </div>
      {showYourRank && !previewGuest && (
        <div className="border-t pt-4">
          <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/90">Your rank</div>
          <div className="rounded-xl bg-muted/30 p-2">
            <LeaderboardRow
              entry={renderedEntries[currentIndex]}
              rank={currentIndex + 1}
              isCurrentUser={true}
            />
          </div>
        </div>
      )}
      {hasMore && (
        <div className="pt-4 text-center">
          <Button onClick={loadMore} disabled={loadingMore} variant="outline">
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
      {showViewAllLink && (
        <div className="pt-3 text-center">
          <Link
            href="/leaderboard/all"
            className="text-sm font-medium text-primary hover:underline"
          >
            View full leaderboard →
          </Link>
        </div>
      )}
    </>
  );
}