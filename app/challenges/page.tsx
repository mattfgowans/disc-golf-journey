"use client";

import { useState, useEffect } from "react";
import { Target, CheckCircle2, Circle, ChevronRight, Zap, Calendar, Clock, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/page-wrapper";
import {
  type WeeklyState,
  type ResolvedChallenge,
  getOrInitWeek,
  getWeekRange,
  getCountdown,
  calcXpEarned,
  completeChallengeInState,
  incrementChallengeProgress,
  resolveAllChallenges,
} from "@/lib/weeklyChallenges";
import type { Category, Difficulty } from "@/data/challengeTemplates";

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  fun: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  fun: "Fun",
};

/** Context-aware label for the increment button */
const INCREMENT_LABELS: Record<Category, string> = {
  putting: "Add Putt",
  driving: "Add Throw",
  rounds: "Add Round",
  accuracy: "Add Hit",
  fitness: "Add Session",
  social: "Add Progress",
  fun: "Add Progress",
};

function getIncrementLabel(category: Category): string {
  return INCREMENT_LABELS[category] ?? "Add Progress";
}

// ---------------------------------------------------------------------------
// Challenge card
// ---------------------------------------------------------------------------

function ChallengeCard({
  challenge,
  onComplete,
  onIncrement,
}: {
  challenge: ResolvedChallenge;
  onComplete: (id: string) => void;
  onIncrement: (id: string) => void;
}) {
  const {
    templateId,
    title,
    description,
    difficulty,
    category,
    challengeType,
    progress,
    target,
    completed,
    xpReward,
  } = challenge;

  const progressPct = target ? Math.min((progress / target) * 100, 100) : 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "rounded-xl border p-4 shadow-sm transition-colors",
        completed
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-900/10"
          : "border-border/60 bg-card"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          {/* Completion icon */}
          <div className="mt-0.5 shrink-0">
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="min-w-0">
            <p
              className={cn(
                "font-semibold text-sm leading-tight",
                completed && "line-through text-muted-foreground"
              )}
            >
              {title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {description}
            </p>
          </div>
        </div>

        {/* Difficulty badge */}
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            DIFFICULTY_STYLES[difficulty]
          )}
        >
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      </div>

      {/* Count-based progress bar */}
      {challengeType === "count" && target && !completed && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium tabular-nums">
              {progress} / {target}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Footer: XP + action buttons */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-medium">{xpReward} XP</span>
        </div>

        {!completed && (
          <div className="flex items-center gap-2">
            {challengeType === "count" && (
              <button
                type="button"
                onClick={() => onIncrement(templateId)}
                className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/60 px-3 py-1.5 text-xs font-medium transition-all duration-100 hover:bg-muted active:scale-95"
              >
                <Plus className="h-3 w-3" />
                {getIncrementLabel(category)}
              </button>
            )}
            <button
              type="button"
              onClick={() => onComplete(templateId)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-100 active:scale-95",
                challengeType === "count"
                  ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
              )}
            >
              {challengeType === "count" ? "Mark Done" : "Mark Complete"}
              {challengeType === "boolean" && (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

        {completed && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Completed ✓
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-5 w-5 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
        <div className="h-5 w-14 rounded-full bg-muted" />
      </div>
      <div className="mt-3 h-8 w-28 rounded-lg bg-muted ml-auto" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChallengesPage() {
  const [weekState, setWeekState] = useState<WeeklyState | null>(null);
  const [challenges, setChallenges] = useState<ResolvedChallenge[]>([]);
  const [weekRange, setWeekRange] = useState("");
  const [countdown, setCountdown] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    const state = getOrInitWeek();
    setWeekState(state);
    setChallenges(resolveAllChallenges(state));
    setWeekRange(getWeekRange(state.weekId));
    setCountdown(getCountdown());
    setLoaded(true);
  }, []);

  // Refresh countdown every minute
  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown()), 60_000);
    return () => clearInterval(id);
  }, []);

  function handleComplete(templateId: string) {
    if (!weekState) return;
    const next = completeChallengeInState(weekState, templateId);
    setWeekState(next);
    setChallenges(resolveAllChallenges(next));
  }

  function handleIncrement(templateId: string) {
    if (!weekState) return;
    const next = incrementChallengeProgress(weekState, templateId);
    setWeekState(next);
    setChallenges(resolveAllChallenges(next));
  }

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalCount = challenges.length;
  const xpEarned = weekState ? calcXpEarned(weekState) : 0;
  const summaryPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <PageWrapper>
      <div className="mx-auto max-w-lg px-4 pb-32 pt-6">

        {/* ── Page header ── */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-sm">
              <Target className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Weekly Challenges</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
            {weekRange && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {weekRange}
              </span>
            )}
            {countdown && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Resets in {countdown}
              </span>
            )}
          </div>
        </div>

        {/* ── Progress summary card ── */}
        <div className="mb-5 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          {!loaded ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">Weekly Progress</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedCount === totalCount && totalCount > 0
                      ? "All challenges complete! 🎉"
                      : `${totalCount - completedCount} remaining this week`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">
                    {completedCount}
                    <span className="text-base font-normal text-muted-foreground">
                      /{totalCount}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">completed</p>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${summaryPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{xpEarned} XP</span>{" "}
                  earned this week
                  {/* TODO: hook earned XP into global XP / streak system */}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Challenge list ── */}
        <div className="flex flex-col gap-3">
          {!loaded ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : challenges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No challenges generated yet. Check back soon!
            </div>
          ) : (
            <AnimatePresence>
              {challenges.map((challenge, i) => (
                <motion.div
                  key={challenge.templateId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.06,
                    type: "spring",
                    stiffness: 280,
                    damping: 26,
                  }}
                >
                  <ChallengeCard
                    challenge={challenge}
                    onComplete={handleComplete}
                    onIncrement={handleIncrement}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* ── Future expansion placeholders ── */}
        {/* TODO: weekly reset logic — currently handled automatically by getOrInitWeek() */}
        {/* TODO: XP rewards — hook calcXpEarned() into global XP system */}
        {/* TODO: challenge generation — consider server-side or user-preference weighting */}
        {/* TODO: streaks — derive from loadHistory() across consecutive weeks */}
        {/* TODO: seasonal / community challenges — add scope field to ChallengeTemplate */}

      </div>
    </PageWrapper>
  );
}
