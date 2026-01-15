"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAchievements, type Achievement, type Achievements } from "@/lib/useAchievements";
import { useAuth } from "@/lib/firebase-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievements";
import { StatsHeader } from "@/components/dashboard/stats-header";

// Rank system - similar to video game ranking
const RANK_TIERS = [
  { name: "Beginner", minPoints: 0, color: "from-gray-400 to-gray-600" },
  { name: "Novice", minPoints: 100, color: "from-green-400 to-green-600" },
  { name: "Intermediate", minPoints: 300, color: "from-blue-400 to-blue-600" },
  { name: "Advanced", minPoints: 600, color: "from-purple-400 to-purple-600" },
  { name: "Expert", minPoints: 1000, color: "from-orange-400 to-orange-600" },
  { name: "Master", minPoints: 1500, color: "from-red-400 to-red-600" },
  { name: "Legend", minPoints: 2500, color: "from-yellow-300 to-yellow-500" },
] as const;

// Section configuration for all achievement categories
const SECTIONS = {
  skill: [
    { key: "puttingMastery", title: "Putting Mastery" },
    { key: "distanceControl", title: "Distance Control" },
    { key: "specialtyShots", title: "Specialty Shots" },
    { key: "scoringAchievements", title: "Scoring Achievements" },
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

export default function DashboardPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { achievements, loading: achievementsLoading, toggleAchievement } = useAchievements(ACHIEVEMENTS_CATALOG);
  // Load saved state from localStorage on mount
  const getInitialOpenSections = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('achievementOpenSections');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved openSections:', e);
        }
      }
    }
    return {
    puttingMastery: false,
    distanceControl: false,
    scoringAchievements: false,
    specialtyShots: false,
    communityEngagement: false,
    teachingLeadership: false,
    competitionEvents: false,
    mediaContent: false,
    goodSamaritan: false,
    discEssentials: true,
    discMilestones: true,
    equipmentAccessories: true,
    specialDiscs: false,
    courseExplorer: false,
    roundMilestones: false
    };
  };

  const getInitialActiveTab = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('achievementActiveTab');
      return saved || 'skill';
    }
    return 'skill';
  };

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

  // Show loading state
  if (authLoading || achievementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in to track your achievements</h2>
        <p className="text-gray-600 mb-6">
          Sign in with Google to save your progress and track your disc golf journey.
        </p>
        <Button onClick={signInWithGoogle} size="lg">
          Sign in with Google
        </Button>
      </div>
    );
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev: typeof openSections) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Reusable AchievementSection component
  const AchievementSection = ({
    category,
    subcategory,
    title,
  }: {
    category: keyof Achievements;
    subcategory: string;
    title: string;
  }) => {
    const sectionKey = subcategory as keyof typeof openSections;
    const achievements = getCategoryAchievements(category, subcategory);
    const completion = getCategoryCompletion(achievements);

    return (
      <Collapsible open={openSections[sectionKey]}>
        <div className="sticky top-[305px] md:top-[252px] z-0 bg-gradient-to-r from-emerald-400 to-teal-500 border-b shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer relative"
            style={{ outline: "none", border: "none", background: "none" }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <span className={cn(
                "text-sm font-semibold text-white",
                getCompletionColor(completion)
              )}>
                ({Math.round(completion)}%)
              </span>
            </div>
            <ChevronDown className={`h-6 w-6 text-white transform transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <CollapsibleContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 mt-2">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                {...achievement}
                onToggle={() => toggleAchievement(category, achievement.id)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Calculate completion percentage for a specific set of achievements
  const getCategoryCompletion = (achievements: Achievement[]) => {
    const total = achievements.length;
    if (total === 0) return 0;
    const completed = achievements.filter(a => a.isCompleted).length;
    return (completed / total) * 100;
  };

  // Get achievements for a specific category and subcategory
  const getCategoryAchievements = (category: keyof Achievements, subcategory: string) => {
    // Filter by subcategory for all categories
      const filtered = currentAchievements[category].filter(achievement => achievement.subcategory === subcategory);
      return filtered;
  };


  // Calculate completion percentages for each category
  const getCompletionPercentage = (category: keyof Achievements) => {
    const totalAchievements = currentAchievements[category].length;
    if (totalAchievements === 0) return 0;
    const completedAchievements = currentAchievements[category].filter(a => a.isCompleted).length;
    return (completedAchievements / totalAchievements) * 100;
  };

  const skillCompletion = getCompletionPercentage("skill");
  const socialCompletion = getCompletionPercentage("social");
  const collectionCompletion = getCompletionPercentage("collection");

  // Calculate total points earned
  const getTotalPoints = () => {
    const allAchievements = [...currentAchievements.skill, ...currentAchievements.social, ...currentAchievements.collection];
    return allAchievements
      .filter(achievement => achievement.isCompleted)
      .reduce((total, achievement) => total + (achievement.points ?? 0), 0);
  };

  const totalPoints = getTotalPoints();

  const getCurrentRank = () => {
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (totalPoints >= RANK_TIERS[i].minPoints) {
        return RANK_TIERS[i];
      }
    }
    return RANK_TIERS[0];
  };

  const getNextRank = () => {
    const currentRank = getCurrentRank();
    const currentIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);
    if (currentIndex < RANK_TIERS.length - 1) {
      return RANK_TIERS[currentIndex + 1];
    }
    return null; // Already at max rank
  };

  const getRankProgress = () => {
    const currentRank = getCurrentRank();
    const nextRank = getNextRank();
    
    if (!nextRank) {
      return 100; // Max rank reached
    }

    const pointsInCurrentTier = totalPoints - currentRank.minPoints;
    const pointsNeededForNext = nextRank.minPoints - currentRank.minPoints;
    const progress = (pointsInCurrentTier / pointsNeededForNext) * 100;
    
    return Math.min(100, Math.max(0, progress));
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  const rankProgress = getRankProgress();

  // Calculate daily streak (simplified - counts unique completion days)
  const getCurrentStreak = () => {
    const completedAchievements = [...currentAchievements.skill, ...currentAchievements.social, ...currentAchievements.collection]
      .filter(a => a.isCompleted && a.completedDate);

    if (completedAchievements.length === 0) return 0;

    // Group by date and count unique days
    const uniqueDays = new Set(
      completedAchievements.map(a =>
        new Date(a.completedDate!).toDateString()
      )
    );

    return uniqueDays.size;
  };

  const currentStreak = getCurrentStreak();


  const getProgressBackground = (value: number) => {
    let color;
    if (value === 0) color = "rgb(156, 163, 175)";
    else if (value <= 25) color = "rgb(239, 68, 68)";
    else if (value <= 60) color = "rgb(234, 179, 8)";
    else if (value <= 99) color = "rgb(22, 163, 74)";
    else color = "rgb(59, 130, 246)";

    return `linear-gradient(90deg, ${color} 0%, ${color} ${value}%, transparent ${value}%, transparent 100%)`;
  };

  const getCompletionColor = (value: number) => {
    if (value === 0) return "text-gray-400";
    if (value <= 25) return "text-red-500";
    if (value <= 60) return "text-yellow-500";
    if (value <= 99) return "text-green-600";
    return "text-blue-500";
  };

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
              {SECTIONS.skill.map((section) => (
                <AchievementSection
                  key={section.key}
                  category="skill"
                  subcategory={section.key}
                  title={section.title}
                      />
                    ))}
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
              {SECTIONS.social.map((section) => (
                <AchievementSection
                  key={section.key}
                  category="social"
                  subcategory={section.key}
                  title={section.title}
                      />
                    ))}
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
              {SECTIONS.collection.map((section) => (
                <AchievementSection
                  key={section.key}
                  category="collection"
                  subcategory={section.key}
                  title={section.title}
                      />
                    ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}