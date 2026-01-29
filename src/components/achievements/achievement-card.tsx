"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Users, Library } from "lucide-react";
import confetti from 'canvas-confetti';
import { Timestamp } from "firebase/firestore";

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
  target?: number;
  progress?: number;
  onToggle: () => void;
  onIncrementAchievement: (category: AchievementCategory, id: string, amount: number) => void;
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
  kind,
  target,
  progress,
  onToggle,
  onIncrementAchievement,
}: AchievementCardProps) {
  const Icon = categoryIcons[category];
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleToggle = () => {
    if (isCompleted) {
      // Show confirmation dialog when marking as incomplete
      setShowConfirmDialog(true);
    } else {
      // Direct toggle when marking as complete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      onToggle();
    }
  };

  const handleConfirm = () => {
    onToggle();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card className={`${isCompleted ? 'bg-green-50' : ''} transition-colors rounded-xl overflow-hidden leading-tight py-1`}>
        <CardHeader className="flex flex-row items-center gap-1.5 px-3 pt-2 pb-1">
          <div className={`p-0.5 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-[13px] font-semibold leading-tight">{title}</CardTitle>
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
            {kind === "counter" && progress !== undefined && target !== undefined ? (
              <div className="flex items-center justify-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onIncrementAchievement(category, id, -1)}
                  disabled={progress <= 0}
                  className="px-2 h-7"
                >
                  -
                </Button>
                <span className="text-xs font-medium">
                  {progress} / {target}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onIncrementAchievement(category, id, 1)}
                  disabled={progress >= target}
                  className="px-2 h-7"
                >
                  +
                </Button>
              </div>
            ) : (
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
