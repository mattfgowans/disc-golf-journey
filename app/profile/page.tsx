"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useRef } from "react";

type Handedness = "RHBH" | "RHFH" | "LHBH" | "LHFH";
const HANDEDNESS_LABELS: Record<Handedness, string> = {
  RHBH: "Right Hand Backhand",
  RHFH: "Right Hand Forehand",
  LHBH: "Left Hand Backhand",
  LHFH: "Left Hand Forehand",
};
const HANDEDNESS_OPTIONS: Handedness[] = ["RHBH", "RHFH", "LHBH", "LHFH"];

function isHandedness(v: unknown): v is Handedness {
  return typeof v === "string" && HANDEDNESS_OPTIONS.includes(v as Handedness);
}

function deepClean<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      const cleaned = deepClean(v as Record<string, unknown>);
      if (Object.keys(cleaned).length > 0) out[k] = cleaned;
    } else {
      out[k] = v;
    }
  }
  return out;
}
import { Button } from "@/components/ui/button";
import { usePageHeader } from "@/components/layout/header-context";
import { useUserDoc } from "@/lib/useUserDoc";
import { RequireAuth } from "@/components/auth/require-auth";
import PageWrapper from "@/components/layout/page-wrapper";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-auth";
import { getUserStats } from "@/lib/leaderboard";
import { getRankAndPrestige, PRESTIGE_STEP_POINTS } from "@/lib/ranks";
export default function Page() {
  const headerConfig = useMemo(() => ({ title: "You" }), []);
  usePageHeader(headerConfig);
  const { user, signOut } = useAuth();
  const { userData: profile, loading: profileLoading } = useUserDoc();
  const [stats, setStats] = useState<{ allTime: number } | null>(null);

  const updateProfile = async (updates: Record<string, any>) => {
    if (!user) throw new Error("Not authenticated");

    const cleanedUpdates = deepClean(updates) as Record<string, any>;
    const userRef = doc(db, "users", user.uid);

    // If username is being updated, check availability and sync usernames + publicProfiles
    if (cleanedUpdates.username && cleanedUpdates.username !== (profile?.username ?? profile?.profile?.username)) {
      const normalizedUsername = cleanedUpdates.username.trim().toLowerCase().replace(/^@/, "");
      const oldUsername = (profile?.username ?? profile?.profile?.username ?? "").toString().trim().toLowerCase().replace(/^@/, "");
      const usernameRef = doc(db, "usernames", normalizedUsername);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists() && usernameSnap.data().uid !== user.uid) {
        throw new Error("Username already taken");
      }

      // Remove old usernames doc (rules allow delete only when resource.data.uid == request.auth.uid)
      if (oldUsername && oldUsername !== normalizedUsername) {
        const oldUsernameRef = doc(db, "usernames", oldUsername);
        try {
          await deleteDoc(oldUsernameRef);
        } catch {
          // Ignore if doc missing or permission denied
        }
      }

      await setDoc(usernameRef, {
        uid: user.uid,
        username: normalizedUsername,
        updatedAt: serverTimestamp()
      }, { merge: true });

      cleanedUpdates.username = normalizedUsername;
      cleanedUpdates.profile = { ...(cleanedUpdates.profile ?? {}), username: normalizedUsername };
    }

    await setDoc(userRef, cleanedUpdates, { merge: true });

    // Keep publicProfiles in sync (username and photoURL)
    const currentUsername = (cleanedUpdates.username ?? profile?.username ?? profile?.profile?.username ?? "").toString().trim().toLowerCase().replace(/^@/, "");
    const photoURL = updates.profile?.photoURL ?? profile?.profile?.photoURL ?? profile?.photoURL ?? null;
    if (currentUsername) {
      await setDoc(doc(db, "publicProfiles", user.uid), {
        uid: user.uid,
        username: currentUsername,
        photoURL,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  // Fetch Firestore stats for rank/prestige display
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setStats({ allTime: 0 });
      return;
    }
    let cancelled = false;
    getUserStats(uid)
      .then((s) => {
        if (!cancelled) setStats({ allTime: s.allTime });
      })
      .catch(() => {
        if (!cancelled) setStats({ allTime: 0 });
      });
    return () => { cancelled = true; };
  }, [user?.uid]);

  const allTimePoints = stats?.allTime ?? 0;
  const rp = getRankAndPrestige(allTimePoints);

  return (
    <RequireAuth>
      <PageWrapper>
      {/* Handle profile loading and error states inside RequireAuth */}
      {profileLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      ) : !profile ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm text-gray-600">Couldn&apos;t load your profile. Try refreshing.</p>
        </div>
      ) : (
        <ProfileContent
          profile={profile}
          user={user}
          signOut={signOut}
          updateProfile={updateProfile}
          rankPrestige={rp}
          prestigeStep={PRESTIGE_STEP_POINTS}
        />
      )}
      </PageWrapper>
    </RequireAuth>
  );
}

function ProfileContent({
  profile,
  user,
  signOut,
  updateProfile,
  rankPrestige,
  prestigeStep,
}: {
  profile: Record<string, any>;
  user: { displayName?: string | null; email?: string | null } | null;
  signOut: () => Promise<void>;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
  rankPrestige: ReturnType<typeof getRankAndPrestige>;
  prestigeStep: number;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const username = profile.username ?? "";
  const homeCourse = profile.homeCourse ?? "";
  const handedness = isHandedness(profile.handedness) ? profile.handedness : "";
  const bio = profile.bio ?? "";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSheetEntered, setEditSheetEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number | null>(null);
  const dragYRef = useRef(0);
  const lastMoveTime = useRef(0);
  const lastMoveY = useRef(0);
  const [editUsername, setEditUsername] = useState(username || "");
  const [editHomeCourse, setEditHomeCourse] = useState(homeCourse || "");
  const [editHandedness, setEditHandedness] = useState(handedness || "");
  const [editBio, setEditBio] = useState(bio || "");
  const [showToast, setShowToast] = useState(false);

  const openEditModal = () => {
    setEditUsername(username || "");
    setEditHomeCourse(homeCourse || "");
    setEditHandedness(handedness || "");
    setEditBio(bio || "");
    setIsEditOpen(true);
  };

  useEffect(() => {
    if (!isEditOpen) {
      setEditSheetEntered(false);
      return;
    }
    setEditSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEditSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [isEditOpen]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        bio: (editBio ?? "").toString(),
        homeCourse: (editHomeCourse ?? "").toString(),
        username: (editUsername ?? "").toString(),
      };
      if (isHandedness(editHandedness)) payload.handedness = editHandedness;

      await updateProfile(payload as Record<string, any>);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setIsEditOpen(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      if (error.message === "Username already taken") {
        alert("That username is already taken. Please choose a different username.");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    (profile.displayName || "A")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

  const userInitial = initials[0] ?? "?";
  const rank = rankPrestige.rank.name;
  const points = rankPrestige.allTimePoints;
  const pointsToNextRank = rankPrestige.progress.nextRank
    ? rankPrestige.progress.pointsToNext
    : prestigeStep - rankPrestige.pointsInPrestige;
  const nextRank = rankPrestige.progress.nextRank
    ? rankPrestige.progress.nextRank.name
    : "next Prestige";

  return (
    <div className="container mx-auto py-6 max-w-2xl md:py-8">
      <div className="space-y-6">
        <div className="mb-4 rounded-2xl border bg-muted/40 p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {userInitial}
            </div>

            <div className="text-lg font-semibold">
              {username ? `@${username}` : "—"}
            </div>

            <div className="text-sm text-muted-foreground text-center">
              {rank} • {points.toLocaleString()} pts
            </div>

            <div className="text-xs text-muted-foreground">
              {pointsToNextRank} pts to {nextRank}
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold md:text-3xl">{profile.displayName}</h1>
        </div>

        {/* Profile Information */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold md:text-2xl">Profile Information</h2>
              <Button
                variant="outline"
                className="w-full"
                onClick={openEditModal}
              >
                Edit Profile
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Bio</span>
                <span className="text-sm font-medium">{profile.bio || "No bio yet"}</span>
              </div>
              <div className="border-t my-1" />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Home Course</span>
                <span className="text-sm font-medium">{profile.homeCourse || "Not set"}</span>
              </div>
              <div className="border-t my-1" />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="text-sm font-medium">
                  {profile.username ? `@${profile.username}` : "Not set"}
                </span>
              </div>
              <div className="border-t my-1" />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Handedness</span>
                <span className="text-sm font-medium">
                  {isHandedness(profile.handedness) ? HANDEDNESS_LABELS[profile.handedness] : "Not set"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Beta Feedback */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Beta Feedback</h3>
            <p className="text-sm text-muted-foreground">
              Help improve Disc Golf Journey by reporting bugs, confusing spots, or feature ideas.
            </p>
            <a
              href="https://forms.gle/usGuEsyy5LZJA7Wy6"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full sm:w-auto">Send Feedback</Button>
            </a>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">{user?.displayName ?? profile.displayName ?? "—"}</div>
              {user?.email && (
                <div className="text-muted-foreground truncate">{user.email}</div>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-4"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${0.4 - Math.min(dragY / 300, 0.3)})`,
          }}
          onClick={() => setIsEditOpen(false)}
        >
          <div
            className="mb-2 max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl bg-white p-4"
            style={{
              touchAction: "pan-x",
              transform: editSheetEntered
                ? `translateY(calc(-28px + ${dragY}px))`
                : "translateY(100%)",
              transition: isDragging ? "none" : "transform 0.25s ease-out",
            }}
            onPointerDown={(e) => {
              startYRef.current = e.clientY;
              setIsDragging(true);
            }}
            onPointerMove={(e) => {
              if (!isDragging || startYRef.current === null) return;

              e.preventDefault();

              const now = Date.now();
              const delta = e.clientY - startYRef.current;

              if (delta > 0) {
                dragYRef.current = delta;
                setDragY(delta);

                lastMoveTime.current = now;
                lastMoveY.current = e.clientY;
              }
            }}
            onPointerUp={(e) => {
              setIsDragging(false);

              const timeDiff = Date.now() - lastMoveTime.current;
              const distance = e.clientY - lastMoveY.current;

              const velocity = distance / (timeDiff || 1);

              if (dragYRef.current > 120 || velocity > 0.5) {
                setIsEditOpen(false);
              }

              dragYRef.current = 0;
              setDragY(0);
              startYRef.current = null;
            }}
            onPointerCancel={() => {
              setIsDragging(false);
              dragYRef.current = 0;
              setDragY(0);
              startYRef.current = null;
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-1 pb-2">
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <h2 className="text-center text-lg font-semibold">Edit Profile</h2>

            <div className="space-y-3">
              <input
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />

              <input
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Home Course"
                value={editHomeCourse}
                onChange={(e) => setEditHomeCourse(e.target.value)}
              />

              <input
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Handedness"
                value={editHandedness}
                onChange={(e) => setEditHandedness(e.target.value)}
              />

              <textarea
                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="sticky bottom-0 bg-white pt-2 pb-1">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  className="flex-1 transition-transform active:scale-95"
                  disabled={isSaving}
                  onClick={() => void handleSave()}
                >
                  {isSaving ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2">
          <div className="rounded-xl bg-black px-4 py-2 text-sm text-white shadow-lg">
            Profile updated
          </div>
        </div>
      )}
    </div>
  );
}
