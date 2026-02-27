"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements, type Achievement, type Achievements } from "@/lib/useAchievements";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS_CATALOG, getActiveTierAchievements, isTieredCategoryId } from "@/data/achievements";
import { getCurrentYear, isAchievementCompleted, isGatedVisible } from "@/lib/achievementProgress";
import { StatsHeader } from "@/components/dashboard/stats-header";
import { AchievementSection } from "@/components/dashboard/achievement-section";
import { auth } from "@/lib/firebase";
import { subscribeToUserStats } from "@/lib/leaderboard";
import { getRankAndPrestige } from "@/lib/ranks";
import { computeTabPointTotals } from "@/lib/points";
import { getTabMastery } from "@/lib/mastery";
import { isAchievementDisabled } from "@/lib/disabledAchievements";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
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
  return <DashboardInner />;
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
}: {
  value: string;
  label: string;
  percent: number;
  isActive: boolean;
}) {
  const colorClass = getProgressColorClass(percent, isActive);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const fillRounding = getFillRounding(clampedPercent);

  return (
    <TabsTrigger
      value={value}
      className="relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full px-4 py-2 ring-1 ring-inset ring-muted-foreground/20 bg-muted/40 text-xs sm:text-sm whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-inset data-[state=active]:ring-blue-500/50 data-[state=active]:font-semibold focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 transition-colors duration-200"
    >
      {/* Progress fill layer */}
      <div
        className={`absolute inset-y-0 left-0 ${fillRounding} ${colorClass} z-0 pointer-events-none transition-[width] duration-300 ease-out`}
        style={{ width: `calc(${clampedPercent}% + 1px)` }}
      />

      {/* Text layer on top */}
      <span className="relative z-10 font-medium">{label}</span>
      <span className="relative z-10 ml-1 inline-flex items-center justify-center rounded-full bg-background/70 px-2 py-0.5 text-sm tabular-nums text-foreground/70 min-w-[3.25rem]">{Math.round(clampedPercent)}%</span>
    </TabsTrigger>
  );
}

function DashboardInner() {
  const {
    achievements,
    loading: achievementsLoading,
    toggleAchievement,
    incrementAchievement,
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

  const router = useRouter();
  const [openSections, setOpenSections] = useState(getInitialOpenSections);
  const [activeTab, setActiveTab] = useState(getInitialActiveTab);
  const [userStats, setUserStats] = useState<{ allTime: number } | null>(null);
  const [patchCtaDismissed, setPatchCtaDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const set = new Set<string>();
    for (const t of ["skill", "social", "collection"]) {
      if (localStorage.getItem("dgjauth_patch_cta_dismissed_" + t) === "1") set.add(t);
    }
    return set;
  });
  const [recentlyRevealedIds, setRecentlyRevealedIds] = useState<Set<string>>(new Set());
  const [revealPulseParentIds, setRevealPulseParentIds] = useState<Set<string>>(new Set());
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [celebratingParentId, setCelebratingParentId] = useState<string | null>(null);

  const devToolsEnabled = process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS === "true";
  const devUid = process.env.NEXT_PUBLIC_DEV_UID;
  const showDevTools = devToolsEnabled && (!devUid || uid === devUid);

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

  // Subscribe to Firestore stats (allTime) for live rank/prestige updates
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const unsub = subscribeToUserStats(auth.currentUser.uid, (s) =>
      setUserStats({ allTime: s.allTime })
    );
    return () => unsub?.();
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
  const raw = rp.progress.ratio * 100;
  const rankProgressPct =
    rp.progress.pointsToNext > 0
      ? Math.min(99, Math.floor(raw))
      : Math.round(raw);

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
  const eligibleNow = activeCompletion >= 80;
  const patchCtaDismissedForTab = patchCtaDismissed.has(activeTab);
  const showPatchPromo = eligibleNow && !patchCtaDismissedForTab;
  const handlePatchCtaDismiss = () => {
    localStorage.setItem("dgjauth_patch_cta_dismissed_" + activeTab, "1");
    setPatchCtaDismissed((prev) => new Set(prev).add(activeTab));
  };

  return (
    <div className="w-full" data-gramm="false">
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
        <div id="dg-tabsbar" className="sticky top-[var(--dg-navbar-h,60px)] z-40 pt-2 pb-3 bg-background border-b shadow-[0_1px_0_rgba(0,0,0,0.06)] px-3 sm:px-4 min-w-0">
          <TabsList className="flex w-full gap-2 overflow-x-auto overflow-y-hidden pb-1 flex-nowrap rounded-full bg-muted/30 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabTriggerWithFill value="skill" label="Skill" percent={skillCompletion} isActive={activeTab === "skill"} />
            <TabTriggerWithFill value="social" label="Social" percent={socialCompletion} isActive={activeTab === "social"} />
            <TabTriggerWithFill value="collection" label="Collection" percent={collectionCompletion} isActive={activeTab === "collection"} />
          </TabsList>
          {showPatchPromo && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                Patch unlocked
              </span>
              <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                You&apos;re eligible to purchase the {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} patch.
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => router.push("/patches?category=" + activeTab)}
                >
                  View
                </Button>
                <button
                  type="button"
                  onClick={handlePatchCtaDismiss}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {showDevTools && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("[DEV] clicked reset putting mastery", {
                    uid,
                    devUid,
                    enabled: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS,
                  });
                  devResetPuttingMasteryTier();
                }}
              >
                DEV: Reset Putting Mastery Tier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("[DEV] clicked reset all", {
                    uid,
                    devUid,
                    enabled: process.env.NEXT_PUBLIC_SHOW_DEV_TOOLS,
                  });
                  devResetAllTieredCategoryTiers();
                }}
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
                      onIncrementAchievement={(id, delta) => incrementAchievement("skill", id, delta)}
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
                      onIncrementAchievement={(id, delta) => incrementAchievement("social", id, delta)}
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
                      onIncrementAchievement={(id, delta) => incrementAchievement("collection", id, delta)}
                      getCompletionColor={getCompletionColor}
                    />
                  );
                });
              })()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {tierUpMessage && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-lg bg-foreground text-background text-sm shadow-lg animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          {tierUpMessage}
        </div>
      )}
    </div>
  );
}