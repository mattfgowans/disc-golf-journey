"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Lock } from "lucide-react";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { cn } from "@/lib/utils";
import { isGatedVisible, isUnlocked } from "@/lib/achievementProgress";
import type { Achievement, Achievements } from "@/lib/useAchievements";

type SectionKey = string;

type TierHeaderInfo = {
  categoryId?: string;
  tierIndex: number;
  tierKey?: string;
  label: string;
  progressText: string; // e.g. "2/5"
};

const TIER_ACCENT: Record<
  string,
  { accentBg: string; accentBorder: string; badge: string; pill: string; ring: string }
> = {
  beginner: {
    accentBg: "bg-emerald-500",
    accentBorder: "border-emerald-400/60",
    badge: "bg-emerald-500/15 text-emerald-100 border border-emerald-300/30",
    pill: "border border-emerald-300/30 text-emerald-100 bg-white/5",
    ring: "ring-emerald-500/20",
  },
  intermediate: {
    accentBg: "bg-sky-500",
    accentBorder: "border-sky-400/60",
    badge: "bg-sky-500/15 text-sky-100 border border-sky-300/30",
    pill: "border border-sky-300/30 text-sky-100 bg-white/5",
    ring: "ring-sky-500/20",
  },
  advanced: {
    accentBg: "bg-amber-500",
    accentBorder: "border-amber-400/60",
    badge: "bg-amber-500/15 text-amber-100 border border-amber-300/30",
    pill: "border border-amber-300/30 text-amber-100 bg-white/5",
    ring: "ring-amber-500/20",
  },
  expert: {
    accentBg: "bg-violet-500",
    accentBorder: "border-violet-400/60",
    badge: "bg-violet-500/15 text-violet-100 border border-violet-300/30",
    pill: "border border-violet-300/30 text-violet-100 bg-white/5",
    ring: "ring-violet-500/20",
  },
};

// Neutral grayscale background for tiered headers (Option 3). Keep accents colored by tier.
// Use solid opacity to avoid translucency when sticky (no backdrop-blur).
const TIERED_NEUTRAL_BG =
  "bg-gradient-to-br from-slate-500 to-slate-400";

interface AchievementSectionProps {
  category: keyof Achievements;
  subcategory: string;
  title: string;
  sectionKey: SectionKey;
  achievements: Achievement[];
  /** Optional tier info badge for tiered category cards. */
  tierInfo?: TierHeaderInfo | null;
  /** Optional header color variant for non-tiered sections (e.g. "aces" = fuchsia/indigo gradient). */
  headerVariant?: "default" | "aces";
  /** Optional class applied to the sticky header container (scoped; e.g. Aces unlock). */
  headerClassName?: string;
  stickyTop: number;
  viewedTierIndex?: number;
  activeTierIndex?: number;
  isTierViewOnly?: boolean;
  onSelectTier?: (tierIndex: number) => void;
  /** Ace Race card (skill-35) celebration target id. */
  aceCelebratingId?: string | null;
  /** Ace Race card celebration phase. */
  aceCelebrationPhase?: "idle" | "shake" | "pop";
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
  onIncrementAchievement?: (id: string, delta: number) => void;
  getCompletionColor: (value: number) => string;
  /** Set when this tiered category levels up; section matches on categoryId. */
  tierUnlockPulse?: { categoryId: string; tierKey: string } | null;
}

export function AchievementSection({
  category,
  subcategory,
  title,
  sectionKey,
  achievements,
  tierInfo,
  headerVariant = "default",
  headerClassName,
  stickyTop,
  viewedTierIndex,
  activeTierIndex,
  isTierViewOnly = false,
  onSelectTier,
  effectiveById: effectiveByIdProp,
  completion,
  isOpen,
  onToggle,
  onToggleAchievement,
  onIncrementAchievement,
  getCompletionColor,
  tierUnlockPulse,
}: AchievementSectionProps) {
  const [justUnlockedTier, setJustUnlockedTier] = useState<string | null>(null);

  useEffect(() => {
    if (!tierUnlockPulse || !tierInfo?.categoryId) return;
    if (tierUnlockPulse.categoryId !== tierInfo.categoryId) return;
    setJustUnlockedTier(tierUnlockPulse.tierKey);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  }, [tierUnlockPulse, tierInfo?.categoryId]);

  useEffect(() => {
    if (!justUnlockedTier) return;
    const t = setTimeout(() => setJustUnlockedTier(null), 800);
    return () => clearTimeout(t);
  }, [justUnlockedTier]);

  const localById = useMemo(() => {
    const map: Record<string, Achievement> = {};
    for (const a of achievements) map[a.id] = a;
    return map;
  }, [achievements]);

  const effectiveById = effectiveByIdProp ?? localById;

  const tierKey =
    tierInfo?.tierKey ??
    (tierInfo?.tierIndex === 0
      ? "beginner"
      : tierInfo?.tierIndex === 1
        ? "intermediate"
        : tierInfo?.tierIndex === 2
          ? "advanced"
          : tierInfo?.tierIndex === 3
            ? "expert"
            : "beginner");

  const theme = tierInfo ? (TIER_ACCENT[tierKey] ?? TIER_ACCENT.beginner) : null;
  const TIER_LABELS = ["Beginner", "Intermed.", "Advanced", "Expert"];

  return (
    <Collapsible open={isOpen}>
      <div
        id={sectionKey}
        className={cn(
          "w-full rounded-2xl transition-all duration-300",
          justUnlockedTier && "scale-[1.02] shadow-lg ring-2 ring-emerald-400/50",
          headerClassName
        )}
      >
        {/* Sticky offset is controlled by dashboard/page.tsx via the stickyTop prop. */}
        <div
          className={cn("sticky z-40 rounded-2xl")}
          style={{ top: `${stickyTop}px` }}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border-b shadow-[0_6px_16px_rgba(0,0,0,0.10)] ring-1 ring-black/5",
              theme
                ? cn(TIERED_NEUTRAL_BG, theme.accentBorder, `ring-1 ${theme.ring}`)
                : headerVariant === "aces"
                  ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 border-b ring-1 ring-fuchsia-500/20"
                  : "bg-gradient-to-r from-emerald-400 to-teal-500 border-b ring-1 ring-emerald-500/20"
            )}
          >
            {theme && <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/35" />}
            {theme && (
              <div
                className={cn(
                  "pointer-events-none absolute left-0 top-0 z-[1] h-full w-[5px] rounded-l-2xl",
                  theme.accentBg
                )}
              />
            )}

            <button
              type="button"
              onClick={onToggle}
              className="relative z-10 flex w-full flex-col rounded-2xl px-3 py-1.5 transition-transform duration-100 active:scale-95 active:opacity-95"
              style={{ outline: "none", border: "none", background: "none" }}
              aria-expanded={isOpen}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 text-left text-base font-semibold leading-tight text-white">
                  {title}
                </h3>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
                    {Math.round(completion)}%
                  </span>

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-white opacity-70 transition-transform",
                      isOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </div>
              </div>

              {tierInfo && (
                <div className="mt-0.5">
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs text-white/90">
                    • {tierInfo.label} {tierInfo.progressText}
                  </span>
                </div>
              )}
            </button>

            {tierInfo && typeof activeTierIndex === "number" && typeof viewedTierIndex === "number" && onSelectTier && (
              <div className="px-3 pb-1.5">
                <div className="grid grid-cols-4 gap-1">
                  {TIER_LABELS.map((label, idx) => {
                    const isCurrent = idx === activeTierIndex;
                    const isSelected = idx === viewedTierIndex;
                    const isLocked = idx > activeTierIndex;
                    const isPast = idx < activeTierIndex;

                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={isLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) onSelectTier(idx);
                        }}
                        className={cn(
                          "relative min-w-0 overflow-hidden rounded-full px-1.5 py-1 text-[9px] font-semibold transition-all duration-100 active:scale-95",
                          "ring-1",
                          isSelected && isCurrent && "bg-white text-slate-900 ring-white shadow-[0_2px_10px_rgba(255,255,255,0.18)]",
                          isSelected && !isCurrent && "bg-white/20 text-white ring-white/30 shadow-[0_2px_10px_rgba(0,0,0,0.16)]",
                          !isSelected && isPast && "bg-black/15 text-white/85 ring-white/20 hover:bg-black/20",
                          isLocked && "bg-black/10 text-white/35 ring-white/10 cursor-not-allowed"
                        )}
                        aria-pressed={isSelected}
                        aria-label={isLocked ? `${label} locked` : label}
                      >
                        <span className="relative z-10 inline-flex w-full items-center justify-center gap-1 truncate">
                          {isLocked && <Lock className="h-3 w-3 shrink-0" />}
                          <span className="truncate leading-none">{label}</span>
                        </span>

                        {isLocked && (
                          <>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-[-6px] left-1/2 w-[1px] -translate-x-1/2 rotate-[28deg] bg-white/25"
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                            />
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content (now inside the same card) */}
        <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className={cn("overflow-hidden p-2 pt-1.5", isTierViewOnly && "opacity-95")}>
            <div className="grid gap-1.5 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                if (!isGatedVisible(achievement as any, effectiveById as any)) return null;

                const unlocked = isUnlocked(achievement, effectiveById);
                if (achievement.requiresId && !unlocked) return null;

                return (
                  <AchievementCard
                    key={achievement.id}
                    {...achievement}
                    category={category}
                    locked={!unlocked}
                    onToggle={isTierViewOnly ? () => {} : () => onToggleAchievement(achievement.id)}
                    onIncrement={
                      !isTierViewOnly && achievement.kind === "counter" && onIncrementAchievement
                        ? () => onIncrementAchievement(achievement.id, 1)
                        : undefined
                    }
                    onDecrement={
                      !isTierViewOnly && achievement.kind === "counter" && onIncrementAchievement
                        ? () => onIncrementAchievement(achievement.id, -1)
                        : undefined
                    }
                  />
                );
              })}
            </div>

          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
