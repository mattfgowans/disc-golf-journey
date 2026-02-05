"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";
import {
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "@/lib/friends";
import type { Friend, FriendRequest } from "@/lib/friends";
import { resolveUsernameToUid } from "@/lib/usernames";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";

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
      } else if (errorMessage.includes("already sent you a friend request")) {
        setErrorMessage("They already sent you a request — check Notifications to accept it.");
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
    setBusyRequestId(`incoming:${fromUid}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await acceptFriendRequest(currentUserId, fromUid);
      await loadFriendsData();
      setSuccessMessage("Friend request accepted.");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setErrorMessage("Failed to accept friend request.");
    } finally {
      setBusyRequestId(null);
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
    const label =
      friend.displayName?.trim() ||
      (friend.username ? `@${(friend.username ?? "").replace(/^@/, "").trim()}` : "this user");
    const ok = window.confirm(`Unfriend ${label}?`);
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
                const label = request.fromUsername ? `@${request.fromUsername}` : request.fromUid;
                const username = (request.fromUsername ?? "").replace(/^@/, "").trim() || null;
                const leftContent = (
                  <>
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={request.fromPhotoURL} />
                      <AvatarFallback className="text-xs">
                        {label.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">{label}</span>
                    </div>
                  </>
                );

                return (
                  <div
                    key={request.fromUid}
                    className="flex items-center justify-between gap-3 p-2 border rounded"
                  >
                    {username ? (
                      <Link
                        href={`/u?username=${encodeURIComponent(username)}`}
                        className="flex min-w-0 flex-1 items-center gap-2"
                      >
                        {leftContent}
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {leftContent}
                      </div>
                    )}
                    <div className="flex shrink-0 gap-2">
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
                const rawUsername = request.toUsername ?? "";
                const username = rawUsername.replace(/^@/, "").trim() || null;
                const primaryLabel = username ? `@${username}` : request.toUid;

                return (
                  <div
                    key={request.toUid}
                    className="flex items-center justify-between gap-3 p-2 border rounded"
                  >
                    {username ? (
                      <Link
                        href={`/u?username=${encodeURIComponent(username)}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="text-xs">
                            {primaryLabel.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-primary">
                            {primaryLabel}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="text-xs">
                            {primaryLabel.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{primaryLabel}</span>
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
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
              {friends.map((friend) => {
                const un = (friend.username ?? "").replace(/^@/, "").trim().toLowerCase();
                const dn = (friend.displayName ?? "").trim().toLowerCase();
                const redundant = un && dn && (dn === un || dn === `@${un}`);
                const showMutedUsername = friend.username && !redundant;

                return (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between gap-3 p-2 border rounded"
                  >
                    <div className="flex min-w-0 flex-1 items-center space-x-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={friend.photoURL} />
                        <AvatarFallback className="text-xs">
                          {(friend.displayName || `@${friend.username}` || "F").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        {friend.username ? (
                          <Link
                            href={`/u?username=${encodeURIComponent((friend.username ?? "").replace(/^@/, "").trim())}`}
                            className="block truncate text-sm font-medium text-primary hover:underline"
                          >
                            {friend.displayName || `@${friend.username}` || "Friend"}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-medium">
                            {friend.displayName || "Friend"}
                          </p>
                        )}
                        {showMutedUsername && (
                          <p className="truncate text-xs text-muted-foreground">
                            @{(friend.username ?? "").replace(/^@/, "").trim()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => handleUnfriend(friend)}
                      disabled={unfriendingFriend === friend.uid}
                    >
                      {unfriendingFriend === friend.uid ? "Removing..." : "Unfriend"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">👥 Friends</h1>
          <p className="text-muted-foreground">
            Connect with other players and build your disc golf community
          </p>
        </div>

        <FriendsSection currentUserId={user?.uid || ""} />
      </div>
    </RequireAuth>
  );
}