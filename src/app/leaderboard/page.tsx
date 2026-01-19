"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { getLeaderboard, LeaderboardEntry, LeaderboardPeriod } from "@/lib/leaderboard";
import { RequireAuth } from "@/components/auth/require-auth";

function LeaderboardEntry({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-center w-10">
        {getRankIcon(rank)}
      </div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.photoURL} />
        <AvatarFallback>
          {entry.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.displayName}</p>
        {entry.username && (
          <p className="text-xs text-muted-foreground">@{entry.username}</p>
        )}
      </div>
      <Badge variant="secondary" className="font-bold">
        {entry.points} pts
      </Badge>
    </div>
  );
}

function LeaderboardTab({ period }: { period: LeaderboardPeriod }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard(period);
        setEntries(data);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [period]);

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
          Be the first to earn points and claim the top spot!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <LeaderboardEntry key={entry.uid} entry={entry} rank={index + 1} />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <RequireAuth title="Sign in to view leaderboards" subtitle="Sign in with Google to see how you rank against other players.">
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you stack up against other disc golfers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Today</TabsTrigger>
                <TabsTrigger value="weekly">This Week</TabsTrigger>
                <TabsTrigger value="yearly">This Year</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-6">
                <LeaderboardTab period="daily" />
              </TabsContent>

              <TabsContent value="weekly" className="mt-6">
                <LeaderboardTab period="weekly" />
              </TabsContent>

              <TabsContent value="yearly" className="mt-6">
                <LeaderboardTab period="yearly" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}