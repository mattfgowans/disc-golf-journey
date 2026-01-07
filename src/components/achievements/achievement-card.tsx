"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Library } from "lucide-react";
import confetti from 'canvas-confetti';

type AchievementCategory = "skill" | "social" | "collection";

interface AchievementCardProps {
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


  return (
    <Card className={`${isCompleted ? 'bg-green-50' : ''} transition-colors`}>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Icon className={`w-6 h-6 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="text-xs text-gray-500 mt-1">ID: {id}</div>
          <CardDescription>{description}</CardDescription>
          <div className="mt-1 flex gap-1">
            {points && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                🏆 {points} pts
              </span>
            )}
            {rarity && rarity !== "common" && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                rarity === "rare" ? "bg-blue-100 text-blue-800" :
                rarity === "epic" ? "bg-purple-100 text-purple-800" :
                "bg-red-100 text-red-800"
              }`}>
                {rarity === "rare" ? "💎" : rarity === "epic" ? "👑" : "🌟"} {rarity}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Button
            variant={isCompleted ? "outline" : "default"}
            onClick={() => {
              // Trigger confetti if completing an achievement
              if (!isCompleted) {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              }
              onToggle();
            }}
            className={isCompleted ? "text-green-600 border-green-600 hover:bg-green-50" : ""}
          >
            {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
          </Button>
          {completedDate && (
            <span className="text-sm text-muted-foreground">
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
  );
}
