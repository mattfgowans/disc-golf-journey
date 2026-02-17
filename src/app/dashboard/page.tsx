"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements, type Achievement, type Achievements } from "@/lib/useAchievements";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS_CATALOG, getActiveTierAchievements, isTieredCategoryId } from "@/data/achievements";
import { getCurrentYear, isAchievementCompleted, isGatedVisible } from "@/lib/achievementProgress";
import { StatsHeader } from "@/components/dashboard/stats-header";
import { AchievementSection } from "@/components/dashboard/achievement-section";
import { QuickLogSheet } from "@/components/dashboard/quick-log-sheet";
import { RequireAuth } from "@/components/auth/require-auth";
import { auth } from "@/lib/firebase";
import { getUserStats } from "@/lib/leaderboard";
import { getRankAndPrestige } from "@/lib/ranks";
import { computeTabPointTotals } from "@/lib/points";
import { getTabMastery } from "@/lib/mastery";
import { isAchievementDisabled } from "@/lib/disabledAchievements";
import { Plus } from "lucide-react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";



// TODO: Add achievement badges (rarity-based and achievement-specific)

// Achievement IDs used for special handling (gate animation + modal, no bobble)
const ACE_RACE_ID = "skill-35"; // Ace Race (first-ever ace)

// Rank gradient colors (by rank key)
const RANK_COLORS: Record<string, string> = {
  rookie: "from-gray-400 to-gray-600",
  casual: "from-green-400 to-green-600",
  regular: "from-blue-400 to-blue-600",
  dedicated: "from-purple-400 to-purple-600",
  competitive: "from-orange-400 to-orange-600",
  advanced: "from-red-400 to-red-600",
  expert: "from-yellow-300 to-yellow-500",
  elite: "from-fuchsia-500 to-indigo-500",
  pro: "from-slate-700 to-black",
  master: "from-amber-500 to-rose-600",
  legend: "from-emerald-400 to-cyan-500",
};

// Section configuration for all achievement categories
const SECTIONS = {
  skill: [
    { key: "puttingMastery", title: "Putting Mastery" },
    { key: "distanceControl", title: "Distance Control" },
    { key: "specialtyShots", title: "Specialty Shots" },
    { key: "scoringAchievements", title: "Scoring Achievements" },
    { key: "aces", title: "Aces" },
    { key: "roundRatings", title: "Round Ratings" },
  ],
  social: [
    { key: "communityEngagement", title: "Community Engagement" },
    { key: "teachingLeadership", title: "Teaching & Leadership" },
    { key: "mediaContent", title: "Media & Content" },
    { key: "cardmates", title: "Cardmates" },
    { key: "competitionEvents", title: "Competition & Events" },
    { key: "goodSamaritan", title: "Good Samaritan" },
  ],
  collection: [
    { key: "discEssentials", title: "Disc Essentials" },
    { key: "discMilestones", title: "Disc Collection Milestones" },
    { key: "equipmentAccessories", title: "Equipment & Accessories" },
    { key: "specialDiscs", title: "Special Discs" },
    { key: "courseExplorer", title: "Course Explorer" },
    { key: "roundMilestones", title: "Round Milestones" },
  ],
} as const;

// Derive all section keys from SECTIONS to ensure type safety
type SectionKey = typeof SECTIONS[keyof typeof SECTIONS][number]['key'];

// Sections that should be open by default
const DEFAULT_OPEN_SECTIONS: Partial<Record<SectionKey, boolean>> = {
  discEssentials: true,
  discMilestones: true,
  equipmentAccessories: true,
};

// Generate default openSections object from SECTIONS
function getDefaultOpenSections(): Record<SectionKey, boolean> {
  const allKeys: SectionKey[] = [];
  
  // Collect all keys from all categories
  for (const category of Object.values(SECTIONS)) {
    for (const section of category) {
      allKeys.push(section.key);
    }
  }
  
  // Create object with all keys, using defaults where specified
  const defaults: Record<SectionKey, boolean> = {} as Record<SectionKey, boolean>;
  for (const key of allKeys) {
    defaults[key] = DEFAULT_OPEN_SECTIONS[key] ?? false;
  }
  
  return defaults;
}

// Load saved state from localStorage on mount
function getInitialOpenSections(): Record<SectionKey, boolean> {
  const defaults = getDefaultOpenSections();
  
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('achievementOpenSections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved state with defaults to ensure new sections are included
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error('Error parsing saved openSections:', e);
      }
    }
  }
  return defaults;
}

function getInitialActiveTab(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('achievementActiveTab');
    return saved || 'skill';
  }
  return 'skill';
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

// Helper function to get progress color based on percentage
function getProgressColorClass(percent: number, isActive: boolean = false): string {
  if (percent === 100) return isActive ? "bg-blue-500/30" : "bg-blue-500/20";
  if (percent >= 61) return isActive ? "bg-green-500/30" : "bg-green-500/20";
  if (percent >= 26) return isActive ? "bg-yellow-500/30" : "bg-yellow-500/20";
  return isActive ? "bg-red-500/30" : "bg-red-500/20";
}

// Helper function to get conditional rounding for small fills
function getFillRounding(percent: number): string {
  return "rounded-full"; // Pill cap for all fills (avoids squared right edge at low %)
}

// Helper component for tab triggers with background fill
function TabTriggerWithFill({
  value,
  label,
  percent,
  isActive,
  eligibleThreshold = 80,
}: {
  value: string;
  label: string;
  percent: number;
  isActive: boolean;
  eligibleThreshold?: number;
}) {
  const colorClass = getProgressColorClass(percent, isActive);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const fillRounding = getFillRounding(clampedPercent);
  const eligible = clampedPercent >= eligibleThreshold;

  return (
    <TabsTrigger
      value={value}
      className="relative min-w-[112px] overflow-hidden rounded-full ring-1 ring-inset ring-muted-foreground/20 bg-muted/40 py-1 data-[state=active]:ring-2 data-[state=active]:ring-inset data-[state=active]:ring-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2"
    >
      {/* Progress fill layer */}
      <div
        className={`absolute inset-y-0 left-0 ${fillRounding} ${colorClass} z-0 pointer-events-none transition-[width] duration-300 ease-out`}
        style={{ width: `calc(${clampedPercent}% + 1px)` }}
      />

      {/* Text layer on top */}
      <div className="relative z-10 flex min-w-0 items-center justify-between w-full px-1 gap-1">
        <span className="whitespace-nowrap data-[state=active]:font-semibold shrink-0">{label}</span>
        <div className="flex shrink-0 items-center gap-1 min-w-0">
          {eligible && (
            <span
              className="text-[10px] font-medium opacity-70 text-muted-foreground"
              title="Eligible when this tab reaches 80% completion."
            >
              Eligible
            </span>
          )}
          <span className="text-[11px] opacity-80 tabular-nums">{Math.round(clampedPercent)}%</span>
        </div>
      </div>
    </TabsTrigger>
  );
}

function DashboardInner() {
  const {
    achievements,
    loading: achievementsLoading,
    toggleAchievement,
    newUnlocks,
    clearNewUnlocks,
    tierUpMessage,
    clearTierUpMessage,
    devResetPuttingMasteryTier,
    devResetAllTieredCategoryTiers,
    getUserCategoryTierIndex,
    aceCelebratingId,
    aceCelebrationPhase,
  } = useAchievements(ACHIEVEMENTS_CATALOG);

  const uid = auth.currentUser?.uid ?? "(no user)";

  const [openSections, setOpenSections] = useState(getInitialOpenSections);
  const [activeTab, setActiveTab] = useState(getInitialActiveTab);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [userStats, setUserStats] = useState<{ allTime: number } | null>(null);
  const [recentlyRevealedIds, setRecentlyRevealedIds] = useState<Set<string>>(new Set());
  const [revealPulseParentIds, setRevealPulseParentIds] = useState<Set<string>>(new Set());
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [celebratingParentId, setCelebratingParentId] = useState<string | null>(null);

  const showDevTools =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === "true";

  useEffect(() => {
    if (newUnlocks.length === 0) {
      setSecretModalOpen(false);
      return;
    }

    const parentIds = Array.from(new Set(newUnlocks.map((a) => a.requiresId).filter(Boolean))) as string[];
    if (parentIds.length > 0) {
      setRevealPulseParentIds(new Set(parentIds));
      window.setTimeout(() => setRevealPulseParentIds(new Set()), 1500);
    }

    const t = window.setTimeout(() => setSecretModalOpen(true), 700);
    return () => window.clearTimeout(t);
  }, [newUnlocks]);

  useEffect(() => {
    if (!tierUpMessage) return;
    const t = window.setTimeout(() => clearTierUpMessage(), 2000);
    return () => window.clearTimeout(t);
  }, [tierUpMessage, clearTierUpMessage]);

  // Fire confetti exactly on Ace Race "pop" moment.
  useEffect(() => {
    const handler = () => {
      confetti({ particleCount: 160, spread: 85, origin: { y: 0.6 } });
    };
    window.addEventListener("ace-pop", handler as EventListener);
    return () => window.removeEventListener("ace-pop", handler as EventListener);
  }, []);

  const startRevealGlow = (ids: string[]) => {
    if (ids.length === 0) return;
    setRecentlyRevealedIds(new Set(ids));
    window.setTimeout(() => setRecentlyRevealedIds(new Set()), 2500);
  };

  const handleCloseSecretModal = () => {
    const parentIds = Array.from(new Set(newUnlocks.map((a) => a.requiresId).filter(Boolean))) as string[];
    if (parentIds.length > 0) {
      setRevealPulseParentIds(new Set(parentIds));
      window.setTimeout(() => setRevealPulseParentIds(new Set()), 2500);
    }
    startRevealGlow(newUnlocks.map((a) => a.id));
    clearNewUnlocks();
  };

  // Save openSections to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('achievementOpenSections', JSON.stringify(openSections));
    }
  }, [openSections]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('achievementActiveTab', activeTab);
    }
  }, [activeTab]);

  // Fetch Firestore stats (allTime) for rank/prestige
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    getUserStats(uid)
      .then((s) => {
        if (!cancelled) setUserStats({ allTime: s.allTime });
      })
      .catch(() => {
        if (!cancelled) setUserStats({ allTime: 0 });
      });
    return () => { cancelled = true; };
  }, [auth.currentUser?.uid]);

  // Use achievements from Firebase, or fallback to catalog if not loaded yet
  // Only fallback if achievements is null/undefined, not if arrays are empty
  const currentAchievements: Achievements = achievements ?? ACHIEVEMENTS_CATALOG;

  const achievementsForUI = useMemo(
    () => ({
      skill: currentAchievements.skill.filter((a) => !isAchievementDisabled(a.id)),
      social: currentAchievements.social.filter((a) => !isAchievementDisabled(a.id)),
      collection: currentAchievements.collection.filter((a) => !isAchievementDisabled(a.id)),
    }),
    [currentAchievements]
  );

  const effectiveById = useMemo(() => {
    const map: Record<string, Achievement> = {};
    for (const cat of ["skill", "social", "collection"] as const) {
      for (const a of achievementsForUI[cat]) map[a.id] = a;
    }
    return map;
  }, [achievementsForUI]);

  const allAchievements = useMemo(
    () => [
      ...achievementsForUI.skill,
      ...achievementsForUI.social,
      ...achievementsForUI.collection,
    ],
    [achievementsForUI]
  );

  const newlyRevealedIds = useMemo(() => {
    const s = new Set<string>([...recentlyRevealedIds]);
    for (const a of newUnlocks) s.add(a.id);
    return s;
  }, [recentlyRevealedIds, newUnlocks]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const a of allAchievements) {
      if (a.requiresId) {
        const arr = map.get(a.requiresId) ?? [];
        arr.push(a);
        map.set(a.requiresId, arr);
      }
    }
    return map;
  }, [allAchievements]);

  const toggleAchievementWithCelebration = (category: keyof Achievements, id: string) => {
    const ach = currentAchievements[category].find((a) => a.id === id);
    if (!ach) return;

    const willComplete = ach.kind !== "counter" && !ach.isCompleted;
    const hasSecrets = (childrenByParentId.get(id)?.length ?? 0) > 0;

    // League Night Rookie (social-0) and Ace Race (skill-35): use gate animation on card, show modal for new unlocks.
    if (
      (category === "social" && id === "social-0") ||
      (category === "skill" && id === ACE_RACE_ID)
    ) {
      if (willComplete) {
        toggleAchievement(category, id);
        return;
      }
    }

    if (willComplete && hasSecrets) {
      setCelebratingParentId(id);

      window.setTimeout(() => {
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      }, 1900);

      window.setTimeout(() => {
        setCelebratingParentId(null);
        toggleAchievement(category, id);
      }, 2100);

      return;
    }

    toggleAchievement(category, id);
  };

  // Helper functions (defined early so they can be used by AchievementSection)

  // Get completion fraction for a single achievement (0-1)
  const getAchievementCompletionFraction = (a: Achievement): number => {
    if (a.kind === "counter") {
      return Math.min(Math.max(a.progress / a.target, 0), 1);
    }
    return a.isCompleted ? 1 : 0;
  };

  // Check if achievement is fully completed
  const isAchievementFullyCompleted = (a: Achievement): boolean => {
    if (a.kind === "counter") {
      return a.progress >= a.target;
    }
    return a.isCompleted;
  };

  // Calculate completion percentage for a specific set of achievements
  const getCategoryCompletion = (achievements: Achievement[]) => {
    const total = achievements.length;
    if (total === 0) return 0;
    const totalFraction = achievements.reduce((sum, a) => sum + getAchievementCompletionFraction(a), 0);
    return (totalFraction / total) * 100;
  };

  const getTierInfoForSection = (category: keyof Achievements, subcategory: string) => {
    const inCard = achievementsForUI[category].filter(
      (achievement) => achievement.subcategory === subcategory
    );
    const categoryId = inCard.find((a) => typeof (a as any).categoryId === "string")?.categoryId as
      | string
      | undefined;
    if (!categoryId || !isTieredCategoryId(categoryId)) return null;

    const tierIndex = getUserCategoryTierIndex(categoryId);
    const tierDefs = getActiveTierAchievements(categoryId, tierIndex);
    const tierIds = tierDefs.map((d) => d.id);
    const currentYear = getCurrentYear();

    const visibleTierDefs = tierDefs.filter((def) => isGatedVisible(def as any, effectiveById as any));
    const completedCount = visibleTierDefs.filter((def) =>
      isAchievementCompleted(def as any, effectiveById[def.id] as any, currentYear)
    ).length;

    const label =
      tierIndex === 0 ? "Beginner" :
      tierIndex === 1 ? "Intermediate" :
      tierIndex === 2 ? "Advanced" :
      tierIndex === 3 ? "Expert" :
      `Tier ${tierIndex}`;

    return {
      tierIndex,
      tierKey:
        tierIndex === 0 ? "beginner" :
        tierIndex === 1 ? "intermediate" :
        tierIndex === 2 ? "advanced" :
        tierIndex === 3 ? "expert" :
        `tier-${tierIndex}`,
      label,
      progressText: `${completedCount}/${visibleTierDefs.length || 0}`,
    };
  };

  // Get achievements for a specific category and subcategory
  const getCategoryAchievements = (category: keyof Achievements, subcategory: string) => {
    // Filter by subcategory for all categories
    const filtered = currentAchievements[category].filter(
      (achievement) => achievement.subcategory === subcategory
    );

    // Tiered category cards: show only achievements in the active tier (preserve tier-defined order).
    const categoryId = filtered.find((a) => typeof (a as any).categoryId === "string")?.categoryId as
      | string
      | undefined;
    if (categoryId && isTieredCategoryId(categoryId)) {
      const tierIndex = getUserCategoryTierIndex(categoryId);
      const tierDefs = getActiveTierAchievements(categoryId, tierIndex);
      const tierIds = tierDefs.map((d) => d.id);
      if (tierIds.length > 0) {
        const byId = new Map(filtered.map((a) => [a.id, a] as const));
        return tierIds
          .map((id) => byId.get(id))
          .filter((a): a is Achievement => a != null);
      }
    }

    return filtered;
  };

  const getCompletionColor = (value: number) => {
    if (value === 0) return "text-gray-400";
    if (value <= 25) return "text-red-500";
    if (value <= 60) return "text-yellow-500";
    if (value <= 99) return "text-green-600";
    return "text-blue-500";
  };

  // Show loading state
  if (achievementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
        <p className="text-xs text-muted-foreground mt-2">uid: {uid}</p>
      </div>
    );
  }

  const toggleSection = (section: SectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  // Calculate completion percentages for each category (excludes disabled)
  const getCompletionPercentage = (category: keyof Achievements) => {
    const achievements = achievementsForUI[category];
    const totalAchievements = achievements.length;
    if (totalAchievements === 0) return 0;
    const totalFraction = achievements.reduce((sum, a) => sum + getAchievementCompletionFraction(a), 0);
    return (totalFraction / totalAchievements) * 100;
  };

  const skillCompletion = getCompletionPercentage("skill");
  const socialCompletion = getCompletionPercentage("social");
  const collectionCompletion = getCompletionPercentage("collection");

  // Tab Mastery + patch eligibility (from achievements, not Firestore)
  const tabPointTotals = computeTabPointTotals(achievementsForUI);
  const skillMastery = getTabMastery({
    tabAllTimePoints: tabPointTotals.skillAllTime,
    completionPercent: skillCompletion,
    tab: "skill",
  });
  const socialMastery = getTabMastery({
    tabAllTimePoints: tabPointTotals.socialAllTime,
    completionPercent: socialCompletion,
    tab: "social",
  });
  const collectionMastery = getTabMastery({
    tabAllTimePoints: tabPointTotals.collectionAllTime,
    completionPercent: collectionCompletion,
    tab: "collection",
  });

  // Rank + Prestige from Firestore allTime
  const allTimePoints = userStats?.allTime ?? 0;
  const rp = getRankAndPrestige(allTimePoints);
  const currentRankTier = {
    name: rp.rank.name,
    minPoints: rp.rank.min,
    color: RANK_COLORS[rp.rank.key] ?? "from-gray-400 to-gray-600",
  };
  const next = rp.progress.nextRank;
  const nextRankTier = next
    ? { name: next.name, minPoints: next.min, color: RANK_COLORS[next.key] ?? "from-gray-400 to-gray-600" }
    : null;
  const rankProgressPct = Math.round(rp.progress.ratio * 100);

  // Calculate daily streak (simplified - counts unique completion days; excludes disabled)
  const getCurrentStreak = () => {
    const completedAchievements = [...achievementsForUI.skill, ...achievementsForUI.social, ...achievementsForUI.collection]
      .filter(a => isAchievementFullyCompleted(a) && a.completedDate);

    if (completedAchievements.length === 0) return 0;

    // Group by date and count unique days
    const uniqueDays = new Set(
      completedAchievements.map(a =>
        a.completedDate
          ? a.completedDate.toDate().toDateString()
          : new Date().toDateString() // fallback, though this shouldn't happen
      )
    );

    return uniqueDays.size;
  };

  const currentStreak = getCurrentStreak();

  const activeCompletion =
    activeTab === "skill" ? skillCompletion :
    activeTab === "social" ? socialCompletion :
    collectionCompletion;

  return (
    <div className="container mx-auto py-4 -mt-8 pb-24" data-gramm="false">
      <Dialog
        open={secretModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSecretModalOpen(false);
            handleCloseSecretModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New achievements unlocked!</DialogTitle>
            <DialogDescription>
              Completing an achievement revealed new goals you can now work toward.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside text-sm space-y-1 my-2">
            {newUnlocks.map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => { setSecretModalOpen(false); handleCloseSecretModal(); }} size="sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-16 z-50 bg-background border-b">
          <TabsList className="grid w-full grid-cols-3 gap-2 rounded-full bg-muted/30 p-0.5">
            <TabTriggerWithFill value="skill" label="Skill" percent={skillCompletion} isActive={activeTab === "skill"} eligibleThreshold={80} />
            <TabTriggerWithFill value="social" label="Social" percent={socialCompletion} isActive={activeTab === "social"} eligibleThreshold={80} />
            <TabTriggerWithFill value="collection" label="Collection" percent={collectionCompletion} isActive={activeTab === "collection"} eligibleThreshold={80} />
          </TabsList>
        </div>

        {showDevTools && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => devResetPuttingMasteryTier()}
              >
                DEV: Reset Putting Mastery Tier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => devResetAllTieredCategoryTiers()}
              >
                DEV: Reset ALL Tiered Categories
              </Button>
            </div>
          </div>
        )}

        <StatsHeader
          completionPercentage={activeCompletion}
          totalPoints={allTimePoints}
          currentStreak={currentStreak}
          currentRank={currentRankTier}
          nextRank={nextRankTier}
          rankProgress={rankProgressPct}
          prestige={rp.prestige}
          pointsToNextRank={rp.progress.pointsToNext}
          nextRankName={rp.progress.nextRank?.name}
          pointsInPrestige={rp.pointsInPrestige}
        />

        <TabsContent value="skill">
          <div className="mt-4">
            <div className="space-y-4">
              {(() => {
                const withTierInfo = SECTIONS.skill.map((s) => ({
                  section: s,
                  tierInfo: getTierInfoForSection("skill", s.key),
                }));
                const nonTiered = withTierInfo.filter((x) => !x.tierInfo);
                const tiered = withTierInfo.filter((x) => !!x.tierInfo);
                const ordered = [...nonTiered, ...tiered];
                return ordered.map(({ section, tierInfo }) => {
                  const sectionKey = section.key as SectionKey;
                  const achievements = getCategoryAchievements("skill", section.key);
                  const completion = getCategoryCompletion(achievements);
                  return (
                    <AchievementSection
                      key={section.key}
                      category="skill"
                      subcategory={section.key}
                      title={section.title}
                      sectionKey={sectionKey}
                      achievements={achievements}
                      tierInfo={tierInfo}
                      headerVariant={section.key === "aces" ? "aces" : undefined}
                      aceCelebratingId={aceCelebratingId}
                      aceCelebrationPhase={aceCelebrationPhase}
                      effectiveById={effectiveById}
                      allAchievements={allAchievements}
                      newlyRevealedIds={newlyRevealedIds}
                      revealPulseParentIds={revealPulseParentIds}
                      celebratingParentId={celebratingParentId}
                      completion={completion}
                      isOpen={openSections[sectionKey]}
                      onToggle={() => toggleSection(sectionKey)}
                      onToggleAchievement={(id) => toggleAchievementWithCelebration("skill", id)}
                      getCompletionColor={getCompletionColor}
                    />
                  );
                });
              })()}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="social">
          <div className="mt-4">
            <div className="space-y-4">
              {(() => {
                const withTierInfo = SECTIONS.social.map((s) => ({
                  section: s,
                  tierInfo: getTierInfoForSection("social", s.key),
                }));
                const nonTiered = withTierInfo.filter((x) => !x.tierInfo);
                const tiered = withTierInfo.filter((x) => !!x.tierInfo);
                const ordered = [...nonTiered, ...tiered];
                return ordered.map(({ section, tierInfo }) => {
                  const sectionKey = section.key as SectionKey;
                  const achievements = getCategoryAchievements("social", section.key);
                  const completion = getCategoryCompletion(achievements);
                  return (
                    <AchievementSection
                      key={section.key}
                      category="social"
                      subcategory={section.key}
                      title={section.title}
                      sectionKey={sectionKey}
                      achievements={achievements}
                      tierInfo={tierInfo}
                      aceCelebratingId={aceCelebratingId}
                      aceCelebrationPhase={aceCelebrationPhase}
                      effectiveById={effectiveById}
                      allAchievements={allAchievements}
                      newlyRevealedIds={newlyRevealedIds}
                      revealPulseParentIds={revealPulseParentIds}
                      celebratingParentId={celebratingParentId}
                      completion={completion}
                      isOpen={openSections[sectionKey]}
                      onToggle={() => toggleSection(sectionKey)}
                      onToggleAchievement={(id) => toggleAchievementWithCelebration("social", id)}
                      getCompletionColor={getCompletionColor}
                    />
                  );
                });
              })()}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="collection">
          <div className="mt-4">
            <div className="space-y-4">
              {(() => {
                const withTierInfo = SECTIONS.collection.map((s) => ({
                  section: s,
                  tierInfo: getTierInfoForSection("collection", s.key),
                }));
                const nonTiered = withTierInfo.filter((x) => !x.tierInfo);
                const tiered = withTierInfo.filter((x) => !!x.tierInfo);
                const ordered = [...nonTiered, ...tiered];
                return ordered.map(({ section, tierInfo }) => {
                  const sectionKey = section.key as SectionKey;
                  const achievements = getCategoryAchievements("collection", section.key);
                  const completion = getCategoryCompletion(achievements);
                  return (
                    <AchievementSection
                      key={section.key}
                      category="collection"
                      subcategory={section.key}
                      title={section.title}
                      sectionKey={sectionKey}
                      achievements={achievements}
                      tierInfo={tierInfo}
                      effectiveById={effectiveById}
                      allAchievements={allAchievements}
                      newlyRevealedIds={newlyRevealedIds}
                      revealPulseParentIds={revealPulseParentIds}
                      celebratingParentId={celebratingParentId}
                      completion={completion}
                      isOpen={openSections[sectionKey]}
                      onToggle={() => toggleSection(sectionKey)}
                      onToggleAchievement={(id) => toggleAchievementWithCelebration("collection", id)}
                      getCompletionColor={getCompletionColor}
                    />
                  );
                });
              })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        achievements={achievementsForUI}
        onToggle={toggleAchievement}
        defaultCategory={activeTab as keyof Achievements}
      />
      {tierUpMessage && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-lg bg-foreground text-background text-sm shadow-lg animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          {tierUpMessage}
        </div>
      )}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
        onClick={() => setQuickLogOpen(true)}
        aria-label="Quick log"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}