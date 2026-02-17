/**
 * Tab Mastery + patch eligibility.
 * Global Prestige (ranks.ts) remains based on allTime points.
 * Per-tab: patchEligible at 80% completion, masteryLevel from tab points.
 */

import { ACHIEVEMENTS_CATALOG, getCatalogPoints } from "@/data/achievements";
import { isAchievementDisabled } from "./disabledAchievements";

export const PATCH_THRESHOLD = 0.8;

// Compute max catalog points per tab (excluding disabled)
export function getTabMaxCatalogPoints(): { skill: number; social: number; collection: number } {
  const sum = (arr: { id: string }[]) =>
    arr
      .filter((a) => !isAchievementDisabled(a.id))
      .reduce((s, a) => s + getCatalogPoints(a.id), 0);
  return {
    skill: sum(ACHIEVEMENTS_CATALOG.skill),
    social: sum(ACHIEVEMENTS_CATALOG.social),
    collection: sum(ACHIEVEMENTS_CATALOG.collection),
  };
}

const TAB_MAX = getTabMaxCatalogPoints();

// Step ≈ 0.8 * tab max, rounded to nearest 500 (Level 1 reachable for active users)
export const TAB_STEP_POINTS = {
  skill: Math.round((TAB_MAX.skill * 0.8) / 500) * 500,
  social: Math.round((TAB_MAX.social * 0.8) / 500) * 500,
  collection: Math.round((TAB_MAX.collection * 0.8) / 500) * 500,
} as const;

export type TabKey = "skill" | "social" | "collection";

export type TabMasteryResult = {
  masteryLevel: number;
  pointsIntoLevel: number;
  pointsToNextLevel: number;
  levelProgress0to1: number;
  patchEligible: boolean;
};

export function getTabMastery(params: {
  tabAllTimePoints: number;
  completionPercent: number;
  tab: TabKey;
}): TabMasteryResult {
  const { tabAllTimePoints, completionPercent, tab } = params;
  const step = TAB_STEP_POINTS[tab];
  const pts = Math.max(0, Math.floor(tabAllTimePoints));

  const masteryLevel = Math.floor(pts / step);
  const pointsIntoLevel = pts % step;
  // When pointsIntoLevel === 0: fresh bar (0%) and full step remaining
  const pointsToNextLevel = pointsIntoLevel === 0 ? step : step - pointsIntoLevel;
  const levelProgress0to1 = pointsIntoLevel === 0 ? 0 : (step > 0 ? pointsIntoLevel / step : 1);

  const patchEligible = completionPercent >= PATCH_THRESHOLD * 100;

  return {
    masteryLevel,
    pointsIntoLevel,
    pointsToNextLevel,
    levelProgress0to1,
    patchEligible,
  };
}
