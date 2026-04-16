"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/layout/page-wrapper";

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

function getActiveTabCompletion(
  activeTab: string,
  skillPct: number,
  socialPct: number,
  collectionPct: number
): { label: string; pct: number } {
  const pct = Math.round(Math.min(100, Math.max(0,
    activeTab === "skill" ? skillPct :
    activeTab === "social" ? socialPct :
    collectionPct
  )));
  const label = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  return { label, pct };
}

function getProgressFillClass(pct: number): string {
  const clamped = Math.min(100, Math.max(0, pct));
  if (clamped === 100) return "bg-emerald-500/35 shadow-[0_0_0_6px_rgba(16,185,129,0.08)]";
  if (clamped >= 61) return "bg-emerald-500/25";
  if (clamped >= 26) return "bg-slate-900/25";
  return "bg-slate-900/15";
}

export default function DashboardPage() {
  return <DashboardInner />;
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
    tierUnlockPulse,
    clearTierUpMessage,
    devResetPuttingMasteryTier,
    devResetAllTieredCategoryTiers,
    getUserCategoryTierIndex,
    aceCelebratingId,
    aceCelebrationPhase,
  } = useAchievements(ACHIEVEMENTS_CATALOG);

  const uid = auth.currentUser?.uid ?? "(no user)";

  const router = useRouter();
  const searchParams = useSearchParams();
  const [openSections, setOpenSections] = useState(getInitialOpenSections);
  const [activeTab, setActiveTab] = useState(getInitialActiveTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl && ["skill", "social", "collection"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const [viewedTierByCategoryId, setViewedTierByCategoryId] = useState<Record<string, number>>({});
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
  const [hasCompletedFirstAchievement, setHasCompletedFirstAchievement] = useState(false);
  const [showFirstBonus, setShowFirstBonus] = useState(false);
  const [showLeaderboardPrompt, setShowLeaderboardPrompt] = useState(false);

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

  const allTimePoints = userStats?.allTime ?? 0;

  useEffect(() => {
    if (allTimePoints > 0) {
      setHasCompletedFirstAchievement(true);
    }
  }, [allTimePoints]);

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

  const getAchievementsForCompletion = (achievements: Achievement[]) =>
    achievements.filter((achievement) => achievement.id !== "ace_counter_lifetime");

  // Calculate completion percentage for a specific set of achievements
  const getCategoryCompletion = (achievements: Achievement[]) => {
    const completionAchievements = getAchievementsForCompletion(achievements);
    const total = completionAchievements.length;
    if (total === 0) return 0;
    const totalFraction = completionAchievements.reduce((sum, a) => sum + getAchievementCompletionFraction(a), 0);
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

    const visibleTierDefs = tierDefs.filter(
      (def) =>
        isGatedVisible(def as any, effectiveById as any) &&
        !(categoryId === "round-milestones" && def.id === "round_counter_lifetime")
    );
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
      categoryId,
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
  const getCategoryAchievements = (
    category: keyof Achievements,
    subcategory: string,
    selectedTierIndex?: number
  ) => {
    // Filter by subcategory for all categories
    const filtered = currentAchievements[category].filter(
      (achievement) => achievement.subcategory === subcategory
    );

    // Tiered category cards: show only achievements in the active tier (preserve tier-defined order).
    const categoryId = filtered.find((a) => typeof (a as any).categoryId === "string")?.categoryId as
      | string
      | undefined;
    if (categoryId && isTieredCategoryId(categoryId)) {
      const activeTierIndex = getUserCategoryTierIndex(categoryId);
      const tierIndex =
        typeof selectedTierIndex === "number" ? selectedTierIndex : activeTierIndex;
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
    const achievements = getAchievementsForCompletion(achievementsForUI[category]);
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
  const isNewUser = allTimePoints === 0;
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
  // Single source of truth for sticky section header position.
  // If dashboard chrome spacing changes (navbar, tabs, progress row, patch promo/mask),
  // retune this number here only.
  const sectionStickyTop = 168;
  const handlePatchCtaDismiss = () => {
    localStorage.setItem("dgjauth_patch_cta_dismissed_" + activeTab, "1");
    setPatchCtaDismissed((prev) => new Set(prev).add(activeTab));
  };

  return (
    <PageWrapper>
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

      <main className="min-h-svh pb-24">
        <div className="mx-auto w-full max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-0">
            {/* Header: tabs + progress bar (does not scroll) */}
            <div className="sticky top-[61px] z-50 isolate border-b border-border/60 bg-background shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              <div className="absolute inset-0 bg-background" aria-hidden="true" />
              <div className="relative z-10">
                <div id="dg-top-chrome" className="min-w-0 py-1.5">
                <div className="relative w-full">
            <TabsList className="relative grid h-11 w-full grid-cols-3 gap-1 rounded-full bg-muted/60 p-1 shadow-sm ring-1 ring-black/5">
              <TabsTrigger
              value="skill"
              className="relative z-10 flex h-full items-center justify-center rounded-full border-0 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background focus-visible:outline-none focus-visible:ring-0"
            >
              Skill
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="relative z-10 flex h-full items-center justify-center rounded-full border-0 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background focus-visible:outline-none focus-visible:ring-0"
            >
              Social
            </TabsTrigger>
            <TabsTrigger
              value="collection"
              className="relative z-10 flex h-full items-center justify-center rounded-full border-0 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background focus-visible:outline-none focus-visible:ring-0"
            >
              Collection
            </TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-1.5 w-full">
            {(() => {
              const { label, pct } = getActiveTabCompletion(activeTab, skillCompletion, socialCompletion, collectionCompletion);
              return (
                <div className="flex items-center gap-3 rounded-xl bg-muted/70 px-3 py-2 ring-1 ring-black/5">
                  <span className="w-16 text-xs font-medium text-foreground/80">{label}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className={cn(
                        "absolute left-0 top-0 h-full rounded-full transition-[width,background-color] duration-300",
                        getProgressFillClass(pct)
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums text-foreground/80">{pct}%</span>
                </div>
              );
            })()}
          </div>
          {showPatchPromo && (
            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 ring-1 ring-black/5">
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
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-100 hover:bg-muted hover:text-foreground active:scale-95"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
                </div>
                <div className="h-3 bg-background" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-1.5 pb-6">
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

              {isNewUser && (
                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-5 shadow-sm transition-all">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    Welcome to Disc Golf Journey
                  </h2>

                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Start your progress by completing your first achievement.
                  </p>

                  <button
                    onClick={() => {
                      setActiveTab("social");
                      if (typeof window !== "undefined") {
                        localStorage.setItem("achievementActiveTab", "social");
                      }

                      setOpenSections((prev) => ({
                        ...prev,
                        communityEngagement: true,
                      }));

                      setTimeout(() => {
                        const el = document.getElementById("onboarding-start-card");
                        if (el) {
                          const yOffset = -240;
                          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

                          window.scrollTo({
                            top: y,
                            behavior: "smooth",
                          });
                        }
                      }, 500);
                    }}
                    className="w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background transition-all duration-100 hover:opacity-90 active:scale-95"
                  >
                    Start Your Journey
                  </button>
                </div>
              )}

              {showDevTools && (
                <div className="mt-4 border-t border-border/50 pt-3">
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

              <TabsContent value="skill" className="mt-0">
          <div className="mt-5 space-y-4">
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
                  const categoryId = tierInfo?.categoryId;
                  const activeTierIndex = tierInfo?.tierIndex ?? 0;
                  const viewedTierIndex =
                    categoryId && typeof viewedTierByCategoryId[categoryId] === "number"
                      ? viewedTierByCategoryId[categoryId]
                      : activeTierIndex;

                  const selectedTierIndex = viewedTierIndex;
                  const isTierViewOnly = selectedTierIndex > activeTierIndex;

                  const canViewPreviousTier = selectedTierIndex > 0;
                  const canViewNextTier = selectedTierIndex < activeTierIndex;
                  const canJumpToCurrentTier = selectedTierIndex !== activeTierIndex;
                  const achievements = getCategoryAchievements("skill", section.key, selectedTierIndex);
                  const completion = getCategoryCompletion(achievements);
                  return (
                    <AchievementSection
                      key={section.key}
                      category="skill"
                      subcategory={section.key}
                      title={section.title}
                      sectionKey={sectionKey}
                      achievements={achievements}
                      stickyTop={sectionStickyTop}
                      viewedTierIndex={selectedTierIndex}
                      activeTierIndex={activeTierIndex}
                      isTierViewOnly={!!isTierViewOnly}
                      onSelectTier={
                        categoryId
                          ? (nextTier: number) =>
                              setViewedTierByCategoryId((prev) => ({
                                ...prev,
                                [categoryId]: nextTier,
                              }))
                          : undefined
                      }
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
                      onToggleAchievement={(id) => {
                        // FIRST ACHIEVEMENT BONUS
                        if (!hasCompletedFirstAchievement) {
                          setHasCompletedFirstAchievement(true);

                          setShowFirstBonus(true);

                          setTimeout(() => {
                            setShowFirstBonus(false);
                          }, 2000);
                        }

                        toggleAchievementWithCelebration("skill", id);
                      }}
                      onIncrementAchievement={(id, delta) => incrementAchievement("skill", id, delta)}
                      getCompletionColor={getCompletionColor}
                      tierUnlockPulse={tierUnlockPulse}
                    />
                  );
                });
              })()}
          </div>
        </TabsContent>
        <TabsContent value="social" className="mt-0">
          <div className="mt-5 space-y-4">
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
                  const categoryId = tierInfo?.categoryId;
                  const activeTierIndex = tierInfo?.tierIndex ?? 0;
                  const viewedTierIndex =
                    categoryId && typeof viewedTierByCategoryId[categoryId] === "number"
                      ? viewedTierByCategoryId[categoryId]
                      : activeTierIndex;

                  const selectedTierIndex = viewedTierIndex;
                  const isTierViewOnly = selectedTierIndex > activeTierIndex;

                  const canViewPreviousTier = selectedTierIndex > 0;
                  const canViewNextTier = selectedTierIndex < activeTierIndex;
                  const canJumpToCurrentTier = selectedTierIndex !== activeTierIndex;
                  const achievements = getCategoryAchievements("social", section.key, selectedTierIndex);
                  const completion = getCategoryCompletion(achievements);
                  return (
                    <AchievementSection
                      key={section.key}
                      category="social"
                      subcategory={section.key}
                      title={section.title}
                      sectionKey={sectionKey}
                      achievements={achievements}
                      stickyTop={sectionStickyTop}
                      viewedTierIndex={selectedTierIndex}
                      activeTierIndex={activeTierIndex}
                      isTierViewOnly={!!isTierViewOnly}
                      onSelectTier={
                        categoryId
                          ? (nextTier: number) =>
                              setViewedTierByCategoryId((prev) => ({
                                ...prev,
                                [categoryId]: nextTier,
                              }))
                          : undefined
                      }
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
                      onToggleAchievement={(id) => {
                        // FIRST ACHIEVEMENT BONUS
                        if (!hasCompletedFirstAchievement) {
                          setHasCompletedFirstAchievement(true);

                          setShowFirstBonus(true);

                          setTimeout(() => {
                            setShowFirstBonus(false);
                          }, 2000);
                        }

                        const completingOnboardingStart =
                          id === "onboarding_start" &&
                          (() => {
                            const ach = currentAchievements.social.find((a) => a.id === id);
                            return !!ach && ach.kind !== "counter" && !ach.isCompleted;
                          })();

                        toggleAchievementWithCelebration("social", id);

                        if (completingOnboardingStart) {
                          setTimeout(() => {
                            setShowLeaderboardPrompt(true);
                          }, 800);
                        }
                      }}
                      onIncrementAchievement={(id, delta) => incrementAchievement("social", id, delta)}
                      getCompletionColor={getCompletionColor}
                      tierUnlockPulse={tierUnlockPulse}
                    />
                  );
                });
              })()}
          </div>
        </TabsContent>
        <TabsContent value="collection" className="mt-0">
          <div className="mt-5 space-y-4">
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
                  const categoryId = tierInfo?.categoryId;
                  const activeTierIndex = tierInfo?.tierIndex ?? 0;
                  const viewedTierIndex =
                    categoryId && typeof viewedTierByCategoryId[categoryId] === "number"
                      ? viewedTierByCategoryId[categoryId]
                      : activeTierIndex;

                  const selectedTierIndex = viewedTierIndex;
                  const isTierViewOnly = selectedTierIndex > activeTierIndex;

                  const canViewPreviousTier = selectedTierIndex > 0;
                  const canViewNextTier = selectedTierIndex < activeTierIndex;
                  const canJumpToCurrentTier = selectedTierIndex !== activeTierIndex;
                  const achievements = getCategoryAchievements("collection", section.key, selectedTierIndex);
                  const completion = getCategoryCompletion(achievements);
                  return (
                    <AchievementSection
                      key={section.key}
                      category="collection"
                      subcategory={section.key}
                      title={section.title}
                      sectionKey={sectionKey}
                      achievements={achievements}
                      stickyTop={sectionStickyTop}
                      viewedTierIndex={selectedTierIndex}
                      activeTierIndex={activeTierIndex}
                      isTierViewOnly={!!isTierViewOnly}
                      onSelectTier={
                        categoryId
                          ? (nextTier: number) =>
                              setViewedTierByCategoryId((prev) => ({
                                ...prev,
                                [categoryId]: nextTier,
                              }))
                          : undefined
                      }
                      tierInfo={tierInfo}
                      effectiveById={effectiveById}
                      allAchievements={allAchievements}
                      newlyRevealedIds={newlyRevealedIds}
                      revealPulseParentIds={revealPulseParentIds}
                      celebratingParentId={celebratingParentId}
                      completion={completion}
                      isOpen={openSections[sectionKey]}
                      onToggle={() => toggleSection(sectionKey)}
                      onToggleAchievement={(id) => {
                        // FIRST ACHIEVEMENT BONUS
                        if (!hasCompletedFirstAchievement) {
                          setHasCompletedFirstAchievement(true);

                          setShowFirstBonus(true);

                          setTimeout(() => {
                            setShowFirstBonus(false);
                          }, 2000);
                        }

                        toggleAchievementWithCelebration("collection", id);
                      }}
                      onIncrementAchievement={(id, delta) => incrementAchievement("collection", id, delta)}
                      getCompletionColor={getCompletionColor}
                      tierUnlockPulse={tierUnlockPulse}
                    />
                  );
                });
              })()}
          </div>
        </TabsContent>
            </div>
          </Tabs>
        </div>

      </main>
      {tierUpMessage && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-lg bg-foreground text-background text-sm shadow-lg animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          {tierUpMessage}
        </div>
      )}
      {showFirstBonus && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
          <div className="bg-white text-black px-6 py-3 rounded-xl shadow-xl border border-black/10 text-base font-semibold animate-[bonusPop_0.5s_ease-out]">
            +100 First Achievement Bonus
          </div>
        </div>
      )}
      {showLeaderboardPrompt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white text-black px-6 py-4 rounded-xl shadow-xl border border-black/10 text-center max-w-xs">
            <p className="text-sm font-medium mb-3">
              You&apos;re now on the leaderboard, take a look! 👀
            </p>
            <button
              type="button"
              onClick={() => {
                setShowLeaderboardPrompt(false);
                router.push("/leaderboard");
              }}
              className="w-full rounded-lg bg-black py-2 text-sm font-medium text-white transition-all duration-100 active:scale-95"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
    </PageWrapper>
  );
}