"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { cn } from "@/lib/utils";
import type { Achievement, Achievements } from "@/lib/useAchievements";

type SectionKey = string;

interface AchievementSectionProps {
  category: keyof Achievements;
  subcategory: string;
  title: string;
  sectionKey: SectionKey;
  achievements: Achievement[];
  completion: number;
  isOpen: boolean;
  onToggle: () => void;
  onToggleAchievement: (id: string) => void;
  onIncrementAchievement: (category: keyof Achievements, id: string, amount: number) => void;
  getCompletionColor: (value: number) => string;
}

export function AchievementSection({
  category,
  subcategory,
  title,
  sectionKey,
  achievements,
  completion,
  isOpen,
  onToggle,
  onToggleAchievement,
  onIncrementAchievement,
  getCompletionColor,
}: AchievementSectionProps) {
  return (
    <Collapsible open={isOpen}>
      <div className="sticky top-[305px] md:top-[252px] z-0 bg-gradient-to-r from-emerald-400 to-teal-500 border-b shadow-sm">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer relative"
          style={{ outline: "none", border: "none", background: "none" }}
        >
          <div className="flex items-baseline gap-3">
            <div className="w-[260px] text-left">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            <div className="flex-1 text-left">
              <span
                className="inline-flex items-center rounded-full bg-black/25 px-2 py-0.5 text-sm font-bold text-white backdrop-blur-sm"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
              >
                {Math.round(completion)}%
              </span>
            </div>
          </div>
          <ChevronDown className={`h-6 w-6 text-white transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <CollapsibleContent>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 mt-2">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              {...achievement}
              category={category}
              onToggle={() => onToggleAchievement(achievement.id)}
              onIncrementAchievement={onIncrementAchievement}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
