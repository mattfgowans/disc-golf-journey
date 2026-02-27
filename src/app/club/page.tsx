"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClubBadge } from "@/components/club/club-badge";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/lib/firebase-auth";
import { useUserDoc } from "@/lib/useUserDoc";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  createClub,
  joinClubByCode,
  leaveClub,
  ensureClubLeaderboardEntry,
  getUserClub,
  getPublicProfiles,
  getClubRankForUser,
  subscribeToClubMembers,
  type ClubDoc,
  type PublicProfileInfo,
} from "@/lib/clubs";

function ClubPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { userData, loading: userLoading } = useUserDoc();
  const clubId = (userData as any)?.clubId as string | undefined;
  const inviteCode = searchParams.get("code")?.trim().toUpperCase();
  const hasInviteCode = inviteCode && inviteCode.length === 6;

  const [club, setClub] = useState<ClubDoc | null>(null);
  const [clubLoading, setClubLoading] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [memberPreviewUids, setMemberPreviewUids] = useState<string[]>([]);
  const [memberPreview, setMemberPreview] = useState<
    { uid: string; displayName?: string; username?: string; photoURL?: string }[]
  >([]);
  const profileCacheRef = useRef<Map<string, PublicProfileInfo>>(new Map());
  const [createdByProfile, setCreatedByProfile] = useState<PublicProfileInfo | null>(null);
  const [createdByLoading, setCreatedByLoading] = useState(false);
  const [clubRank, setClubRank] = useState<{ rank: number; points: number } | null>(null);
  const [clubRankLoading, setClubRankLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const mapClubError = (e: unknown): string => {
    const code = (e as { code?: string })?.code;
    if (code === "permission-denied" || code === "unauthenticated") {
      return "Please sign in to join a club.";
    }
    if (code === "not-found") {
      return "Club not found. Check the code and try again.";
    }
    const msg = (e as Error)?.message ?? "";
    if (msg.toLowerCase().includes("no club found") || msg.toLowerCase().includes("invalid join code")) {
      return "Club not found. Check the code and try again.";
    }
    return "Something went wrong. Please try again.";
  };

  const isTimestamp = (v: unknown): v is { toDate: () => Date } =>
    !!v && typeof (v as { toDate?: unknown }).toDate === "function";

  const formatCreatedDate = (val: unknown): string => {
    let date: Date | null = null;
    if (isTimestamp(val)) {
      date = val.toDate();
    } else if (typeof val === "string") {
      date = new Date(val);
    }
    if (!date || isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const [joinCode, setJoinCode] = useState("");
  const [clubName, setClubName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);
  const [error, setError] = useState("");
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const autoJoinAttemptedRef = useRef(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && !clubId) {
      setJoinCode(codeFromUrl.trim().toUpperCase().slice(0, 6));
    }
  }, [searchParams, clubId]);

  useEffect(() => {
    if (
      userLoading ||
      !user ||
      clubId ||
      autoJoinAttemptedRef.current
    ) {
      return;
    }
    const code = searchParams.get("code")?.trim().toUpperCase();
    if (!code || code.length !== 6) return;

    autoJoinAttemptedRef.current = true;
    setError("");
    setAutoJoining(true);

    joinClubByCode(code, user.uid)
      .then(() => {
        router.replace("/club");
      })
      .catch((e) => {
        setError(mapClubError(e));
      })
      .finally(() => {
        setAutoJoining(false);
      });
  }, [userLoading, user, clubId, searchParams, router]);

  useEffect(() => {
    if (!clubId || !user?.uid) return;
    const ensureMember = async () => {
      try {
        await setDoc(
          doc(db, "clubs", clubId, "members", user.uid),
          { joinedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[club] ensure member doc failed", err);
        }
      }
    };
    ensureMember();

    ensureClubLeaderboardEntry(clubId, user.uid).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[club] ensureClubLeaderboardEntry failed", err);
      }
    });
  }, [clubId, user?.uid]);

  useEffect(() => {
    if (!clubId) {
      setClub(null);
      setCreatedByProfile(null);
      setCreatedByLoading(false);
      setClubRank(null);
      setClubRankLoading(false);
      setMemberCount(null);
      setMemberPreviewUids([]);
      setMemberPreview([]);
      return;
    }
    let cancelled = false;
    setClubLoading(true);
    getUserClub(clubId)
      .then((c) => {
        if (!cancelled) {
          setClub(c);
          if (c?.createdByUid) {
            setCreatedByLoading(true);
            getPublicProfiles([c.createdByUid]).then((map) => {
              if (!cancelled) {
                setCreatedByProfile(map[c.createdByUid] ?? null);
              }
            }).finally(() => {
              if (!cancelled) setCreatedByLoading(false);
            });
          } else {
            setCreatedByProfile(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setClub(null);
      })
      .finally(() => {
        if (!cancelled) setClubLoading(false);
      });
    const unsub = subscribeToClubMembers(clubId, (snap) => {
      if (cancelled) return;
      setMemberCount(snap.count);
      setMemberPreviewUids(snap.uids.slice(0, 6));
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [clubId]);

  useEffect(() => {
    if (!clubId || !user?.uid) return;
    let cancelled = false;
    setClubRankLoading(true);
    getClubRankForUser(clubId, user.uid)
      .then((result) => {
        if (!cancelled) setClubRank(result);
      })
      .catch(() => {
        if (!cancelled) setClubRank(null);
      })
      .finally(() => {
        if (!cancelled) setClubRankLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clubId, user?.uid]);

  useEffect(() => {
    if (memberPreviewUids.length === 0) {
      setMemberPreview([]);
      return;
    }
    const cache = profileCacheRef.current;
    const uidsToFetch = memberPreviewUids.filter((uid) => !cache.has(uid));

    const buildPreview = () =>
      memberPreviewUids.map((uid) => ({
        uid,
        ...cache.get(uid),
      }));

    if (uidsToFetch.length === 0) {
      setMemberPreview(buildPreview());
      return;
    }

    setMemberPreview(buildPreview());
    let cancelled = false;
    getPublicProfiles(uidsToFetch).then((profiles) => {
      if (cancelled) return;
      uidsToFetch.forEach((uid) => cache.set(uid, profiles[uid] ?? {}));
      setMemberPreview(buildPreview());
    });
    return () => {
      cancelled = true;
    };
  }, [memberPreviewUids]);

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setError("");
    setIsJoining(true);
    try {
      await joinClubByCode(joinCode, user.uid);
      setJoinCode("");
    } catch (e) {
      setError(mapClubError(e));
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !clubName.trim()) return;
    setError("");
    setIsCreating(true);
    try {
      await createClub(clubName.trim(), user.uid);
      setClubName("");
    } catch (e) {
      setError(mapClubError(e));
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!club?.joinCode || typeof window === "undefined") return;
    const url = `${window.location.origin}/club?code=${club.joinCode}`;
    const title = `${club.name} on Disc Golf Journey`;
    const text = `Join my club "${club.name}" with code ${club.joinCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 1500);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setError("");
    setIsLeaving(true);
    try {
      await leaveClub(user.uid);
      setLeaveDialogOpen(false);
    } catch (e) {
      setError(mapClubError(e));
    } finally {
      setIsLeaving(false);
    }
  };

  const handleSwitchConfirm = async () => {
    if (!user || !inviteCode) return;
    setSwitchError("");
    setIsSwitching(true);
    try {
      await leaveClub(user.uid);
      await joinClubByCode(inviteCode, user.uid);
      setSwitchDialogOpen(false);
      router.replace("/club");
    } catch (e) {
      setSwitchError(mapClubError(e));
    } finally {
      setIsSwitching(false);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Club</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create or join a club to compete on a private leaderboard with friends.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {hasInviteCode && clubId && (
        <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm">
          <p className="text-muted-foreground">
            You&apos;re already in a club. Leave your current club to join with code{" "}
            <span className="font-mono font-medium">{inviteCode}</span>.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setSwitchDialogOpen(true)}
          >
            Switch clubs
          </Button>
        </div>
      )}

      {!clubId ? (
        <Card>
          <CardHeader>
            <CardTitle>Join or Create</CardTitle>
            <p className="text-sm text-muted-foreground">
              {autoJoining
                ? "Joining club…"
                : "You're not in a club yet. Join with a code or create your own."}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {autoJoining ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Joining club…</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Join with code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="joinCode"
                      placeholder="ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="uppercase font-mono"
                      disabled={autoJoining}
                    />
                    <Button
                      onClick={handleJoin}
                      disabled={isJoining || autoJoining || !joinCode.trim()}
                    >
                      {isJoining ? "Joining…" : "Join"}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubName">Create a club</Label>
                  <div className="flex gap-2">
                    <Input
                      id="clubName"
                      placeholder="My Disc Golf Crew"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      disabled={autoJoining}
                    />
                    <Button
                      onClick={handleCreate}
                      disabled={isCreating || autoJoining || !clubName.trim()}
                    >
                      {isCreating ? "Creating…" : "Create"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {club && (
                  <ClubBadge clubId={clubId ?? "club"} name={club.name} size="md" />
                )}
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    {clubLoading ? "Loading…" : club?.name ?? "Your Club"}
                  </CardTitle>
                </div>
              </div>
            </div>
            {club && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground font-mono">
                    Join code: {club.joinCode}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInvite}
                    disabled={!club.joinCode}
                  >
                    {inviteCopied ? "Copied!" : "Invite"}
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
                  <span className="text-muted-foreground text-xs">Created</span>
                  <span className="text-xs sm:text-sm truncate">
                    {formatCreatedDate(club.createdAt)}
                  </span>
                  <span className="text-muted-foreground text-xs">Created by</span>
                  <span className="text-xs sm:text-sm truncate">
                    {createdByLoading
                      ? "…"
                      : createdByProfile?.username
                        ? `@${createdByProfile.username}`
                        : createdByProfile?.displayName ?? club.createdByUid ?? "—"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Members:{" "}
                  {memberCount === null ? "…" : memberCount}
                </p>
                {memberPreview.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-wrap items-end gap-3">
                      {memberPreview.map((m) => {
                        const label = m.username
                          ? `@${m.username}`
                          : m.displayName || "Member";
                        const letter = (label || "M").charAt(0).toUpperCase();
                        return (
                          <div
                            key={m.uid}
                            className="flex flex-col items-center gap-1"
                          >
                            <Avatar className="h-8 w-8">
                              {m.photoURL ? (
                                <AvatarImage src={m.photoURL} alt={label} />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {letter}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground max-w-[4rem] truncate text-center">
                              {m.username ? `@${m.username}` : m.displayName || "Member"}
                            </span>
                          </div>
                        );
                      })}
                      {memberCount !== null && memberCount > 6 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{memberCount - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {clubId && (clubRankLoading || clubRank) && (
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Your club rank</p>
                {clubRankLoading ? (
                  <div className="mt-1 h-10 bg-muted rounded animate-pulse" />
                ) : clubRank ? (
                  <p className="mt-1 text-sm">
                    #{clubRank.rank} · {clubRank.points} pts
                  </p>
                ) : null}
              </div>
            )}
            <Button asChild className="w-full">
              <Link href="/club/leaderboard">View Club Leaderboard</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setLeaveDialogOpen(true)}
            >
              Leave Club
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Club?</DialogTitle>
            <DialogDescription>
              You will be removed from the club leaderboard. You can rejoin later with the join code.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? "Leaving…" : "Leave Club"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={switchDialogOpen}
        onOpenChange={(open) => {
          setSwitchDialogOpen(open);
          if (!open) setSwitchError("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch clubs?</DialogTitle>
            <DialogDescription>
              You&apos;ll leave your current club and join the new one.
            </DialogDescription>
          </DialogHeader>
          {switchError && (
            <p className="text-sm text-destructive">{switchError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSwitchConfirm} disabled={isSwitching}>
              {isSwitching ? "Switching…" : "Switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClubPage() {
  return (
    <RequireAuth>
      <ClubPageInner />
    </RequireAuth>
  );
}
