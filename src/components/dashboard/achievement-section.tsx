"use client";

import { useMemo } from "react";
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
  aceCelebratingId,
  aceCelebrationPhase = "idle",
  effectiveById: effectiveByIdProp,
  allAchievements,
  newlyRevealedIds,
  revealPulseParentIds,
  celebratingParentId,
  completion,
  isOpen,
  onToggle,
  onToggleAchievement,
  onIncrementAchievement,
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
        className={cn("w-full rounded-2xl", headerClassName)}
      >
        {/* Sticky offset is controlled by dashboard/page.tsx via the stickyTop prop. */}
        <div
          className={cn("sticky z-40 rounded-2xl overflow-hidden")}
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
              className="relative z-10 flex w-full items-center justify-between rounded-2xl px-3 py-1.5 transition-transform duration-100 active:scale-[0.99] active:opacity-95"
              style={{ outline: "none", border: "none", background: "none" }}
              aria-expanded={isOpen}
            >
              <div className="flex-1 min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
                  {tierInfo && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                        theme?.badge ?? "bg-black/15 ring-1 ring-white/25 text-white"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                      <span>{tierInfo.label}</span>
                      <span className="opacity-80 tabular-nums">{tierInfo.progressText}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                    theme?.pill ?? "bg-black/20 text-white"
                  )}
                >
                  {Math.round(completion)}%
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-white shrink-0 transition-transform",
                    isOpen ? "rotate-180" : "rotate-0"
                  )}
                />
              </div>
            </button>

            {tierInfo && typeof activeTierIndex === "number" && typeof viewedTierIndex === "number" && onSelectTier && (
              <div className="px-3 pb-1.5">
                <div className="grid grid-cols-4 gap-1">
                  {TIER_LABELS.map((label, idx) => {
                    const isCurrent = idx === activeTierIndex;
                    const isSelected = idx === viewedTierIndex;
                    const isFuture = idx > activeTierIndex;
                    const isPast = idx < activeTierIndex;

                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={isFuture}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isFuture) onSelectTier(idx);
                        }}
                        className={cn(
                          "relative min-w-0 overflow-hidden rounded-full px-1.5 py-1 text-[9px] font-semibold transition-all",
                          "ring-1",
                          isSelected && isCurrent && "bg-white text-slate-900 ring-white shadow-[0_2px_10px_rgba(255,255,255,0.18)]",
                          isSelected && !isCurrent && "bg-white/20 text-white ring-white/30 shadow-[0_2px_10px_rgba(0,0,0,0.16)]",
                          !isSelected && isPast && "bg-black/15 text-white/85 ring-white/20 hover:bg-black/20",
                          isFuture && "bg-black/10 text-white/35 ring-white/10 cursor-not-allowed"
                        )}
                        aria-pressed={isSelected}
                        aria-label={isFuture ? `${label} locked` : label}
                      >
                        <span className="relative z-10 inline-flex w-full items-center justify-center gap-1 truncate">
                          {isFuture && <Lock className="h-3 w-3 shrink-0" />}
                          <span className="truncate leading-none">{label}</span>
                        </span>

                        {isFuture && (
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
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className={cn("overflow-hidden p-2 pt-1.5", isTierViewOnly && "opacity-95")}>
            <div className="grid gap-1.5 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                if (!isGatedVisible(achievement as any, effectiveById as any)) return null;
                const unlocked = isUnlocked(achievement, effectiveById);
                if (achievement.requiresId && !unlocked) return null;

                const isAceCelebrating = achievement.id === aceCelebratingId;
                if (process.env.NODE_ENV !== "production" && (achievement.id === "skill-35" || achievement.id === "social-0")) {
                  console.log("[GATE][CELEBRATE] render", { id: achievement.id, isCelebrating: isAceCelebrating, phase: aceCelebrationPhase });
                }

                const children = childrenByParentId.get(achievement.id) ?? [];
                const totalChildrenCount = children.length;
                const lockedChildCount = children.filter((c) => !isUnlocked(c, effectiveById)).length;
                const hasSecrets = totalChildrenCount > 0;

                const isCounter = achievement.kind === "counter";
                const progress = typeof (achievement as any).progress === "number" ? (achievement as any).progress : 0;
                const target = typeof (achievement as any).target === "number" ? (achievement as any).target : 1;

                return (
                  <AchievementCard
                    key={achievement.id}
                    {...achievement}
                    category={category}
                    progress={progress}
                    target={target}
                    locked={!unlocked}
                    hasSecrets={hasSecrets}
                    lockedChildCount={hasSecrets ? lockedChildCount : undefined}
                    totalChildrenCount={hasSecrets ? totalChildrenCount : undefined}
                    isNewlyRevealed={newlyRevealedIds?.has(achievement.id) ?? false}
                    revealPulse={revealPulseParentIds?.has(achievement.id) ?? false}
                    celebrateParent={celebratingParentId === achievement.id}
                    celebratePhase={
                      isAceCelebrating ? (aceCelebrationPhase ?? "idle") : "idle"
                    }
                    onToggle={isTierViewOnly ? () => {} : () => onToggleAchievement(achievement.id)}
                    onIncrement={
                      !isTierViewOnly && isCounter && onIncrementAchievement
                        ? () => onIncrementAchievement(achievement.id, 1)
                        : undefined
                    }
                    onDecrement={
                      !isTierViewOnly && isCounter && onIncrementAchievement
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
