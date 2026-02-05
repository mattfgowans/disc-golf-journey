"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import { getPublicProfileByUsername } from "@/lib/publicProfile";
import type { PublicProfile } from "@/lib/publicProfile";
import {
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
} from "@/lib/friends";
import { normalizeUsername } from "@/lib/usernames";
import { UserPlus, Loader2, Check, Clock } from "lucide-react";

function PublicProfileContent() {
  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("username") ?? "";
  const normalized = normalizeUsername(usernameParam);

  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set());
  const [outgoingToUids, setOutgoingToUids] = useState<Set<string>>(new Set());
  const [incomingFromUids, setIncomingFromUids] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [resolveError, setResolveError] = useState<"permission-denied" | null>(null);

  useEffect(() => {
    if (!normalized) {
      setLoading(false);
      setProfile(null);
      setResolveError(null);
      return;
    }
    let cancelled = false;
    setResolveError(null);
    (async () => {
      setLoading(true);
      try {
        const [pub, friends, outgoing, incoming] = await Promise.all([
          getPublicProfileByUsername(normalized, { currentUid: user?.uid ?? null }),
          user?.uid ? getFriends(user.uid) : Promise.resolve([]),
          user?.uid ? getOutgoingFriendRequests(user.uid) : Promise.resolve([]),
          user?.uid ? getIncomingFriendRequests(user.uid) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setProfile(pub);
        setResolveError(null);
        setFriendUids(new Set((friends ?? []).map((f) => f.uid)));
        setOutgoingToUids(new Set((outgoing ?? []).map((r) => r.toUid)));
        setIncomingFromUids(new Set((incoming ?? []).map((r) => r.fromUid)));
      } catch (e) {
        if (cancelled) return;
        const code = (e as { code?: string })?.code;
        if (code === "permission-denied") {
          console.error("[PublicProfile] permission-denied resolving profile for", normalized, e);
          setResolveError("permission-denied");
        }
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [normalized, user?.uid]);

  const isSelf = user?.uid && profile?.uid === user.uid;
  const isFriend = user?.uid && friendUids.has(profile?.uid ?? "");
  const isPending = user?.uid && outgoingToUids.has(profile?.uid ?? "");
  const isIncoming = user?.uid && incomingFromUids.has(profile?.uid ?? "");

  const handleAddFriend = async () => {
    if (!user?.uid || !profile) return;
    setSending(true);
    setMessage(null);
    try {
      await sendFriendRequest(user.uid, profile.uid, profile.username);
      setOutgoingToUids((prev) => new Set(prev).add(profile.uid));
      setMessage({ type: "success", text: "Friend request sent!" });
    } catch (err: any) {
      setMessage({ type: "error", text: (err?.message as string) || "Failed to send request." });
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user?.uid || !profile) return;
    setAccepting(true);
    setMessage(null);
    try {
      await acceptFriendRequest(user.uid, profile.uid);
      setIncomingFromUids((prev) => {
        const next = new Set(prev);
        next.delete(profile.uid);
        return next;
      });
      setFriendUids((prev) => new Set(prev).add(profile.uid));
      setMessage({ type: "success", text: "Friend request accepted!" });
    } catch (err: any) {
      setMessage({ type: "error", text: (err?.message as string) || "Failed to accept." });
    } finally {
      setAccepting(false);
    }
  };

  if (!normalized) {
    return (
      <RequireAuth>
        <div className="container max-w-md mx-auto py-8 px-4">
          <p className="text-muted-foreground text-center">Missing or invalid username.</p>
          <div className="mt-4 text-center">
            <Link href="/leaderboard" className="text-sm text-primary hover:underline">
              Back to leaderboard
            </Link>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="container max-w-md mx-auto py-8 px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RequireAuth>
    );
  }

  if (!profile) {
    return (
      <RequireAuth>
        <div className="container max-w-md mx-auto py-8 px-4">
          {resolveError === "permission-denied" ? (
            <p className="text-destructive text-center">
              You don&apos;t have permission to view this profile. Try signing out and back in.
            </p>
          ) : (
            <p className="text-muted-foreground text-center">No user with that username.</p>
          )}
          <div className="mt-4 text-center">
            <Link href="/leaderboard" className="text-sm text-primary hover:underline">
              Back to leaderboard
            </Link>
          </div>
        </div>
      </RequireAuth>
    );
  }

  const displayHandle = `@${profile.username}`;
  const avatarLetter = (profile.username || "?").charAt(0).toUpperCase();

  return (
    <RequireAuth>
      <div className="container max-w-md mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <Avatar className="h-20 w-20 mx-auto">
              {profile.photoURL ? (
                <AvatarImage src={profile.photoURL} alt={displayHandle} />
              ) : null}
              <AvatarFallback className="text-2xl">{avatarLetter}</AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold truncate">{displayHandle}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {message && (
              <p
                className={
                  message.type === "error"
                    ? "text-sm text-destructive"
                    : "text-sm text-green-600"
                }
              >
                {message.text}
              </p>
            )}
            {isSelf ? (
              <div className="space-y-2 text-center">
                <p className="text-sm font-medium">This is you</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile">View your profile</Link>
                </Button>
              </div>
            ) : isFriend ? (
              <Button
                className="w-full bg-muted/60 text-muted-foreground"
                disabled
                aria-disabled
              >
                <Check className="h-4 w-4 mr-2" />
                Friends
              </Button>
            ) : isPending ? (
              <Button
                className="w-full bg-muted/60 text-muted-foreground"
                disabled
                aria-disabled
              >
                <Clock className="h-4 w-4 mr-2" />
                Request sent
              </Button>
            ) : isIncoming ? (
              <Button
                className="w-full"
                disabled={accepting}
                onClick={handleAcceptRequest}
              >
                {accepting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Accept request
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={sending}
                onClick={handleAddFriend}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Add friend
              </Button>
            )}
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <Link href="/leaderboard" className="text-sm text-primary hover:underline">
            ← Leaderboard
          </Link>
        </div>
      </div>
    </RequireAuth>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-md mx-auto py-8 px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PublicProfileContent />
    </Suspense>
  );
}
