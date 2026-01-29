"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/firebase-auth";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { useUserProfile } from "@/lib/useUserProfile";

function UsernameOnboardingInner() {
  const { user } = useAuth();
  const router = useRouter();
  const { refresh } = useUserProfile(user?.uid);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }

    if (value.length > 20) {
      return "Username must be at most 20 characters";
    }

    if (!/^[a-z0-9._]+$/.test(value)) {
      return "Username can only contain letters, numbers, dots, and underscores";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be signed in");
      return;
    }

    // Normalize username: trim, lowercase, remove leading '@'
    const normalizedUsername = username.trim().toLowerCase().replace(/^@/, "");
    const validationError = validateUsername(normalizedUsername); // Validate normalized value

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const usernameRef = doc(db, "usernames", normalizedUsername);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (tx) => {
        // Read both documents to ensure consistency
        const [usernameSnap, userSnap] = await Promise.all([
          tx.get(usernameRef),
          tx.get(userRef)
        ]);

        // Check if user already has a username set (prevent double-setting)
        const userData = userSnap.exists() ? userSnap.data() : null;
        const existingUsername = (userData as any)?.username as string | undefined;
        if (existingUsername && existingUsername !== normalizedUsername) {
          throw new Error("USERNAME_ALREADY_SET");
        }

        // Harden username registry logic
        if (usernameSnap.exists()) {
          const data = usernameSnap.data() as { uid?: string };
          if (!data.uid) {
            throw new Error("USERNAME_TAKEN"); // defensive: malformed doc
          }
          if (data.uid !== user.uid) {
            throw new Error("USERNAME_TAKEN"); // taken by someone else
          }
          // If data.uid === user.uid, allow (idempotent)
        } else {
          // Only create username document when it doesn't exist
          tx.set(usernameRef, {
            uid: user.uid,
            createdAt: serverTimestamp()
          });
        }

        // Always update user document with username and timestamp
        tx.set(
          userRef,
          {
            username: normalizedUsername,
            usernameSetAt: serverTimestamp()
          },
          { merge: true }
        );
      });

      // Refresh profile data so RequireAuth sees the update immediately
      refresh?.();

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Error setting username:", err);
      if (err.message === "USERNAME_TAKEN") {
        setError("This username is already taken");
      } else if (err.message === "USERNAME_ALREADY_SET") {
        setError("You already have a username set");
      } else {
        setError("Failed to set username. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">You must be signed in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose Your Username</CardTitle>
          <CardDescription>
            Pick a unique username that will represent you in the leaderboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                disabled={loading}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                3-20 characters, letters, numbers, dots, and underscores only.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsernameOnboardingPage() {
  return (
    <RequireAuth>
      <UsernameOnboardingInner />
    </RequireAuth>
  );
}