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
  getOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  removeFriend,
  debugFriendRequestsSelfTest,
} from "@/lib/friends";
import type { Friend, FriendRequest } from "@/lib/friends";
import { resolveUsernameToUid } from "@/lib/usernames";
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
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friendUid, setFriendUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [unfriendingFriend, setUnfriendingFriend] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const loadFriendsData = async () => {
    try {
      const [friendsData, incomingRequestsData, outgoingRequestsData] = await Promise.all([
        getFriends(currentUserId),
        getIncomingFriendRequests(currentUserId),
        getOutgoingFriendRequests(currentUserId),
      ]);
      setFriends(friendsData);
      setIncomingRequests(incomingRequestsData);
      setOutgoingRequests(outgoingRequestsData);
    } catch (error) {
      console.error("Error loading friends data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    loadFriendsData();
  }, [currentUserId]);

  // Clear messages when input changes
  useEffect(() => {
    if (friendUid) {
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [friendUid]);

  const handleSendRequest = async () => {
    if (!friendUid.trim()) return;

    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Normalize input: allow "@username" or "username"
      const raw = friendUid.trim();
      const normalized = raw.startsWith("@") ? raw.slice(1) : raw;

      console.log("Resolving username:", normalized);

      // Resolve username to UID
      let targetUid;
      try {
        targetUid = await resolveUsernameToUid(normalized);
      } catch (e) {
        console.error("FAILED resolveUsernameToUid", e);
        throw e;
      }

      if (!targetUid) {
        setErrorMessage("User not found. Please check the username.");
        return;
      }

      if (targetUid === currentUserId) {
        setErrorMessage("You can't add yourself as a friend.");
        return;
      }

      console.log("Resolved UID:", targetUid, "Now sending request...");

      try {
        await sendFriendRequest(currentUserId, targetUid, normalized);
      } catch (e) {
        console.error("FAILED sendFriendRequest", e);
        throw e;
      }

      await loadFriendsData(); // Refresh friends/incoming/outgoing lists
      setFriendUid("");
      setSuccessMessage("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);

      // Handle specific friend request errors with user-friendly messages
      const errorMessage = (error as any)?.message || "";
      if (errorMessage === "You're already friends with this user.") {
        setErrorMessage("You're already friends with this user.");
      } else if (errorMessage === "You already sent a friend request to this user.") {
        setErrorMessage("You already sent a friend request to this user.");
      } else if (errorMessage.toLowerCase().includes("permission")) {
        setErrorMessage("Permissions error. Please try again after refresh.");
      } else if (errorMessage) {
        setErrorMessage(errorMessage);
      } else {
        setErrorMessage("Failed to send friend request. Please try again.");
      }
    } finally {
      setIsSending(false);
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

  const handleRejectRequest = async (request: FriendRequest) => {
    const displayName = request.fromUsername ? `@${request.fromUsername}` : request.fromUid;
    const ok = window.confirm(`Reject friend request from ${displayName}?`);
    if (!ok) return;

    setBusyRequestId(`incoming:${request.fromUid}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await rejectFriendRequest(currentUserId, request.fromUid);
      await loadFriendsData(); // Refresh friends/incoming/outgoing lists
      setSuccessMessage("Friend request rejected.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setErrorMessage("Failed to reject request.");
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleCancelRequest = async (request: FriendRequest) => {
    const displayName = request.toUsername ? `@${request.toUsername}` : request.toUid;
    const ok = window.confirm(`Cancel friend request to ${displayName}?`);
    if (!ok) return;

    setBusyRequestId(`outgoing:${request.toUid}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await cancelFriendRequest(currentUserId, request.toUid);
      await loadFriendsData(); // Refresh friends/incoming/outgoing lists
      setSuccessMessage("Friend request canceled.");
    } catch (error) {
      console.error("Error canceling friend request:", error);
      setErrorMessage("Failed to cancel request.");
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleUnfriend = async (friend: Friend) => {
    const ok = window.confirm(`Unfriend ${friend.displayName}?`);
    if (!ok) return;

    setUnfriendingFriend(friend.uid);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await removeFriend(currentUserId, friend.uid);
      await loadFriendsData(); // Refresh friends/incoming/outgoing lists
      setSuccessMessage("Unfriended.");
    } catch (error) {
      console.error("Error unfriending:", error);
      setErrorMessage("Failed to unfriend. Please try again.");
    } finally {
      setUnfriendingFriend(null);
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
              placeholder="Enter username (e.g. johndoe or @johndoe)"
              value={friendUid}
              onChange={(e) => setFriendUid(e.target.value)}
              disabled={isSending}
            />
            <Button onClick={handleSendRequest} size="sm" disabled={isSending}>
              {isSending ? "Sending..." : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
          )}
        </div>

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <div className="space-y-2">
            <Label>Incoming Requests</Label>
            <div className="space-y-2">
              {incomingRequests.map((request) => {
                const displayName = request.fromDisplayName ?? (request.fromUsername ? `@${request.fromUsername}` : request.fromUid);
                const username = request.fromUsername;

                return (
                  <div
                    key={request.fromUid}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={request.fromPhotoURL} />
                        <AvatarFallback className="text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">{displayName}</span>
                        {username && (
                          <span className="text-xs text-muted-foreground ml-1">@{username}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.fromUid)}
                        disabled={busyRequestId === `incoming:${request.fromUid}`}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request)}
                        disabled={busyRequestId === `incoming:${request.fromUid}`}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Outgoing Requests */}
        <div className="space-y-2">
          <Label>Outgoing Requests</Label>
          {outgoingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending outgoing requests.
            </p>
          ) : (
            <div className="space-y-2">
              {outgoingRequests.map((request) => {
                const username = request.toUsername;
                const displayName = username ? `@${username}` : request.toUid;

                return (
                  <div
                    key={request.toUid}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">{displayName}</span>
                        {username && (
                          <span className="text-xs text-muted-foreground ml-1">@{username}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelRequest(request)}
                      disabled={busyRequestId === `outgoing:${request.toUid}`}
                    >
                      Cancel
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfriend(friend)}
                    disabled={unfriendingFriend === friend.uid}
                  >
                    {unfriendingFriend === friend.uid ? "Removing..." : "Unfriend"}
                  </Button>
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
  const [isRunningTest, setIsRunningTest] = useState(false);

  return (
    <RequireAuth
      title="Sign in to view leaderboards"
      subtitle="Sign in with Google to see how you rank against other players."
    >
      <div className="container mx-auto py-8 max-w-4xl">
        {/* DEV-ONLY: Friend Requests Self-Test */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mb-4 flex justify-center">
            <Button
              onClick={async () => {
                if (!user?.uid) return;
                setIsRunningTest(true);
                try {
                  await debugFriendRequestsSelfTest(user.uid);
                  alert("✅ Self-test passed");
                } catch (error: any) {
                  alert(`❌ Self-test failed: ${error.message}`);
                } finally {
                  setIsRunningTest(false);
                }
              }}
              disabled={isRunningTest}
              variant="outline"
              size="sm"
            >
              {isRunningTest ? "Running..." : "Run Friend Requests Self-Test"}
            </Button>
          </div>
        )}

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
