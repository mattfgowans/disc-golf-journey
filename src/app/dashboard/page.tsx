"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "@/components/achievements/achievement-card";

type Achievement = {
  id: string;
  title: string;
  description: string;
  category: "skill" | "social" | "collection";
  isCompleted: boolean;
  completedDate?: string;
};

type Achievements = {
  skill: Achievement[];
  social: Achievement[];
  collection: Achievement[];
};

// Sample achievements data (we'll replace this with real data later)
const sampleAchievements: Achievements = {
  skill: [
    {
      id: "1",
      title: "First Par",
      description: "Score par on any hole",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "2",
      title: "Distance Driver",
      description: "Throw a disc over 300 feet",
      category: "skill",
      isCompleted: false,
    },
  ],
  social: [
    {
      id: "3",
      title: "Team Player",
      description: "Play a round with 3 or more players",
      category: "social",
      isCompleted: false,
    },
    {
      id: "4",
      title: "Tournament Rookie",
      description: "Participate in your first tournament",
      category: "social",
      isCompleted: false,
    },
  ],
  collection: [
    {
      id: "5",
      title: "Disc Collector",
      description: "Own 10 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "6",
      title: "Course Explorer",
      description: "Play 5 different courses",
      category: "collection",
      isCompleted: false,
    },
  ],
};

export default function DashboardPage() {
  const [achievements, setAchievements] = useState<Achievements>(sampleAchievements);

  const toggleAchievement = (category: keyof Achievements, id: string) => {
    setAchievements((prev) => ({
      ...prev,
      [category]: prev[category].map((achievement) =>
        achievement.id === id
          ? {
              ...achievement,
              isCompleted: !achievement.isCompleted,
              completedDate: !achievement.isCompleted
                ? new Date().toLocaleDateString()
                : undefined,
            }
          : achievement
      ),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Achievements</h1>
      
      <Tabs defaultValue="skill" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skill">Skill</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>

        {(Object.entries(achievements) as [keyof Achievements, Achievement[]][]).map(([category, categoryAchievements]) => (
          <TabsContent key={category} value={category}>
            <div className="grid gap-4">
              {categoryAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  {...achievement}
                  onToggle={() => toggleAchievement(category, achievement.id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
        