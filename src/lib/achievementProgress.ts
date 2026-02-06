/**
 * Helpers for achievement reset policy (yearly/never) and locked state.
 * Default: resetPolicy "yearly", no requiresId = unlocked.
 */

import { Timestamp } from "firebase/firestore";

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export type ResetPolicy = "never" | "yearly";

export function getResetPolicy(def: { resetPolicy?: ResetPolicy }): ResetPolicy {
  return def.resetPolicy ?? "yearly";
}

type StoredProgress = { isCompleted?: boolean; completedDate?: Timestamp; progress?: number; year?: number } | null;

type EffectiveProgress = {
  isCompleted: boolean;
  completedDate?: Timestamp;
  progress: number;
};

/**
 * Returns effective progress for display/points.
 * Yearly resets only when stored.year exists and differs from currentYear (legacy docs without year are treated as current year).
 */
export function getEffectiveProgress(
  def: { resetPolicy?: ResetPolicy; kind?: string; target?: number },
  stored: StoredProgress | undefined,
  currentYear: number
): EffectiveProgress {
  const policy = getResetPolicy(def);
  const storedYear = stored?.year;
  const storedCompleted = stored?.isCompleted ?? false;
  const storedProgress = typeof stored?.progress === "number" ? stored.progress : 0;

  if (policy === "yearly" && storedYear != null && storedYear !== currentYear) {
    return { isCompleted: false, completedDate: undefined, progress: 0 };
  }

  const isCounter = def.kind === "counter";
  const target = typeof def.target === "number" ? def.target : undefined;
  const progress = storedProgress;
  const completed = isCounter && target !== undefined ? progress >= target : storedCompleted;

  return { isCompleted: completed, completedDate: stored?.completedDate, progress };
}

/** Effective achievement has isCompleted and optionally kind/target/progress. */
type EffectiveAchievement = {
  id: string;
  isCompleted: boolean;
  kind?: string;
  progress?: number;
  target?: number;
};

/**
 * True if achievement has no requiresId or the required parent is completed.
 */
export function isUnlocked(
  def: { requiresId?: string },
  effectiveById: Record<string, EffectiveAchievement>
): boolean {
  const requiredId = def.requiresId;
  if (!requiredId) return true;
  const parent = effectiveById[requiredId];
  if (!parent) return false;
  if (parent.isCompleted) return true;
  if (parent.kind === "counter" && typeof parent.progress === "number" && typeof parent.target === "number") {
    return parent.progress >= parent.target;
  }
  return false;
}
