"use client";

import { useState, useEffect } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserDoc } from "@/lib/useUserDoc";
import { RequireAuth } from "@/components/auth/require-auth";
import { Loader2, Edit2, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-auth";
import { getUserStats } from "@/lib/leaderboard";
import { getRankAndPrestige, PRESTIGE_STEP_POINTS } from "@/lib/ranks";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { userData: profile, loading: profileLoading } = useUserDoc();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
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

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        ...profile,
        username: profile.username ?? "",
        handedness: isHandedness(profile.handedness) ? profile.handedness : "",
      });
    }
  }, [profile]);

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
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          updateProfile={updateProfile}
          rankPrestige={rp}
          prestigeStep={PRESTIGE_STEP_POINTS}
        />
      )}
    </RequireAuth>
  );
}

function ProfileContent({
  profile,
  user,
  signOut,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  updateProfile,
  rankPrestige,
  prestigeStep,
}: {
  profile: Record<string, any>;
  user: { displayName?: string | null; email?: string | null } | null;
  signOut: () => Promise<void>;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editForm: Record<string, any>;
  setEditForm: (form: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
  rankPrestige: ReturnType<typeof getRankAndPrestige>;
  prestigeStep: number;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const displayNameVal = (editForm.displayName ?? profile.displayName ?? "").toString().trim();
      const payload: Record<string, unknown> = {
        bio: (editForm.bio ?? "").toString(),
        homeCourse: (editForm.homeCourse ?? "").toString(),
        username: (editForm.username ?? "").toString(),
      };
      if (displayNameVal) payload.displayName = displayNameVal;
      if (isHandedness(editForm.handedness)) payload.handedness = editForm.handedness;

      await updateProfile(payload as Record<string, any>);
      setIsEditing(false);
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

  const handleCancel = () => {
    setEditForm({
      ...profile,
      username: profile.username ?? "",
      handedness: isHandedness(profile.handedness) ? profile.handedness : "",
    });
    setIsEditing(false);
  };

  const initials =
    (profile.displayName || "A")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex justify-start mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage src={profile.photoURL} alt={profile.displayName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold">{profile.displayName}</h1>
        </div>

        {/* Rank + Prestige */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Rank & Prestige</h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Rank:</span> {rankPrestige.rank.name}
            </div>
            <div>
              <span className="font-medium">Prestige:</span> {rankPrestige.prestige}
            </div>
            {rankPrestige.progress.nextRank ? (
              <div className="text-muted-foreground">
                {rankPrestige.progress.pointsToNext} pts to {rankPrestige.progress.nextRank.name}
              </div>
            ) : (
              <div className="text-muted-foreground">
                {prestigeStep - rankPrestige.pointsInPrestige} pts to next Prestige
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Profile Information</h2>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={editForm.bio || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm(prev => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about your disc golf journey..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <p className="mt-1 text-sm">{profile.bio || "No bio yet"}</p>
              )}
            </div>

            {/* Home Course */}
            <div>
              <Label htmlFor="homeCourse">Home Course</Label>
              {isEditing ? (
                <Input
                  id="homeCourse"
                  value={editForm.homeCourse || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, homeCourse: e.target.value }))}
                  placeholder="Your favorite course"
                />
              ) : (
                <p className="mt-1 text-sm">{profile.homeCourse || "Not set"}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username">Username</Label>
              <p className="text-xs text-muted-foreground mb-1">
                This is how friends can find you. Letters/numbers only.
              </p>
              {isEditing ? (
                <Input
                  id="username"
                  value={editForm.username || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="@yourname"
                />
              ) : (
                <p className="mt-1 text-sm">{profile.username ? `@${profile.username}` : "Not set"}</p>
              )}
            </div>

            {/* Handedness */}
            <div>
              <Label htmlFor="handedness">Handedness</Label>
              {isEditing ? (
                <select
                  id="handedness"
                  value={editForm.handedness ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditForm(prev => ({ ...prev, handedness: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select handedness…</option>
                  {HANDEDNESS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{HANDEDNESS_LABELS[opt]}</option>
                  ))}
                </select>
              ) : (
                <p className="mt-1 text-sm">
                  {isHandedness(profile.handedness) ? HANDEDNESS_LABELS[profile.handedness] : "Not set"}
                </p>
              )}
            </div>
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
    </div>
  );
}