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
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";

function UsernameOnboardingInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateUsername = (value: string): string | null => {
    const normalized = value.trim().toLowerCase().replace(/^@/, "");

    if (normalized.length < 3) {
      return "Username must be at least 3 characters";
    }

    if (normalized.length > 20) {
      return "Username must be at most 20 characters";
    }

    if (!/^[a-z0-9._]+$/.test(normalized)) {
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
        const usernameSnap = await tx.get(usernameRef);

        if (usernameSnap.exists()) {
          const data = usernameSnap.data() as { uid?: string };
          if (data?.uid && data.uid !== user.uid) {
            throw new Error("USERNAME_TAKEN");
          }
        }

        tx.set(usernameRef, { uid: user.uid }, { merge: true });

        tx.set(
          userRef,
          { username: normalizedUsername },
          { merge: true }
        );
      });

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Error setting username:", err);
      if (err.message === "USERNAME_TAKEN") {
        setError("This username is already taken");
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