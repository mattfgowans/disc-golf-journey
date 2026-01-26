"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserDoc } from "@/lib/useUserDoc";
import { RequireAuth } from "@/components/auth/require-auth";
import { Loader2, Edit2, Save, X } from "lucide-react";
import Link from "next/link";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-auth";

export default function ProfilePage() {
  const { user } = useAuth();
  const { userData: profile, loading: profileLoading } = useUserDoc();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const updateProfile = async (updates: Record<string, any>) => {
    if (!user) throw new Error("Not authenticated");

    const userRef = doc(db, "users", user.uid);

    // If username is being updated, check availability
    if (updates.username && updates.username !== profile?.username) {
      const normalizedUsername = updates.username.trim().toLowerCase().replace(/^@/, "");
      const usernameRef = doc(db, "usernames", normalizedUsername);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists() && usernameSnap.data().uid !== user.uid) {
        throw new Error("Username already taken");
      }

      // Reserve the username
      await setDoc(usernameRef, { uid: user.uid }, { merge: true });

      // Update with normalized username
      updates.username = normalizedUsername;
      updates.profile = { ...updates.profile, username: normalizedUsername };
    }

    await setDoc(userRef, updates, { merge: true });
  };

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        ...profile,
        username: profile.username ?? "", // Ensure username is always a string
      });
    }
  }, [profile]);

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
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          updateProfile={updateProfile}
        />
      )}
    </RequireAuth>
  );
}

function ProfileContent({
  profile,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  updateProfile,
}: {
  profile: Record<string, any>;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editForm: Record<string, any>;
  setEditForm: (form: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
}) {
  const handleSave = async () => {
    try {
      await updateProfile({
        displayName: editForm.displayName ?? profile.displayName,
        bio: editForm.bio ?? "",
        homeCourse: editForm.homeCourse ?? "",
        handedness: editForm.handedness ?? "RHBH",
        username: editForm.username ?? "",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      if (error.message === "Username already taken") {
        alert("That username is already taken. Please choose a different username.");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
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
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
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
                  value={editForm.handedness || "RHBH"}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditForm(prev => ({ ...prev, handedness: e.target.value as string }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="RHBH">Right Hand Backhand</option>
                  <option value="RHFH">Right Hand Forehand</option>
                  <option value="LHBH">Left Hand Backhand</option>
                  <option value="LHFH">Left Hand Forehand</option>
                </select>
              ) : (
                <p className="mt-1 text-sm">
                  {profile.handedness === "RHBH" ? "Right Hand Backhand" :
                   profile.handedness === "RHFH" ? "Right Hand Forehand" :
                   profile.handedness === "LHBH" ? "Left Hand Backhand" :
                   "Left Hand Forehand"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}