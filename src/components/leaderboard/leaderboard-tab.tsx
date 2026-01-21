"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { getLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/leaderboard";
import type { DocumentSnapshot } from "firebase/firestore";

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const primaryLabel = entry.username ? `@${entry.username}` : "Anonymous";

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />;
      default:
        return (
          <span className="text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div
      className={`relative min-w-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
        isCurrentUser ? "bg-primary/5 border-primary/20" : "bg-card"
      } hover:bg-accent/50 transition-colors`}
    >
      <div className="absolute left-3 top-3 text-muted-foreground">
        {(() => {
          switch (rank) {
            case 1:
              return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
            case 2:
              return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
            case 3:
              return <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />;
            default:
              return (
                <span className="text-xs sm:text-sm font-bold text-muted-foreground">
                  #{rank}
                </span>
              );
          }
        })()}
      </div>
      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ml-5 sm:ml-0">
        <AvatarImage src={entry.photoURL} />
        <AvatarFallback className="text-sm">
          {primaryLabel.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p
          className={`text-base sm:text-lg font-semibold truncate ${isCurrentUser ? "text-primary" : ""}`}
        >
          {primaryLabel}
          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
        </p>
      </div>
      <div className="shrink-0">
        <Badge variant="secondary" className="text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1 font-bold whitespace-nowrap">
          {entry.points.toLocaleString()} XP
        </Badge>
      </div>
    </div>
  );
}

export function LeaderboardTab({
  period,
  currentUserId,
  pageSize = 10,
  showViewAllLink = true,
  maxHeightClass = "max-h-[420px]",
}: {
  period: LeaderboardPeriod;
  currentUserId: string;
  pageSize?: number;
  showViewAllLink?: boolean;
  maxHeightClass?: string;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await getLeaderboard(period, { pageSize, cursor: null });
        setEntries(page.entries);
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
  }, [period, pageSize]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await getLeaderboard(period, { pageSize, cursor });
      setEntries(prev => [...prev, ...page.entries]);
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
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

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

  return (
    <>
      {error && (
        <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-medium text-destructive">Leaderboard failed to load</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      )}
      <div className={`${maxHeightClass} overflow-y-auto pr-2 space-y-2`}>
        {entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.uid}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.uid === currentUserId}
          />
        ))}
      </div>
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