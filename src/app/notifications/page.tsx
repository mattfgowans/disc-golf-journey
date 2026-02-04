"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import {
  getIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/lib/friends";
import type { FriendRequest } from "@/lib/friends";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyFromUid, setBusyFromUid] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const all = await getIncomingFriendRequests(user.uid);
      const pending = all.filter((r) => r.status === "pending");
      setRequests(pending);
    } catch (e) {
      console.error("Error loading notifications:", e);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setRequests([]);
      return;
    }
    loadRequests();
  }, [user?.uid]);

  const handleAccept = async (fromUid: string) => {
    if (!user?.uid) return;
    setBusyFromUid(fromUid);
    setError(null);
    try {
      await acceptFriendRequest(user.uid, fromUid);
      setRequests((prev) => prev.filter((r) => r.fromUid !== fromUid));
    } catch (e) {
      console.error("Error accepting request:", e);
      setError("Failed to accept. Please try again.");
    } finally {
      setBusyFromUid(null);
    }
  };

  const handleDecline = async (fromUid: string) => {
    if (!user?.uid) return;
    setBusyFromUid(fromUid);
    setError(null);
    try {
      await rejectFriendRequest(user.uid, fromUid);
      setRequests((prev) => prev.filter((r) => r.fromUid !== fromUid));
    } catch (e) {
      console.error("Error declining request:", e);
      setError("Failed to decline. Please try again.");
    } finally {
      setBusyFromUid(null);
    }
  };

  return (
    <RequireAuth>
      <div className="container mx-auto py-6 sm:py-8 max-w-2xl px-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Notifications</h1>

        {error && (
          <p className="text-sm text-destructive mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            {error}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Friend requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 animate-pulse"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No notifications yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {requests.map((request) => {
                  const primaryLabel = request.fromUsername
                    ? `@${request.fromUsername}`
                    : "Player";
                  const isAnyBusy = busyFromUid !== null;

                  return (
                    <li
                      key={request.fromUid}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={request.fromPhotoURL} />
                          <AvatarFallback className="text-sm">
                            {primaryLabel.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {primaryLabel}
                          </p>
                          {request.fromDisplayName && (
                            <p className="text-xs text-muted-foreground truncate">
                              {request.fromDisplayName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request.fromUid)}
                          disabled={isAnyBusy}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(request.fromUid)}
                          disabled={isAnyBusy}
                        >
                          Decline
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loading && (
              <div className="pt-3 border-t text-center">
                <Link
                  href="/friends"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Go to Friends →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
