"use client";

import { useMemo } from "react";
import { useAchievements } from "@/lib/useAchievements";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievements";
import { isAchievementDisabled } from "@/lib/disabledAchievements";
import type { Achievement, Achievements } from "@/lib/useAchievements";

export type TabCompletion = Record<"skill" | "social" | "collection", number>;

export function isEligible(pct: number): boolean {
  return pct >= 80;
}

function getAchievementCompletionFraction(a: Achievement): number {
  if (a.kind === "counter") {
    return Math.min(Math.max(a.progress / a.target, 0), 1);
  }
  return a.isCompleted ? 1 : 0;
}

function getCompletionPercentage(
  achievements: Achievement[],
  getFraction: (a: Achievement) => number
): number {
  if (achievements.length === 0) return 0;
  const totalFraction = achievements.reduce((sum, a) => sum + getFraction(a), 0);
  return (totalFraction / achievements.length) * 100;
}

export function usePatchEligibility(): {
  completion: TabCompletion;
  eligibleBySlug: Record<"skill" | "social" | "collection", boolean>;
  pctToUnlockBySlug: Record<"skill" | "social" | "collection", number>;
} {
  const { achievements } = useAchievements(ACHIEVEMENTS_CATALOG);
  const currentAchievements: Achievements = achievements ?? ACHIEVEMENTS_CATALOG;

  return useMemo(() => {
    const achievementsForUI = {
      skill: currentAchievements.skill.filter((a) => !isAchievementDisabled(a.id)),
      social: currentAchievements.social.filter((a) => !isAchievementDisabled(a.id)),
      collection: currentAchievements.collection.filter((a) => !isAchievementDisabled(a.id)),
    };

    const skillPct = getCompletionPercentage(achievementsForUI.skill, getAchievementCompletionFraction);
    const socialPct = getCompletionPercentage(achievementsForUI.social, getAchievementCompletionFraction);
    const collectionPct = getCompletionPercentage(achievementsForUI.collection, getAchievementCompletionFraction);

    const completion: TabCompletion = {
      skill: skillPct,
      social: socialPct,
      collection: collectionPct,
    };

    const eligibleBySlug = {
      skill: isEligible(skillPct),
      social: isEligible(socialPct),
      collection: isEligible(collectionPct),
    };

    const pctToUnlockBySlug = {
      skill: Math.round(Math.max(0, 80 - skillPct)),
      social: Math.round(Math.max(0, 80 - socialPct)),
      collection: Math.round(Math.max(0, 80 - collectionPct)),
    };

    return { completion, eligibleBySlug, pctToUnlockBySlug };
  }, [achievements]);
}
