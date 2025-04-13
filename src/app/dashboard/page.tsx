"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Achievement = {
  id: string;
  title: string;
  description: string;
  category: "skill" | "social" | "collection";
  isCompleted: boolean;
  completedDate?: string;
};

type Achievements = {
  skill: Achievement[];
  social: Achievement[];
  collection: Achievement[];
};

// Sample achievements data (we'll replace this with real data later)
const sampleAchievements: Achievements = {
  skill: [
    // PUTTING MASTERY
    {
      id: "skill-22",
      title: "Circle One Success",
      description: "Make your first C1 putt (within 33 ft)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-23",
      title: "Circle One Specialist",
      description: "Make 3 C1 putts in a single round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-24",
      title: "Long Range Sniper",
      description: "Make your first C2 putt (33-66 ft)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-25",
      title: "Distance Demon",
      description: "Make 3 C2 putts in a single round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-34",
      title: "Scooby Snack",
      description: "Make a putt using the scobber technique",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-35",
      title: "Spin Doctor",
      description: "Make a putt using the turbo putt technique",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-36",
      title: "Three-Point Shot",
      description: "Make a putt using the Vinnie basketball technique",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-21",
      title: "Practice Makes Perfect",
      description: "Finish your first practice putting session",
      category: "skill",
      isCompleted: false,
    },

    // DISTANCE CONTROL
    {
      id: "skill-3",
      title: "Noodle Arm",
      description: "Record your first throw over 100 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-4",
      title: "Growing Pains",
      description: "Record your first throw over 200 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-5",
      title: "Big Arm Energy",
      description: "Record your first throw over 300 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-6",
      title: "Cannon Arm",
      description: "Record your first throw over 400 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-7",
      title: "Rocket Launcher",
      description: "Record your first throw over 500+ ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-26",
      title: "Precision Landing",
      description: "Park your first hole off a drive (landing within 10 ft)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-27",
      title: "Parking Attendant",
      description: "Park 3 holes in one round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-28",
      title: "Money Shot",
      description: "Make your first throw in from 66+ ft (not off the tee shot)",
      category: "skill",
      isCompleted: false,
    },

    // SCORING ACHIEVEMENTS
    {
      id: "1",
      title: "First Par",
      description: "Score par on any hole",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-11",
      title: "Bogey Beginner",
      description: "Card your first bogey",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-10",
      title: "Double Down",
      description: "Card your first double bogey",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-9",
      title: "Triple Trouble",
      description: "Card your first triple bogey",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-8",
      title: "Quad Quest",
      description: "Card your first 4+ over par",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-12",
      title: "Birdie Breakthrough",
      description: "Card your first birdie",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-13",
      title: "Eagle Eye",
      description: "Card your first eagle",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-14",
      title: "Albatross Alert",
      description: "Card your first albatross",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-15",
      title: "Ace Race",
      description: "Card your first ace",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-16",
      title: "Bird Watching",
      description: "Record your first turkey (3 birdies in a row)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-17",
      title: "Under Achiever",
      description: "Score under par at a course",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-18",
      title: "Disc Golf Domination",
      description: "Go double digits under par",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-19",
      title: "Zero Mistakes",
      description: "Record a perfect round (birdied every hole)",
      category: "skill",
      isCompleted: false,
    },

    // SPECIALTY SHOTS
    {
      id: "skill-29",
      title: "Thumbs Up",
      description: "Birdie a hole while throwing a thumber off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-30",
      title: "Grenade Launcher",
      description: "Birdie while throwing a grenade off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-31",
      title: "Tomahawk Triumph",
      description: "Birdie with a tomahawk off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-32",
      title: "Rolling Thunder",
      description: "Birdie with a roller off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-33",
      title: "Water Walker",
      description: "Birdie while skipping a disc off the water off the tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-20",
      title: "Damage Control",
      description: "Save par after a bad drive (going OB)",
      category: "skill",
      isCompleted: false,
    },
  ],
  social: [
    // COMMUNITY ENGAGEMENT
    {
      id: "social-1",
      title: "League Night Rookie",
      description: "Participate in your first league night",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-3",
      title: "Club Member",
      description: "Join your local disc golf club",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-4",
      title: "Course Steward",
      description: "Help maintain or improve a local course",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-5",
      title: "PDGA Official",
      description: "Purchase a PDGA membership and receive your player number",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-6",
      title: "Group Player",
      description: "Play a round with three or more people",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-8",
      title: "Social Butterfly",
      description: "Play with 10 different people",
      category: "social",
      isCompleted: false,
    },

    // TEACHING & LEADERSHIP
    {
      id: "social-7",
      title: "Disc Golf Mentor",
      description: "Teach someone how to play disc golf",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-9",
      title: "Local Guide",
      description: "Show a new player around your local course",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-19",
      title: "Tournament Director",
      description: "Direct or help direct a tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-20",
      title: "League Commissioner",
      description: "Organize a league",
      category: "social",
      isCompleted: false,
    },

    // COMPETITION & EVENTS
    {
      id: "social-2",
      title: "Tournament First-Timer",
      description: "Play in your first tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-10",
      title: "Victory Lap",
      description: "Win your first tournament or league night",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-11",
      title: "Division Champion",
      description: "Win your division in a tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-12",
      title: "Dynamic Duo",
      description: "Participate in a doubles tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-13",
      title: "Ace Hunter",
      description: "Participate in an ace race event",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-18",
      title: "Night Owl",
      description: "Play a round after dark with glow discs",
      category: "social",
      isCompleted: false,
    },

    // MEDIA & CONTENT
    {
      id: "social-14",
      title: "Course Critic",
      description: "Review a course on UDisc or a similar platform",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-15",
      title: "Content Creator",
      description: "Create disc golf content for others",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-16",
      title: "Pro Tour Fan",
      description: "Start watching day-later content of the pro tour on JomezPro or another channel",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-17",
      title: "Live Coverage Enthusiast",
      description: "Purchase a DGN subscription to watch live pro tour coverage",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-21",
      title: "Pro Connection",
      description: "Meet a professional disc golfer",
      category: "social",
      isCompleted: false,
    }
  ],
  collection: [
    // DISC ESSENTIALS
    {
      id: "collection-1",
      title: "First Disc",
      description: "Purchase your first disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-2",
      title: "Putting Pioneer",
      description: "Add your first putter to your collection",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-3",
      title: "Mid-range Master",
      description: "Add your first mid-range disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-4",
      title: "Distance Driver",
      description: "Add your first driver",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-5",
      title: "Mini Marker",
      description: "Get your first mini marker",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-6",
      title: "Disc Carrier",
      description: "Get your first disc golf bag",
      category: "collection",
      isCompleted: false,
    },

    // DISC COLLECTION MILESTONES
    {
      id: "collection-7",
      title: "Starting Five",
      description: "Own five different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-8",
      title: "Double Digits",
      description: "Own 10 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-9",
      title: "Quarter Century",
      description: "Own 25 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-10",
      title: "Nifty Fifty",
      description: "Own 50 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-11",
      title: "Century Club",
      description: "Own over 100 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-12",
      title: "Brand Explorer",
      description: "Own discs from three different manufacturers",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-13",
      title: "Plastic Connoisseur",
      description: "Try discs in three different plastic types",
      category: "collection",
      isCompleted: false,
    },

    // EQUIPMENT & ACCESSORIES
    {
      id: "collection-14",
      title: "Bag Upgrade",
      description: "Upgrade to a larger disc golf bag",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-15",
      title: "Cart Commander",
      description: "Purchase a disc golf cart",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-16",
      title: "Rescue Ready",
      description: "Get your first disc retriever",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-17",
      title: "Towel Time",
      description: "Get your first disc golf towel",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-18",
      title: "Grip Enhancement",
      description: "Get your first whale sack",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-19",
      title: "Shelf Collection",
      description: "Own five different discs that you never use",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-20",
      title: "Aspirational Purchase",
      description: "Buy a disc that's way too fast for your arm speed",
      category: "collection",
      isCompleted: false,
    },

    // SPECIAL DISCS
    {
      id: "collection-21",
      title: "Limited Release",
      description: "Purchase a limited edition disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-22",
      title: "Pro Support",
      description: "Purchase a tour series disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-23",
      title: "Custom Art",
      description: "Purchase a disc with a custom stamp",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-24",
      title: "Tournament Treasure",
      description: "Get a disc from a tournament",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-25",
      title: "Pro Signature",
      description: "Get a disc signed by a pro",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-26",
      title: "Personal Touch",
      description: "Design your own custom disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-27",
      title: "Dye Artist",
      description: "Dye your first disc",
      category: "collection",
      isCompleted: false,
    },

    // COURSE EXPLORER
    {
      id: "collection-28",
      title: "Course Sampler",
      description: "Play at 5 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-29",
      title: "Course Enthusiast",
      description: "Play at 10 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-30",
      title: "Course Adventurer",
      description: "Play at 25 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-31",
      title: "Course Explorer",
      description: "Play at 50 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-32",
      title: "Course Century",
      description: "Play at 100+ unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-33",
      title: "State's Best",
      description: "Play the #1 rated course in your state",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-34",
      title: "National Treasure",
      description: "Play the #1 rated course in your country",
      category: "collection",
      isCompleted: false,
    },
  ],
};

export default function DashboardPage() {
  const [achievements, setAchievements] = useState(sampleAchievements);
  const [openSections, setOpenSections] = useState({
    puttingMastery: false,
    distanceControl: false,
    scoringAchievements: false,
    specialtyShots: false,
    communityEngagement: false,
    teachingLeadership: false,
    competitionEvents: false,
    mediaContent: false,
    discEssentials: false,
    discMilestones: false,
    equipmentAccessories: false,
    specialDiscs: false,
    courseExplorer: false
  });

  const toggleAchievement = (category: keyof Achievements, id: string) => {
    setAchievements((prev) => ({
      ...prev,
      [category]: prev[category].map((achievement) => {
        if (achievement.id === id) {
          // If achievement is not completed, mark it as completed with current timestamp
          // If it's already completed, don't allow uncompleting it
          if (!achievement.isCompleted) {
            return {
              ...achievement,
              isCompleted: true,
              completedDate: new Date().toISOString(),
            };
          }
        }
        return achievement;
      }),
    }));
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate completion percentage for a specific set of achievements
  const getCategoryCompletion = (achievements: Achievement[]) => {
    const total = achievements.length;
    const completed = achievements.filter(a => a.isCompleted).length;
    return (completed / total) * 100;
  };

  // Get achievements for a specific category and range
  const getCategoryAchievements = (category: keyof Achievements, startIndex: number, endIndex: number) => {
    return achievements[category].slice(startIndex, endIndex);
  };

  // Category ranges for skill achievements
  const skillCategories = {
    puttingMastery: { start: 0, end: 8 },
    distanceControl: { start: 8, end: 16 },
    scoringAchievements: { start: 16, end: 29 },
    specialtyShots: { start: 29, end: 35 }
  };

  // Category ranges for social achievements
  const socialCategories = {
    communityEngagement: { start: 0, end: 6 },
    teachingLeadership: { start: 6, end: 10 },
    competitionEvents: { start: 10, end: 16 },
    mediaContent: { start: 16, end: 21 }
  };

  // Category ranges for collection achievements
  const collectionCategories = {
    discEssentials: { start: 0, end: 6 },
    discMilestones: { start: 6, end: 13 },
    equipmentAccessories: { start: 13, end: 20 },
    specialDiscs: { start: 20, end: 27 },
    courseExplorer: { start: 27, end: 34 }
  };

  // Calculate completion percentages for each category
  const getCompletionPercentage = (category: keyof Achievements) => {
    const totalAchievements = achievements[category].length;
    const completedAchievements = achievements[category].filter(a => a.isCompleted).length;
    return (completedAchievements / totalAchievements) * 100;
  };

  const skillCompletion = getCompletionPercentage("skill");
  const socialCompletion = getCompletionPercentage("social");
  const collectionCompletion = getCompletionPercentage("collection");

  // Check if category qualifies for patch
  const qualifiesForPatch = (percentage: number) => percentage >= 80;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Your Achievements</h1>
      
      <Tabs defaultValue="skill" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skill" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <span>Skill</span>
              {qualifiesForPatch(skillCompletion) && (
                <Badge variant="default" className="bg-green-600">
                  Patch Unlocked! 🏆
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="social" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <span>Social</span>
              {qualifiesForPatch(socialCompletion) && (
                <Badge variant="default" className="bg-green-600">
                  Patch Unlocked! 🏆
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="collection" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <span>Collection</span>
              {qualifiesForPatch(collectionCompletion) && (
                <Badge variant="default" className="bg-green-600">
                  Patch Unlocked! 🏆
                </Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="skill">
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <ProgressRing percentage={skillCompletion} />
              <p className="mt-2 text-sm text-muted-foreground">
                {qualifiesForPatch(skillCompletion) 
                  ? "Congratulations! You've unlocked the Skill Patch! 🎉" 
                  : `${Math.round(80 - skillCompletion)}% more to unlock the Skill Patch`}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {/* Putting Mastery Section */}
            <Collapsible open={openSections.puttingMastery}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('puttingMastery')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Putting Mastery</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.puttingMastery ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(skillCategories.puttingMastery.start, skillCategories.puttingMastery.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("skill", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Distance Control Section */}
            <Collapsible open={openSections.distanceControl}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('distanceControl')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Distance Control</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.distanceControl ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(skillCategories.distanceControl.start, skillCategories.distanceControl.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("skill", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Scoring Achievements Section */}
            <Collapsible open={openSections.scoringAchievements}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('scoringAchievements')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Scoring Achievements</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.scoringAchievements ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("skill", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Specialty Shots Section */}
            <Collapsible open={openSections.specialtyShots}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('specialtyShots')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Specialty Shots</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.specialtyShots ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(skillCategories.specialtyShots.start, skillCategories.specialtyShots.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("skill", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>
        <TabsContent value="social">
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <ProgressRing percentage={socialCompletion} />
              <p className="mt-2 text-sm text-muted-foreground">
                {qualifiesForPatch(socialCompletion)
                  ? "Congratulations! You've unlocked the Social Patch! 🎉"
                  : `${Math.round(80 - socialCompletion)}% more to unlock the Social Patch`}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {/* Community Engagement Section */}
            <Collapsible open={openSections.communityEngagement}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('communityEngagement')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Community Engagement</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.communityEngagement ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.social.slice(socialCategories.communityEngagement.start, socialCategories.communityEngagement.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("social", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Teaching & Leadership Section */}
            <Collapsible open={openSections.teachingLeadership}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('teachingLeadership')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Teaching & Leadership</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.teachingLeadership ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.social.slice(socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("social", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Competition & Events Section */}
            <Collapsible open={openSections.competitionEvents}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('competitionEvents')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Competition & Events</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.competitionEvents ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.social.slice(socialCategories.competitionEvents.start, socialCategories.competitionEvents.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("social", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Media & Content Section */}
            <Collapsible open={openSections.mediaContent}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('mediaContent')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Media & Content</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.mediaContent ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.social.slice(socialCategories.mediaContent.start, socialCategories.mediaContent.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("social", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>
        <TabsContent value="collection">
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <ProgressRing percentage={collectionCompletion} />
              <p className="mt-2 text-sm text-muted-foreground">
                {qualifiesForPatch(collectionCompletion)
                  ? "Congratulations! You've unlocked the Collection Patch! 🎉"
                  : `${Math.round(80 - collectionCompletion)}% more to unlock the Collection Patch`}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {/* Disc Essentials Section */}
            <Collapsible open={openSections.discEssentials}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('discEssentials')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Disc Essentials</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.discEssentials ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.collection.slice(collectionCategories.discEssentials.start, collectionCategories.discEssentials.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("collection", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Collection Milestones Section */}
            <Collapsible open={openSections.discMilestones}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('discMilestones')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Collection Milestones</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.discMilestones ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.collection.slice(collectionCategories.discMilestones.start, collectionCategories.discMilestones.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("collection", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Equipment & Accessories Section */}
            <Collapsible open={openSections.equipmentAccessories}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('equipmentAccessories')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Equipment & Accessories</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.equipmentAccessories ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.collection.slice(collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("collection", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Special Discs Section */}
            <Collapsible open={openSections.specialDiscs}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('specialDiscs')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Special Discs</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.specialDiscs ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.collection.slice(collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("collection", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Course Explorer Section */}
            <Collapsible open={openSections.courseExplorer}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('courseExplorer')}
                className="relative w-full"
              >
                <div className="absolute inset-0 z-0">
                  <Progress 
                    value={getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end))} 
                  />
                </div>
                <div className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-secondary/90 transition-colors cursor-pointer z-10 relative">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Course Explorer</h2>
                    <span className={cn(
                      "text-sm",
                      getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end)) === 100
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}>
                      ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end)))}%)
                    </span>
                    {getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end)) === 100 && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.courseExplorer ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.collection.slice(collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end).map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      {...achievement}
                      onToggle={() => toggleAchievement("collection", achievement.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
        
        