"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements, type Achievement, type Achievements } from "@/lib/useAchievements";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievements";
import { StatsHeader } from "@/components/dashboard/stats-header";
import { AchievementSection } from "@/components/dashboard/achievement-section";
import { RequireAuth } from "@/components/auth/require-auth";
import { auth } from "@/lib/firebase";



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
    <RequireAuth title="Sign in to track your achievements" subtitle="Sign in with Google to save your progress and track your disc golf journey.">
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { achievements, loading: achievementsLoading, toggleAchievement, incrementAchievement } = useAchievements(ACHIEVEMENTS_CATALOG);

  const uid = auth.currentUser?.uid ?? "(no user)";

  useEffect(() => {
    const id = setInterval(() => {
      console.log("[Dashboard] uid=", auth.currentUser?.uid, "achievementsLoading=", achievementsLoading);
    }, 2000);
    return () => clearInterval(id);
  }, [achievementsLoading]);

  const [openSections, setOpenSections] = useState(getInitialOpenSections);
  const [activeTab, setActiveTab] = useState(getInitialActiveTab);

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

  return (
    <div className="container mx-auto py-4" data-gramm="false">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-[100] border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skill">Skill</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skill">
          <StatsHeader
            completionPercentage={skillCompletion}
            totalPoints={totalPoints}
            currentStreak={currentStreak}
            currentRank={currentRank}
            nextRank={nextRank}
            rankProgress={rankProgress}
          />

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
                    completion={completion}
                    isOpen={openSections[sectionKey]}
                    onToggle={() => toggleSection(sectionKey)}
                    onToggleAchievement={(id) => toggleAchievement("skill", id)}
                    onIncrementAchievement={incrementAchievement}
                    getCompletionColor={getCompletionColor}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="social">
          <StatsHeader
            completionPercentage={socialCompletion}
            totalPoints={totalPoints}
            currentStreak={currentStreak}
            currentRank={currentRank}
            nextRank={nextRank}
            rankProgress={rankProgress}
          />

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
                    completion={completion}
                    isOpen={openSections[sectionKey]}
                    onToggle={() => toggleSection(sectionKey)}
                    onToggleAchievement={(id) => toggleAchievement("social", id)}
                    onIncrementAchievement={incrementAchievement}
                    getCompletionColor={getCompletionColor}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="collection">
          <StatsHeader
            completionPercentage={collectionCompletion}
            totalPoints={totalPoints}
            currentStreak={currentStreak}
            currentRank={currentRank}
            nextRank={nextRank}
            rankProgress={rankProgress}
          />

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
                    completion={completion}
                    isOpen={openSections[sectionKey]}
                    onToggle={() => toggleSection(sectionKey)}
                    onToggleAchievement={(id) => toggleAchievement("collection", id)}
                    onIncrementAchievement={incrementAchievement}
                    getCompletionColor={getCompletionColor}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}