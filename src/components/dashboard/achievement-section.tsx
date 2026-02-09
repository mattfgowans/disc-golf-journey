"use client";

import { useMemo } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { cn } from "@/lib/utils";
import { isUnlocked } from "@/lib/achievementProgress";
import type { Achievement, Achievements } from "@/lib/useAchievements";

type SectionKey = string;

interface AchievementSectionProps {
  category: keyof Achievements;
  subcategory: string;
  title: string;
  sectionKey: SectionKey;
  achievements: Achievement[];
  /** Optional global map for isUnlocked (cross-category); falls back to section-only map when omitted. */
  effectiveById?: Record<string, Achievement>;
  /** Optional flat list of all achievements (all categories) for parent→child index; used for secret hints. */
  allAchievements?: Achievement[];
  /** Optional set of achievement ids that were just revealed this session (for one-time highlight). */
  newlyRevealedIds?: Set<string>;
  /** Optional set of parent achievement ids to briefly pulse the ✨ icon (echo reveal). */
  revealPulseParentIds?: Set<string>;
  /** Optional id of parent achievement currently in celebration bobble (pre-modal). */
  celebratingParentId?: string | null;
  completion: number;
  isOpen: boolean;
  onToggle: () => void;
  onToggleAchievement: (id: string) => void;
  getCompletionColor: (value: number) => string;
}

export function AchievementSection({
  category,
  subcategory,
  title,
  sectionKey,
  achievements,
  effectiveById: effectiveByIdProp,
  allAchievements,
  newlyRevealedIds,
  revealPulseParentIds,
  celebratingParentId,
  completion,
  isOpen,
  onToggle,
  onToggleAchievement,
  getCompletionColor,
}: AchievementSectionProps) {
  const localById = useMemo(() => {
    const map: Record<string, Achievement> = {};
    for (const a of achievements) map[a.id] = a;
    return map;
  }, [achievements]);

  const effectiveById = effectiveByIdProp ?? localById;

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    const list = allAchievements ?? [];
    for (const a of list) {
      if (a.requiresId) {
        const arr = map.get(a.requiresId) ?? [];
        arr.push(a);
        map.set(a.requiresId, arr);
      }
    }
    return map;
  }, [allAchievements]);

  return (
    <Collapsible open={isOpen}>
      <div className="sticky top-24 md:top-20 z-40 bg-gradient-to-r from-emerald-400 to-teal-500 border-b shadow-sm">
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
          {achievements.map((achievement) => {
            const unlocked = isUnlocked(achievement, effectiveById);
            if (achievement.requiresId && !unlocked) return null;

            const children = childrenByParentId.get(achievement.id) ?? [];
            const totalChildrenCount = children.length;
            const lockedChildCount = children.filter((c) => !isUnlocked(c, effectiveById)).length;
            const hasSecrets = totalChildrenCount > 0;

            return (
              <AchievementCard
                key={achievement.id}
                {...achievement}
                category={category}
                locked={!unlocked}
                hasSecrets={hasSecrets}
                lockedChildCount={hasSecrets ? lockedChildCount : undefined}
                totalChildrenCount={hasSecrets ? totalChildrenCount : undefined}
                isNewlyRevealed={newlyRevealedIds?.has(achievement.id) ?? false}
                revealPulse={revealPulseParentIds?.has(achievement.id) ?? false}
                celebrateParent={celebratingParentId === achievement.id}
                onToggle={() => onToggleAchievement(achievement.id)}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
