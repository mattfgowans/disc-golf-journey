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

type StoredProgress = {
  isCompleted?: boolean;
  completedDate?: Timestamp;
  progress?: number;
  /** Legacy/previous field used to anchor yearly completion. */
  year?: number;
  /** New field to anchor yearly completion without migrations. */
  completedYear?: number;
} | null;

type EffectiveProgress = {
  isCompleted: boolean;
  completedDate?: Timestamp;
  progress: number;
};

function coerceYear(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : undefined;
}

function getCompletionYearFromStored(stored: StoredProgress | undefined): number | undefined {
  const completedYear = coerceYear(stored?.completedYear);
  if (completedYear != null) return completedYear;

  // Backward compatibility: older docs used `year` as the yearly anchor.
  const legacyYear = coerceYear(stored?.year);
  if (legacyYear != null) return legacyYear;

  const ts = stored?.completedDate;
  if (ts) return ts.toDate().getFullYear();

  return undefined;
}

/**
 * Single source of truth for completion, with year-aware semantics.
 *
 * - resetPolicy "never": completed if user marked completed.
 * - resetPolicy "yearly": completed if marked completed AND completionYear === currentYear.
 *
 * Backward compatibility:
 * - If completionYear is missing but marked completed, treat as completed for the *current* year.
 *   (Callers may choose to persist completedYear on the next write.)
 */
export function isAchievementCompleted(
  def: { resetPolicy?: ResetPolicy; kind?: string; target?: number },
  stored: StoredProgress | undefined,
  currentYear: number
): boolean {
  const policy = getResetPolicy(def);
  const storedCompleted = stored?.isCompleted ?? false;
  const storedProgress = typeof stored?.progress === "number" ? stored.progress : 0;

  const isCounter = def.kind === "counter";
  const target = typeof def.target === "number" ? def.target : undefined;
  const baseCompleted = isCounter && target !== undefined ? storedProgress >= target : storedCompleted;

  if (!baseCompleted) return false;
  if (policy === "never") return true;

  const completionYear = getCompletionYearFromStored(stored) ?? currentYear;
  return completionYear === currentYear;
}

/**
 * Returns effective progress for display/points.
 * Yearly completion is year-aware without destructive resets.
 */
export function getEffectiveProgress(
  def: { resetPolicy?: ResetPolicy; kind?: string; target?: number },
  stored: StoredProgress | undefined,
  currentYear: number
): EffectiveProgress {
  const storedProgress = typeof stored?.progress === "number" ? stored.progress : 0;
  const progress = storedProgress;
  const completed = isAchievementCompleted(def, stored, currentYear);

  return {
    isCompleted: completed,
    completedDate: completed ? stored?.completedDate : undefined,
    progress,
  };
}

/**
 * Hidden-until gating (no secret UX):
 * - If def.gateRequiresId is missing => visible
 * - If present => visible only when the gate achievement is completed (simple "ever completed" semantics).
 */
export function isGatedVisible(
  def: { gateRequiresId?: string },
  byId: Record<string, { isCompleted: boolean; kind?: string; progress?: number; target?: number } | undefined>
): boolean {
  const gateId = def.gateRequiresId;
  if (!gateId) return true;
  const gate = byId[gateId];
  if (!gate) return false;
  if (gate.kind === "counter" && typeof gate.progress === "number" && typeof gate.target === "number") {
    return gate.progress >= gate.target;
  }
  return gate.isCompleted === true;
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
