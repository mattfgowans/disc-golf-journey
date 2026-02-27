"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";

export function ClubEmptyState({
  onJoin,
  onCreate,
}: {
  onJoin: (code: string) => Promise<void>;
  onCreate: (name: string) => Promise<void>;
}) {
  const [joinCode, setJoinCode] = useState("");
  const [clubName, setClubName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");
    setIsJoining(true);
    try {
      await onJoin(joinCode);
      setJoinCode("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    setIsCreating(true);
    try {
      await onCreate(clubName);
      setClubName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="text-center py-8">
      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">You&apos;re not in a club yet</h3>
      <p className="text-muted-foreground mb-6">
        Join with a code or create your own to compete on a private leaderboard.
      </p>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-4 text-left">
          {error}
        </div>
      )}

      <div className="space-y-4 max-w-sm mx-auto text-left">
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
            />
            <Button onClick={handleJoin} disabled={isJoining || !joinCode.trim()}>
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
            />
            <Button onClick={handleCreate} disabled={isCreating || !clubName.trim()}>
              {isCreating ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
