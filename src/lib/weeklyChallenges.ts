// ---------------------------------------------------------------------------
// Weekly Challenge System — generation, persistence, weekly rotation
// ---------------------------------------------------------------------------
// Architecture overview:
//   ChallengeTemplate  (src/data/challengeTemplates.ts)
//     ↓ generator picks 1 easy + 1 medium + 1 fun per week
//   WeeklyChallengeInstance  (stored in localStorage per week)
//     ↓ merged with template at render time → ResolvedChallenge
//   HistoryEntry  (archived on weekly reset, stored in localStorage)
//
// Future expansion hooks (do not implement yet):
//   - daily challenges: add cadence field + separate daily storage key
//   - streaks: derive from HistoryEntry.completedCount across consecutive weeks
//   - seasonal events: filter templates by season tag
//   - XP rewards: hook into global XP system on completion
//   - club/community: add scope field; fetch from API instead of template pool
// ---------------------------------------------------------------------------

import {
  CHALLENGE_TEMPLATES,
  ChallengeTemplate,
  Difficulty,
  getTemplatesByDifficulty,
} from "@/data/challengeTemplates";

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Persisted per-user progress for a single challenge in a given week */
export type WeeklyChallengeInstance = {
  templateId: string;
  weekId: string;
  progress: number;
  completed: boolean;
  /** ISO timestamp set when challenge is first completed */
  completedAt?: string;
};

/** Full weekly state stored in localStorage */
export type WeeklyState = {
  weekId: string;
  instances: WeeklyChallengeInstance[];
};

/** Archived entry for a completed week (challenge history) */
export type HistoryEntry = {
  weekId: string;
  instances: WeeklyChallengeInstance[];
  completedCount: number;
  totalXp: number;
  /** ISO timestamp of when the week was archived */
  archivedAt: string;
};

/** Template data merged with live instance data for rendering */
export type ResolvedChallenge = ChallengeTemplate & WeeklyChallengeInstance;

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const KEY_CURRENT = "dg-weekly-current";
const KEY_HISTORY = "dg-weekly-history";
const MAX_HISTORY_WEEKS = 12;

// ---------------------------------------------------------------------------
// Week ID helpers
// ---------------------------------------------------------------------------

/**
 * Returns the ISO date of the Monday of the week containing `date`.
 * Format: "YYYY-MM-DD"  (e.g. "2026-05-11")
 * Used as the stable weekly identifier for generation + storage.
 */
export function getWeekId(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offsetToMonday);
  d.setHours(0, 0, 0, 0);
  // YYYY-MM-DD in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns a human-readable week range string.
 * e.g. "May 11 – May 17"
 */
export function getWeekRange(weekId?: string): string {
  const monday = weekId
    ? new Date(`${weekId}T00:00:00`)
    : (() => {
        const d = new Date();
        const offset = d.getDay() === 0 ? -6 : 1 - d.getDay();
        d.setDate(d.getDate() + offset);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/**
 * Returns a human-readable countdown string until the next weekly reset (next Monday).
 * e.g. "6d 4h" or "2h"
 */
export function getCountdown(): string {
  const now = new Date();
  const nextMonday = new Date(now);
  const day = now.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (reproducible per weekId + seed)
// ---------------------------------------------------------------------------

/**
 * Simple djb2-style hash — deterministic, no external deps.
 * Given the same string it always returns the same non-negative integer.
 */
function deterministicHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Challenge generation
// ---------------------------------------------------------------------------

/**
 * Generates exactly 3 challenge instances for `weekId`:
 *   1 easy, 1 medium, 1 fun
 *
 * Rules applied in order:
 *   1. Exclude templates used in the most recent 2 weeks
 *   2. Prefer templates whose category hasn't been used in the current set
 *   3. Fall back to any template of that difficulty if exclusions exhaust the pool
 *   4. Selection is deterministic — same weekId always produces the same set
 */
export function generateWeekChallenges(
  weekId: string,
  history: HistoryEntry[]
): WeeklyChallengeInstance[] {
  // Collect template IDs used in the last 2 archived weeks
  const recentIds = new Set(
    history
      .slice(-2)
      .flatMap((h) => h.instances.map((i) => i.templateId))
  );

  const usedCategories = new Set<string>();
  const instances: WeeklyChallengeInstance[] = [];

  for (const difficulty of ["easy", "medium", "fun"] as Difficulty[]) {
    const allOfDifficulty = getTemplatesByDifficulty(difficulty);

    // Step 1: exclude recently used templates
    const fresh = allOfDifficulty.filter((t) => !recentIds.has(t.id));
    const candidatePool = fresh.length > 0 ? fresh : allOfDifficulty; // fallback

    // Step 2: prefer new category
    const newCategory = candidatePool.filter((t) => !usedCategories.has(t.category));
    const finalPool = newCategory.length > 0 ? newCategory : candidatePool;

    // Step 3: deterministic pick
    const idx = deterministicHash(weekId + difficulty) % finalPool.length;
    const template = finalPool[idx];

    usedCategories.add(template.category);
    instances.push({
      templateId: template.id,
      weekId,
      progress: 0,
      completed: false,
    });
  }

  return instances;
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

function isServer(): boolean {
  return typeof window === "undefined";
}

export function loadHistory(): HistoryEntry[] {
  if (isServer()) return [];
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryEntry[]): void {
  try {
    // Keep only the most recent N weeks to cap storage size
    localStorage.setItem(
      KEY_HISTORY,
      JSON.stringify(history.slice(-MAX_HISTORY_WEEKS))
    );
  } catch {
    // Storage quota exceeded — silently skip; history is non-critical
  }
}

function loadStoredWeek(): WeeklyState | null {
  if (isServer()) return null;
  try {
    const raw = localStorage.getItem(KEY_CURRENT);
    return raw ? (JSON.parse(raw) as WeeklyState) : null;
  } catch {
    return null;
  }
}

export function saveCurrentWeek(state: WeeklyState): void {
  try {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(state));
  } catch {}
}

// ---------------------------------------------------------------------------
// Weekly lifecycle — load or init, auto-rotate on new week
// ---------------------------------------------------------------------------

/**
 * Main entry point called on page load.
 *
 * - If a valid current-week state exists: return it as-is (progress preserved)
 * - If the stored week is outdated: archive it, generate new challenges
 * - If nothing is stored: generate a fresh set for the current week
 */
export function getOrInitWeek(): WeeklyState {
  const weekId = getWeekId();
  const stored = loadStoredWeek();

  // Already have fresh data for this week — and all template IDs still exist
  if (stored?.weekId === weekId) {
    const allValid = stored.instances.every((inst) =>
      CHALLENGE_TEMPLATES.some((t) => t.id === inst.templateId)
    );
    if (allValid) return stored;
    // Template pool changed (e.g. an app update replaced IDs) — discard stale data
    // and fall through to regenerate for the same week
  }

  const history = loadHistory();

  // Archive the previous week before generating new one
  if (stored && stored.weekId !== weekId) {
    const totalXp = stored.instances.reduce((sum, inst) => {
      if (!inst.completed) return sum;
      const t = CHALLENGE_TEMPLATES.find((t) => t.id === inst.templateId);
      return sum + (t?.xpReward ?? 0);
    }, 0);

    const archived: HistoryEntry = {
      weekId: stored.weekId,
      instances: stored.instances,
      completedCount: stored.instances.filter((i) => i.completed).length,
      totalXp,
      archivedAt: new Date().toISOString(),
    };

    saveHistory([...history, archived]);
  }

  // Re-read history (may have just been updated)
  const freshHistory = loadHistory();
  const newInstances = generateWeekChallenges(weekId, freshHistory);
  const newState: WeeklyState = { weekId, instances: newInstances };
  saveCurrentWeek(newState);
  return newState;
}

// ---------------------------------------------------------------------------
// Progress mutations
// ---------------------------------------------------------------------------

/**
 * Mark a boolean challenge as complete, or force-complete a count challenge.
 */
export function completeChallengeInState(
  state: WeeklyState,
  templateId: string
): WeeklyState {
  const updated = state.instances.map((inst) => {
    if (inst.templateId !== templateId || inst.completed) return inst;
    return {
      ...inst,
      progress: inst.progress, // keep as-is; UI already filled
      completed: true,
      completedAt: new Date().toISOString(),
    };
  });
  const next: WeeklyState = { ...state, instances: updated };
  saveCurrentWeek(next);
  return next;
}

/**
 * Increment progress on a count-based challenge by 1.
 * Auto-completes when progress reaches the template's target.
 */
export function incrementChallengeProgress(
  state: WeeklyState,
  templateId: string
): WeeklyState {
  const template = CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
  if (!template || template.challengeType !== "count") return state;

  const updated = state.instances.map((inst) => {
    if (inst.templateId !== templateId || inst.completed) return inst;
    const newProgress = Math.min(inst.progress + 1, template.target ?? 1);
    const nowComplete = newProgress >= (template.target ?? 1);
    return {
      ...inst,
      progress: newProgress,
      completed: nowComplete,
      ...(nowComplete && !inst.completedAt
        ? { completedAt: new Date().toISOString() }
        : {}),
    };
  });

  const next: WeeklyState = { ...state, instances: updated };
  saveCurrentWeek(next);
  return next;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/** Merge a persisted instance with its template for use in UI */
export function resolveChallenge(
  instance: WeeklyChallengeInstance
): ResolvedChallenge | null {
  const template = CHALLENGE_TEMPLATES.find((t) => t.id === instance.templateId);
  if (!template) return null;
  return { ...template, ...instance };
}

/** Resolve all instances for a WeeklyState, filtering out any orphaned IDs */
export function resolveAllChallenges(state: WeeklyState): ResolvedChallenge[] {
  return state.instances
    .map(resolveChallenge)
    .filter((c): c is ResolvedChallenge => c !== null);
}

/** Total XP earned from completed challenges in a state */
export function calcXpEarned(state: WeeklyState): number {
  return state.instances.reduce((sum, inst) => {
    if (!inst.completed) return sum;
    const t = CHALLENGE_TEMPLATES.find((t) => t.id === inst.templateId);
    return sum + (t?.xpReward ?? 0);
  }, 0);
}
