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

export function LeaderboardTab({
  period,
  currentUserId,
  pageSize = 10,
  showViewAllLink = true,
  maxHeightClass = "max-h-[420px]",
  maxRows,
  friendsOnly = false,
}: {
  period: LeaderboardPeriod;
  currentUserId: string;
  pageSize?: number;
  showViewAllLink?: boolean;
  maxHeightClass?: string;
  maxRows?: number;
  friendsOnly?: boolean;
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
      setLoading(true);
      setError(null);
      try {
        const page = await getLeaderboard(period, { pageSize, cursor: null });
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
  }, [period, pageSize, friendsOnly, currentUserId]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await getLeaderboard(period, { pageSize, cursor });
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
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
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

  // Show "Your rank" if user is not in top list but exists in loaded entries
  const showYourRank = maxRows &&
    currentIndex >= maxRows &&
    currentIndex !== -1 &&
    renderedEntries.length > maxRows;

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
        <p className="text-muted-foreground">
          Be the first to earn XP and claim the top spot!
        </p>
      </div>
    );
  }

  // Special empty state for friends-only view
  if (friendsOnly && renderedEntries.length <= 1) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No friends ranked yet</h3>
        <p className="text-muted-foreground mb-6">
          Add friends to see how you stack up each week.
        </p>
        <Button asChild>
          <Link href="/friends">Add friends</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive">Leaderboard failed to load</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      )}
      <div className={`${maxHeightClass} overflow-y-auto pr-2 space-y-2`}>
        {(maxRows ? renderedEntries.slice(0, maxRows) : renderedEntries).map((entry, index) => (
          <LeaderboardRow
            key={entry.uid}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.uid === currentUserId}
          />
        ))}
      </div>
      {showYourRank && (
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-2 px-3">Your rank</div>
          <div className="bg-muted/40 rounded-lg p-2">
            <LeaderboardRow
              entry={renderedEntries[currentIndex]}
              rank={currentIndex + 1}
              isCurrentUser={true}
            />
          </div>
        </div>
      )}
      {hasMore && (
        <div className="pt-3 text-center">
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