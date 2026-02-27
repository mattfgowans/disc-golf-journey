"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Library, Minus, Plus } from "lucide-react";
import confetti from 'canvas-confetti';
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

type AchievementCategory = "skill" | "social" | "collection";

interface AchievementCardProps {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  isCompleted: boolean;
  completedDate?: Timestamp;
  points?: number;
  rarity?: "common" | "rare" | "epic" | "legendary";
  kind?: "toggle" | "counter";
  progress?: number;
  target?: number;
  locked?: boolean;
  hasSecrets?: boolean;
  lockedChildCount?: number;
  totalChildrenCount?: number;
  isNewlyRevealed?: boolean;
  revealPulse?: boolean;
  celebrateParent?: boolean;
  celebratePhase?: "idle" | "shake" | "pop";
  requiresId?: string;
  onToggle: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

const categoryIcons = {
  skill: Trophy,
  social: Users,
  collection: Library,
};

export function AchievementCard({
  id,
  title,
  description,
  category,
  isCompleted,
  completedDate,
  points,
  rarity = "common",
  kind = "toggle",
  progress = 0,
  target = 1,
  locked = false,
  hasSecrets = false,
  lockedChildCount,
  totalChildrenCount,
  isNewlyRevealed = false,
  revealPulse = false,
  celebrateParent = false,
  celebratePhase = "idle",
  requiresId,
  onToggle,
  onIncrement,
  onDecrement,
}: AchievementCardProps) {
  const Icon = categoryIcons[category];
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const animClass =
    celebratePhase === "shake"
      ? "animate-ace-shake"
      : celebratePhase === "pop"
        ? "animate-ace-pop"
        : "";
  const goldRing =
    celebratePhase !== "idle"
      ? "ring-2 ring-amber-300/70 shadow-[0_0_0_10px_rgba(251,191,36,0.12)]"
      : "";

  const isCounter = kind === "counter";
  const counterCompleted = isCounter && progress >= target;

  const handleToggle = () => {
    if (locked) return;
    if (isCompleted) {
      // Show confirmation dialog when marking as incomplete
      setShowConfirmDialog(true);
    } else {
      // Direct toggle when marking as complete (secret parents: confetti is fired by dashboard after bobble)
      // skill-35 and social-0: confetti fires on ace-pop event at pop moment
      if (!hasSecrets && id !== "skill-35" && id !== "social-0") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      onToggle();
    }
  };

  const handleConfirm = () => {
    if (locked) return;
    onToggle();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card
        className={cn(
          (isCompleted || counterCompleted) ? "bg-green-50" : "",
          locked ? "opacity-75" : "",
          isNewlyRevealed
            ? "ring-2 ring-yellow-400/40 shadow-[0_0_0_6px_rgba(250,204,21,0.12)] animate-pulse"
            : "",
          celebrateParent
            ? "relative ring-2 ring-amber-400/50 shadow-[0_0_0_10px_rgba(250,204,21,0.12)] animate-[dgShake_2.1s_ease-in-out_1]"
            : "",
          animClass,
          goldRing,
          "transform-gpu will-change-transform transition-colors rounded-xl overflow-hidden leading-tight py-1"
        )}
      >
        <CardHeader className="flex flex-row items-center gap-1.5 px-3 pt-2 pb-1">
          <div className={`p-0.5 rounded-full ${locked ? 'bg-gray-200' : (isCompleted || counterCompleted) ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${(isCompleted || counterCompleted) ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex items-center gap-1">
                <CardTitle className="text-[13px] font-semibold leading-tight">{title}</CardTitle>
                {hasSecrets && (
                  <span
                    className={cn(
                      "text-[12px] ml-0.5 inline-block origin-center",
                      revealPulse ? "opacity-100 scale-110 animate-[bounce_0.8s_ease-in-out_2]" : "opacity-70"
                    )}
                    title="Unlocks more achievements"
                  >
                    ✨
                  </span>
                )}
              </div>
              {points && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 font-medium text-[11px] px-2 py-[1px] shrink-0 whitespace-nowrap">
                  🏆 {points} pts
                </span>
              )}
            </div>
            <CardDescription className="text-[11px] leading-snug line-clamp-1 opacity-90">{description}</CardDescription>
            {/* Rarity badges temporarily disabled - uncomment to re-enable */}
            {/* {rarity && rarity !== "common" && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                rarity === "rare" ? "bg-blue-100 text-blue-800" :
                rarity === "epic" ? "bg-purple-100 text-purple-800" :
                "bg-red-100 text-red-800"
              }`}>
                {rarity === "rare" ? "💎" : rarity === "epic" ? "👑" : "🌟"} {rarity}
              </span>
            )} */}
          </div>
        </CardHeader>
        <CardContent className="pt-1 pb-2">
          <div className="flex flex-col gap-1">
            {!locked && isCounter && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {progress} / {target}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={onDecrement}
                      disabled={progress <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={onIncrement}
                      disabled={progress >= target}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Progress value={target > 0 ? (progress / target) * 100 : 0} className="h-2" />
                {counterCompleted && completedDate && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap leading-none">
                    Completed {completedDate.toDate().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            )}
            {!locked && !isCounter && (
              <div className="flex items-center gap-2">
                <Button
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
                  onClick={handleToggle}
                  className={isCompleted ? "text-green-600 border-green-600 hover:bg-green-50 flex-1 text-xs h-7 py-0" : "flex-1 text-xs h-7 py-0"}
                >
                  {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                </Button>
                {completedDate && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap leading-none">
                    Completed {completedDate.toDate().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            )}
            {hasSecrets && lockedChildCount != null && lockedChildCount > 0 && (
              <p className="text-[11px] text-muted-foreground pt-1">
                {totalChildrenCount != null && lockedChildCount === totalChildrenCount
                  ? "Achievements hidden here"
                  : `${lockedChildCount} achievement${lockedChildCount === 1 ? "" : "s"} remaining`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Achievement as Incomplete?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark "{title}" as incomplete? This will remove the completion date and you'll lose the record of when you completed this achievement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              size="sm"
            >
              Mark as Incomplete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
