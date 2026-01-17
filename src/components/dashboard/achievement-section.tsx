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
          {/* Left: title only */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>

          {/* Right: pill + chevron (never overflow) */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="px-3 py-1 rounded-full bg-black/20 text-white text-sm font-semibold whitespace-nowrap">
              {Math.round(completion)}%
            </span>
            <ChevronDown
              className={cn(
                "h-6 w-6 text-white shrink-0 transition-transform",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </div>
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
