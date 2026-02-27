"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { ClubBadge } from "@/components/club/club-badge";
import { ensureClubLeaderboardEntry, getUserClub, subscribeToClubLeaderboard } from "@/lib/clubs";
import type { ClubLeaderboardEntry } from "@/lib/clubs";
import { LeaderboardRow } from "./leaderboard-row";

function ClubLeaderboardBody({
  clubId,
  currentUserId,
}: {
  clubId: string;
  currentUserId: string;
}) {
  const [entries, setEntries] = useState<ClubLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFirstSnapshotRef = useRef(false);

  useEffect(() => {
    hasFirstSnapshotRef.current = false;
    setLoading(true);
    setEntries([]);

    const unsub = subscribeToClubLeaderboard(clubId, (e) => {
      setEntries(e);
      if (!hasFirstSnapshotRef.current) {
        hasFirstSnapshotRef.current = true;
        setLoading(false);
      }
    });

    return () => {
      unsub();
    };
  }, [clubId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
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
          Earn XP by completing achievements to appear on the leaderboard.
        </p>
      </div>
    );
  }

  const currentIndex = entries.findIndex((e) => e.uid === currentUserId);
  const listEntries =
    currentIndex !== -1
      ? entries.filter((e) => e.uid !== currentUserId)
      : entries;
  const rankByUid = new Map(entries.map((e, idx) => [e.uid, idx + 1]));

  return (
    <div className="space-y-4">
      {currentIndex !== -1 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">Your rank</div>
          <div className="bg-muted/40 rounded-lg p-2">
            <LeaderboardRow
              entry={entries[currentIndex]}
              rank={currentIndex + 1}
              isCurrentUser={true}
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {listEntries.map((entry) => (
          <LeaderboardRow
            key={entry.uid}
            entry={entry}
            rank={rankByUid.get(entry.uid) ?? 0}
            isCurrentUser={entry.uid === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

export function ClubLeaderboardContent({
  clubId,
  currentUserId,
  showHeader,
  backHref,
}: {
  clubId: string;
  currentUserId: string;
  showHeader?: boolean;
  backHref?: string;
}) {
  const [club, setClub] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!clubId || !currentUserId) return;
    ensureClubLeaderboardEntry(clubId, currentUserId).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[club-leaderboard] ensureClubLeaderboardEntry failed", err);
      }
    });
  }, [clubId, currentUserId]);

  useEffect(() => {
    if (!showHeader) return;
    let cancelled = false;
    setClub(null);
    getUserClub(clubId).then((c) => {
      if (!cancelled) setClub(c);
    });
    return () => {
      cancelled = true;
    };
  }, [clubId, showHeader]);

  const body = (
    <ClubLeaderboardBody clubId={clubId} currentUserId={currentUserId} />
  );

  if (showHeader || backHref) {
    return (
      <div className="space-y-6">
        {(backHref || showHeader) && (
          <div className="space-y-4">
            {backHref && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={backHref}>← Club</Link>
              </Button>
            )}
            {showHeader && (
              <div>
                <div className="flex items-center gap-3">
                  <ClubBadge clubId={clubId} name={club?.name ?? "Club"} size="md" />
                  <h1 className="text-2xl font-bold">
                    {club?.name ?? "Club"} Leaderboard
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All-time points. Top 50 members.
                </p>
              </div>
            )}
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>{body}</CardContent>
        </Card>
      </div>
    );
  }

  return body;
}
