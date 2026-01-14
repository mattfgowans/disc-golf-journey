"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Users, Library } from "lucide-react";
import confetti from 'canvas-confetti';

type AchievementCategory = "skill" | "social" | "collection";

interface AchievementCardProps {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  isCompleted: boolean;
  completedDate?: string;
  points?: number;
  rarity?: "common" | "rare" | "epic" | "legendary";
  onToggle: () => void;
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
  onToggle,
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
      <Card className={`${isCompleted ? 'bg-green-50' : ''} transition-colors`}>
        <CardHeader className="flex flex-row items-center gap-2 p-3 pb-1.5">
          <div className={`p-1 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
            {points && (
              <div className="mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  🏆 {points} pts
                </span>
              </div>
            )}
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
        <CardContent className="pt-1.5 pb-3">
          <div className="flex flex-col gap-1">
            <Button
              variant={isCompleted ? "outline" : "default"}
              size="sm"
              onClick={handleToggle}
              className={isCompleted ? "text-green-600 border-green-600 hover:bg-green-50 w-full text-xs" : "w-full text-xs"}
            >
              {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
            </Button>
            {completedDate && (
              <span className="text-xs text-muted-foreground text-center">
                Completed {new Date(completedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </span>
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
