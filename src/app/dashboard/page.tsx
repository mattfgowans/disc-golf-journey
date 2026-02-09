"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements, type Achievement, type Achievements } from "@/lib/useAchievements";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievements";
import { isUnlocked } from "@/lib/achievementProgress";
import { StatsHeader } from "@/components/dashboard/stats-header";
import { AchievementSection } from "@/components/dashboard/achievement-section";
import { QuickLogSheet } from "@/components/dashboard/quick-log-sheet";
import { RequireAuth } from "@/components/auth/require-auth";
import { auth } from "@/lib/firebase";
import { Plus } from "lucide-react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";



// TODO: Add achievement badges (rarity-based and achievement-specific)

// Rank system - similar to video game ranking
const RANK_TIERS = [
  { name: "Beginner", minPoints: 0, color: "from-gray-400 to-gray-600" },
  { name: "Novice", minPoints: 500, color: "from-green-400 to-green-600" },
  { name: "Intermediate", minPoints: 1000, color: "from-blue-400 to-blue-600" },
  { name: "Advanced", minPoints: 2500, color: "from-purple-400 to-purple-600" },
  { name: "Expert", minPoints: 5000, color: "from-orange-400 to-orange-600" },
  { name: "Master", minPoints: 10000, color: "from-red-400 to-red-600" },
  { name: "Legend", minPoints: 15000, color: "from-yellow-300 to-yellow-500" },
] as const;

// Section configuration for all achievement categories
const SECTIONS = {
  skill: [
    { key: "puttingMastery", title: "Putting Mastery" },
    { key: "distanceControl", title: "Distance Control" },
    { key: "specialtyShots", title: "Specialty Shots" },
    { key: "scoringAchievements", title: "Scoring Achievements" },
    { key: "roundRatings", title: "Round Ratings" },
  ],
  social: [
    { key: "communityEngagement", title: "Community Engagement" },
    { key: "teachingLeadership", title: "Teaching & Leadership" },
    { key: "competitionEvents", title: "Competition & Events" },
    { key: "mediaContent", title: "Media & Content" },
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
function TabTriggerWithFill({ value, label, percent, isActive }: { value: string; label: string; percent: number; isActive: boolean }) {
  const colorClass = getProgressColorClass(percent, isActive);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const fillRounding = getFillRounding(clampedPercent);

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
      <div className="relative z-10 flex min-w-0 items-center justify-between w-full px-1">
        <span className="whitespace-nowrap data-[state=active]:font-semibold">{label}</span>
        <span className="shrink-0 text-[11px] opacity-80 tabular-nums">{Math.round(clampedPercent)}%</span>
      </div>
    </TabsTrigger>
  );
}

function DashboardInner() {
  const { achievements, loading: achievementsLoading, toggleAchievement, newUnlocks, clearNewUnlocks } = useAchievements(ACHIEVEMENTS_CATALOG);

  const uid = auth.currentUser?.uid ?? "(no user)";

  const [openSections, setOpenSections] = useState(getInitialOpenSections);
  const [activeTab, setActiveTab] = useState(getInitialActiveTab);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [recentlyRevealedIds, setRecentlyRevealedIds] = useState<Set<string>>(new Set());
  const [revealPulseParentIds, setRevealPulseParentIds] = useState<Set<string>>(new Set());
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [celebratingParentId, setCelebratingParentId] = useState<string | null>(null);

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

  // Use achievements from Firebase, or fallback to catalog if not loaded yet
  // Only fallback if achievements is null/undefined, not if arrays are empty
  const currentAchievements: Achievements = achievements ?? ACHIEVEMENTS_CATALOG;

  const effectiveById = useMemo(() => {
    const map: Record<string, Achievement> = {};
    for (const cat of ["skill", "social", "collection"] as const) {
      for (const a of currentAchievements[cat]) map[a.id] = a;
    }
    return map;
  }, [currentAchievements]);

  const allAchievements = useMemo(
    () => [
      ...currentAchievements.skill,
      ...currentAchievements.social,
      ...currentAchievements.collection,
    ],
    [currentAchievements]
  );

  const newlyRevealedIds = useMemo(() => {
    const s = new Set<string>([...recentlyRevealedIds]);
    for (const a of newUnlocks) s.add(a.id);
    return s;
  }, [recentlyRevealedIds, newUnlocks]);

  const secretsDiscoveredCount = useMemo(
    () => allAchievements.filter((a) => a.requiresId && isUnlocked(a, effectiveById)).length,
    [allAchievements, effectiveById]
  );

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

  // Get achievements for a specific category and subcategory
  const getCategoryAchievements = (category: keyof Achievements, subcategory: string) => {
    // Filter by subcategory for all categories
      const filtered = currentAchievements[category].filter(achievement => achievement.subcategory === subcategory);
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


  // Calculate completion percentages for each category
  const getCompletionPercentage = (category: keyof Achievements) => {
    const achievements = currentAchievements[category];
    const totalAchievements = achievements.length;
    if (totalAchievements === 0) return 0;
    const totalFraction = achievements.reduce((sum, a) => sum + getAchievementCompletionFraction(a), 0);
    return (totalFraction / totalAchievements) * 100;
  };

  const skillCompletion = getCompletionPercentage("skill");
  const socialCompletion = getCompletionPercentage("social");
  const collectionCompletion = getCompletionPercentage("collection");

  // Calculate total points earned
  const getTotalPoints = () => {
    const allAchievements = [...currentAchievements.skill, ...currentAchievements.social, ...currentAchievements.collection];
    return allAchievements
      .filter(achievement => isAchievementFullyCompleted(achievement))
      .reduce((total, achievement) => total + (achievement.points ?? 0), 0);
  };

  const totalPoints = getTotalPoints();

  // Calculate all rank-related values once
  const calculateRankInfo = () => {
    // Find current rank index
    let currentIndex = 0;
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (totalPoints >= RANK_TIERS[i].minPoints) {
        currentIndex = i;
        break;
      }
    }

    const currentRank = RANK_TIERS[currentIndex];
    const nextRank = currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;
    
    // Calculate progress
    let rankProgress = 100; // Default to max if at highest rank
    if (nextRank) {
    const pointsInCurrentTier = totalPoints - currentRank.minPoints;
    const pointsNeededForNext = nextRank.minPoints - currentRank.minPoints;
      rankProgress = (pointsInCurrentTier / pointsNeededForNext) * 100;
      rankProgress = Math.min(100, Math.max(0, rankProgress));
    }
    
    return { currentRank, nextRank, rankProgress };
  };

  const { currentRank, nextRank, rankProgress } = calculateRankInfo();

  // Calculate daily streak (simplified - counts unique completion days)
  const getCurrentStreak = () => {
    const completedAchievements = [...currentAchievements.skill, ...currentAchievements.social, ...currentAchievements.collection]
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
            <DialogTitle>Secret achievement unlocked!</DialogTitle>
            <DialogDescription>
              Completing an achievement has revealed new goals you can now work toward.
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
            <TabTriggerWithFill value="skill" label="Skill" percent={skillCompletion} isActive={activeTab === "skill"} />
            <TabTriggerWithFill value="social" label="Social" percent={socialCompletion} isActive={activeTab === "social"} />
            <TabTriggerWithFill value="collection" label="Collection" percent={collectionCompletion} isActive={activeTab === "collection"} />
          </TabsList>
        </div>

        <StatsHeader
          completionPercentage={activeCompletion}
          totalPoints={totalPoints}
          currentStreak={currentStreak}
          currentRank={currentRank}
          nextRank={nextRank}
          rankProgress={rankProgress}
          secretsDiscoveredCount={secretsDiscoveredCount}
        />

        <TabsContent value="skill">
          <div className="mt-4">
            <div className="space-y-4">
              {SECTIONS.skill.map((section) => {
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
              })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="social">
          <div className="mt-4">
            <div className="space-y-4">
              {SECTIONS.social.map((section) => {
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
              })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="collection">
          <div className="mt-4">
            <div className="space-y-4">
              {SECTIONS.collection.map((section) => {
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
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        achievements={currentAchievements}
        onToggle={toggleAchievement}
        defaultCategory={activeTab as keyof Achievements}
      />
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