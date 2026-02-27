"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

export interface LeaderboardRowEntry {
  uid: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  points: number;
}

export function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardRowEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const name = entry.displayName ?? "Anonymous";
  const handle = entry.username ? `@${entry.username}` : null;
  const primaryLabel = handle ?? name;
  const avatarLetter = (name || "A").charAt(0).toUpperCase();

  return (
    <div
      className={`min-w-0 flex items-center gap-2 sm:gap-3 px-3 py-2 sm:p-4 rounded-lg border ${
        isCurrentUser ? "bg-primary/5 border-primary/20" : "bg-card"
      } hover:bg-accent/50 transition-colors`}
    >
      <div className="w-6 flex items-center justify-center text-muted-foreground">
        {rank === 1 ? (
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
        ) : rank === 2 ? (
          <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        ) : rank === 3 ? (
          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
        ) : (
          <span className="text-xs sm:text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        )}
      </div>
      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
        {entry.photoURL ? <AvatarImage src={entry.photoURL} /> : null}
        <AvatarFallback className="text-sm">{avatarLetter}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {entry.username ? (
            <Link
              href={`/u?username=${encodeURIComponent(entry.username)}`}
              className="text-sm sm:text-base font-semibold truncate text-primary hover:underline"
            >
              {primaryLabel}
            </Link>
          ) : (
            <p className="text-sm sm:text-base font-semibold truncate">
              {primaryLabel}
            </p>
          )}
          {isCurrentUser && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0">
              You
            </Badge>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 font-bold whitespace-nowrap">
          {entry.points.toLocaleString()} XP
        </Badge>
      </div>
    </div>
  );
}
