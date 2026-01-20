"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Medal, Award, Users, UserPlus } from "lucide-react";
import { getLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/leaderboard";
import {
  getFriends,
  getIncomingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
} from "@/lib/friends";
import type { Friend, FriendRequest } from "@/lib/friends";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
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
      className={`flex items-center space-x-4 p-4 rounded-lg border ${
        isCurrentUser ? "bg-primary/5 border-primary/20" : "bg-card"
      } hover:bg-accent/50 transition-colors`}
    >
      <div className="flex items-center justify-center w-10">
        {getRankIcon(rank)}
      </div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.photoURL} />
        <AvatarFallback className="text-sm">
          {entry.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold truncate ${isCurrentUser ? "text-primary" : ""}`}
        >
          {entry.displayName}
          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
        </p>
        {entry.username && (
          <p className="text-sm text-muted-foreground">@{entry.username}</p>
        )}
      </div>
      <Badge variant="secondary" className="font-bold">
        {entry.points.toLocaleString()} XP
      </Badge>
    </div>
  );
}

function LeaderboardTab({
  period,
  currentUserId,
}: {
  period: LeaderboardPeriod;
  currentUserId: string;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
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
          Be the first to earn XP and claim the top spot!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <LeaderboardRow
          key={entry.uid}
          entry={entry}
          rank={index + 1}
          isCurrentUser={entry.uid === currentUserId}
        />
      ))}
    </div>
  );
}

function FriendsSection({ currentUserId }: { currentUserId: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [friendUid, setFriendUid] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFriendsData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(currentUserId),
        getIncomingFriendRequests(currentUserId),
      ]);
      setFriends(friendsData);
      setIncomingRequests(requestsData);
    } catch (error) {
      console.error("Error loading friends data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, [currentUserId]);

  const handleSendRequest = async () => {
    if (!friendUid.trim()) return;

    try {
      await sendFriendRequest(currentUserId, friendUid.trim());
      setFriendUid("");
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request. Please check the user ID.");
    }
  };

  const handleAcceptRequest = async (fromUid: string) => {
    try {
      await acceptFriendRequest(currentUserId, fromUid);
      await loadFriendsData(); // Refresh the data
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Send Friend Request */}
        <div className="space-y-2">
          <Label htmlFor="friend-uid">Send Friend Request</Label>
          <div className="flex gap-2">
            <Input
              id="friend-uid"
              placeholder="Enter user ID"
              value={friendUid}
              onChange={(e) => setFriendUid(e.target.value)}
            />
            <Button onClick={handleSendRequest} size="sm">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <div className="space-y-2">
            <Label>Incoming Requests</Label>
            <div className="space-y-2">
              {incomingRequests.map((request) => (
                <div
                  key={request.fromUid}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm">From: {request.fromUid}</span>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.fromUid)}
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-2">
          <Label>Your Friends ({friends.length})</Label>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No friends yet. Send some friend requests!
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="flex items-center space-x-2 p-2 border rounded"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={friend.photoURL} />
                    <AvatarFallback className="text-xs">
                      {friend.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {friend.displayName}
                    </p>
                    {friend.username && (
                      <p className="text-xs text-muted-foreground">
                        @{friend.username}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();

  return (
    <RequireAuth
      title="Sign in to view leaderboards"
      subtitle="Sign in with Google to see how you rank against other players."
    >
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏆 Global Leaderboard</h1>
          <p className="text-muted-foreground">
            Compete with players worldwide and connect with friends
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="weekly" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="weekly">This Week</TabsTrigger>
                  <TabsTrigger value="monthly">This Month</TabsTrigger>
                  <TabsTrigger value="yearly">This Year</TabsTrigger>
                  <TabsTrigger value="allTime">All Time</TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="mt-6">
                  <LeaderboardTab
                    period="weekly"
                    currentUserId={user?.uid || ""}
                  />
                </TabsContent>

                <TabsContent value="monthly" className="mt-6">
                  <LeaderboardTab
                    period="monthly"
                    currentUserId={user?.uid || ""}
                  />
                </TabsContent>

                <TabsContent value="yearly" className="mt-6">
                  <LeaderboardTab
                    period="yearly"
                    currentUserId={user?.uid || ""}
                  />
                </TabsContent>

                <TabsContent value="allTime" className="mt-6">
                  <LeaderboardTab
                    period="allTime"
                    currentUserId={user?.uid || ""}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <FriendsSection currentUserId={user?.uid || ""} />
        </div>
      </div>
    </RequireAuth>
  );
}
