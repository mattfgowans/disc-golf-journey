"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Library } from "lucide-react";

type AchievementCategory = "skill" | "social" | "collection";

interface AchievementCardProps {
  title: string;
  description: string;
  category: AchievementCategory;
  isCompleted: boolean;
  completedDate?: string;
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
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Button
            variant={isCompleted ? "outline" : "default"}
            onClick={onToggle}
            className={isCompleted ? "text-green-600" : ""}
            disabled={isCompleted}
          >
            {isCompleted ? "Completed ✓" : "Mark as Complete"}
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
