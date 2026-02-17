"use client";

import { useMemo } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { cn } from "@/lib/utils";
import { isGatedVisible, isUnlocked } from "@/lib/achievementProgress";
import type { Achievement, Achievements } from "@/lib/useAchievements";

type SectionKey = string;

type TierHeaderInfo = {
  tierIndex: number;
  tierKey?: string;
  label: string;
  progressText: string; // e.g. "2/5"
};

const TIER_ACCENT: Record<
  string,
  { accentBg: string; accentBorder: string; badge: string; pill: string }
> = {
  beginner: {
    accentBg: "bg-emerald-500",
    accentBorder: "border-emerald-400/60",
    badge: "bg-emerald-500/15 text-emerald-100 border border-emerald-300/30",
    pill: "border border-emerald-300/30 text-emerald-100 bg-white/5",
  },
  intermediate: {
    accentBg: "bg-sky-500",
    accentBorder: "border-sky-400/60",
    badge: "bg-sky-500/15 text-sky-100 border border-sky-300/30",
    pill: "border border-sky-300/30 text-sky-100 bg-white/5",
  },
  advanced: {
    accentBg: "bg-amber-500",
    accentBorder: "border-amber-400/60",
    badge: "bg-amber-500/15 text-amber-100 border border-amber-300/30",
    pill: "border border-amber-300/30 text-amber-100 bg-white/5",
  },
  expert: {
    accentBg: "bg-violet-500",
    accentBorder: "border-violet-400/60",
    badge: "bg-violet-500/15 text-violet-100 border border-violet-300/30",
    pill: "border border-violet-300/30 text-violet-100 bg-white/5",
  },
};

// Neutral grayscale background for tiered headers (Option 3). Keep accents colored by tier.
const TIERED_NEUTRAL_BG =
  "bg-gradient-to-br from-slate-500/60 to-slate-400/40 backdrop-blur";

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

  return (
    <Collapsible open={isOpen}>
      <div className={cn("sticky top-24 md:top-20 z-40 shadow-sm", headerClassName)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border-b",
            theme
              ? cn(TIERED_NEUTRAL_BG, theme.accentBorder)
              : headerVariant === "aces"
                ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 border-b"
                : "bg-gradient-to-r from-emerald-400 to-teal-500 border-b"
          )}
        >
          {theme && (
            <div className="pointer-events-none absolute inset-0 bg-slate-950/35" />
          )}
          {theme && (
            <div
              className={cn(
                "pointer-events-none absolute left-0 top-0 h-full w-1.5 rounded-l-2xl z-20",
                theme.accentBg
              )}
            />
          )}
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer relative z-10"
            style={{ outline: "none", border: "none", background: "none" }}
          >
            {/* Left: title (+ optional tier badge) */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                {tierInfo && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
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

            {/* Right: pill + chevron (never overflow) */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap",
                  theme?.pill ?? "bg-black/20 text-white"
                )}
              >
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
      </div>
      <CollapsibleContent>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 mt-3">
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
                celebratePhase={
                  isAceCelebrating ? (aceCelebrationPhase ?? "idle") : "idle"
                }
                onToggle={() => onToggleAchievement(achievement.id)}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
