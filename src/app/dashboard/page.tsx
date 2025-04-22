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
    {
      id: "skill-37",
      title: "Chain Reaction",
      description: "Hit chains on 5 consecutive putts in a round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-38",
      title: "Straddle Star",
      description: "Make 3 straddle putts in one round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-39",
      title: "Jump Putt Pro",
      description: "Make a jump putt from outside circle 1",
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
    {
      id: "skill-37",
      title: "Chain Reaction",
      description: "Hit chains on 5 consecutive putts in a round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-38",
      title: "Straddle Star",
      description: "Make 3 straddle putts in one round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-39",
      title: "Jump Putt Pro",
      description: "Make a jump putt from outside circle 1",
      category: "skill",
      isCompleted: false,
    },

    // Distance Control (continuing)
    {
      id: "skill-40",
      title: "Hyzer Flip Hero",
      description: "Execute a perfect hyzer flip that lands within 10 feet",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-41",
      title: "Flex Master",
      description: "Birdie a hole after throwing a forehand or backhand flex shot",
      category: "skill",
      isCompleted: false,
    },

    // Specialty Shots (continuing)
    {
      id: "skill-42",
      title: "Wind Warrior",
      description: "Successfully birdie a hole in 20+ mph winds",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-43",
      title: "Ambidextrous Ace",
      description: "Make a throw with your non-dominant hand that lands within 10 feet",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-44",
      title: "Thumber",
      description: "Successfully execute a thumber shot",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-45",
      title: "Forehand Finesse",
      description: "Card 3 birdies in one round using only forehand throws",
      category: "skill",
      isCompleted: false,
    },

    // Scoring Achievements (continuing)
    {
      id: "skill-46",
      title: "Scramble Master",
      description: "Save par from 3 different lies off the fairway in one round",
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
    {
      id: "social-22",
      title: "Disc Trader",
      description: "Participate in your first disc swap event (in person or online)",
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
    {
      id: "collection-45",
      title: "Practice Setup",
      description: "Own a personal practice basket",
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
    {
      id: "collection-28",
      title: "Glow Getter",
      description: "Add a glow-in-the-dark disc to your collection",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-29",
      title: "Vintage Collector",
      description: "Own a disc that's over 20 years old",
      category: "collection",
      isCompleted: false,
    },

    // COURSE EXPLORER
    {
      id: "collection-31",
      title: "Course Sampler",
      description: "Play at 5 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-32",
      title: "Course Enthusiast",
      description: "Play at 10 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-33",
      title: "Course Adventurer",
      description: "Play at 25 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-34",
      title: "Course Century",
      description: "Play at 50 unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-35",
      title: "Course Explorer",
      description: "Play at 100+ unique courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-36",
      title: "State's Best",
      description: "Play the #1 rated course in your state",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-37",
      title: "National Treasure",
      description: "Play the #1 rated course in your country",
      category: "collection",
      isCompleted: false,
    },

    // ROUND MILESTONES
    {
      id: "collection-38",
      title: "Dedicated Player",
      description: "Play 10 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-39",
      title: "Regular Player",
      description: "Play 25 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-40",
      title: "Committed Player",
      description: "Play 50 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-41",
      title: "Century Player",
      description: "Play 100 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-42",
      title: "Veteran Player",
      description: "Play 250 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-43",
      title: "Elite Player",
      description: "Play 500 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-44",
      title: "Disc Golf Legend",
      description: "Play 1000+ rounds of disc golf",
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
    courseExplorer: false,
    roundMilestones: false
  });

  const toggleAchievement = (category: keyof Achievements, id: string) => {
    setAchievements((prev) => ({
      ...prev,
      [category]: prev[category].map((achievement) => {
        if (achievement.id === id) {
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
    puttingMastery: { start: 0, end: 11 },
    distanceControl: { start: 11, end: 21 },
    scoringAchievements: { start: 21, end: 35 },
    specialtyShots: { start: 35, end: 45 },
  };

  // Category ranges for social achievements
  const socialCategories = {
    communityEngagement: { start: 0, end: 7 },
    teachingLeadership: { start: 7, end: 11 },
    competitionEvents: { start: 11, end: 17 },
    mediaContent: { start: 17, end: 22 }
  };

  // Category ranges for collection achievements
  const collectionCategories = {
    discEssentials: { start: 0, end: 6 },
    discMilestones: { start: 6, end: 13 },
    equipmentAccessories: { start: 13, end: 22 },
    specialDiscs: { start: 22, end: 31 },
    courseExplorer: { start: 31, end: 38 },
    roundMilestones: { start: 38, end: 45 }
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
      <Tabs defaultValue="skill" className="w-full">
        <div className="sticky top-16 bg-background/80 backdrop-blur-sm z-40 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skill">Skill</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skill">
          <div className="sticky top-[104px] bg-background/80 backdrop-blur-sm z-30 pb-2 border-b">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <ProgressRing percentage={skillCompletion} size={80} strokeWidth={6} />
                  <p className="text-sm text-muted-foreground max-w-[160px]">
                    {qualifiesForPatch(skillCompletion) 
                      ? "Patch Unlocked! 🎉" 
                      : `${Math.round(80 - skillCompletion)}% to Patch`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="space-y-4">
              {/* Putting Mastery Section */}
              <Collapsible open={openSections.puttingMastery}>
                <CollapsibleTrigger 
                  onClick={() => toggleSection('puttingMastery')}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Putting Mastery</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.puttingMastery.start, skillCategories.puttingMastery.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Distance Control</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.distanceControl.start, skillCategories.distanceControl.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Scoring Achievements</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.scoringAchievements.start, skillCategories.scoringAchievements.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Specialty Shots</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("skill", skillCategories.specialtyShots.start, skillCategories.specialtyShots.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
          </div>
        </TabsContent>
        <TabsContent value="social">
          <div className="sticky top-[104px] bg-background/80 backdrop-blur-sm z-30 pb-2 border-b">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <ProgressRing percentage={socialCompletion} size={80} strokeWidth={6} />
                  <p className="text-sm text-muted-foreground max-w-[160px]">
                    {qualifiesForPatch(socialCompletion)
                      ? "Patch Unlocked! 🎉"
                      : `${Math.round(80 - socialCompletion)}% to Patch`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="space-y-4">
              {/* Community Engagement Section */}
              <Collapsible open={openSections.communityEngagement}>
                <CollapsibleTrigger 
                  onClick={() => toggleSection('communityEngagement')}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Community Engagement</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("social", socialCategories.communityEngagement.start, socialCategories.communityEngagement.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Teaching & Leadership</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("social", socialCategories.teachingLeadership.start, socialCategories.teachingLeadership.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Competition & Events</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("social", socialCategories.competitionEvents.start, socialCategories.competitionEvents.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Media & Content</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("social", socialCategories.mediaContent.start, socialCategories.mediaContent.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
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
          </div>
        </TabsContent>
        <TabsContent value="collection">
          <div className="sticky top-[104px] bg-background/80 backdrop-blur-sm z-30 pb-2 border-b">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <ProgressRing percentage={collectionCompletion} size={80} strokeWidth={6} />
                  <p className="text-sm text-muted-foreground max-w-[160px]">
                    {qualifiesForPatch(collectionCompletion)
                      ? "Patch Unlocked! 🎉"
                      : `${Math.round(80 - collectionCompletion)}% to Patch`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="space-y-4">
              {/* Disc Essentials Section */}
              <Collapsible open={openSections.discEssentials}>
                <CollapsibleTrigger 
                  onClick={() => toggleSection('discEssentials')}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Disc Essentials</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end)))}%)
                      </span>
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.discEssentials ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {getCategoryAchievements("collection", collectionCategories.discEssentials.start, collectionCategories.discEssentials.end).map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        {...achievement}
                        onToggle={() => toggleAchievement("collection", achievement.id)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Disc Collection Milestones Section */}
              <Collapsible open={openSections.discMilestones}>
                <CollapsibleTrigger 
                  onClick={() => toggleSection('discMilestones')}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Disc Collection Milestones</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end)))}%)
                      </span>
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.discMilestones ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {getCategoryAchievements("collection", collectionCategories.discMilestones.start, collectionCategories.discMilestones.end).map((achievement) => (
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Equipment & Accessories</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end)))}%)
                      </span>
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.equipmentAccessories ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {getCategoryAchievements("collection", collectionCategories.equipmentAccessories.start, collectionCategories.equipmentAccessories.end).map((achievement) => (
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Special Discs</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end)))}%)
                      </span>
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.specialDiscs ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {getCategoryAchievements("collection", collectionCategories.specialDiscs.start, collectionCategories.specialDiscs.end).map((achievement) => (
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
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Course Explorer</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end)))}%)
                      </span>
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.courseExplorer ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {getCategoryAchievements("collection", collectionCategories.courseExplorer.start, collectionCategories.courseExplorer.end).map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        {...achievement}
                        onToggle={() => toggleAchievement("collection", achievement.id)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Round Milestones Section */}
              <Collapsible open={openSections.roundMilestones}>
                <CollapsibleTrigger 
                  onClick={() => toggleSection('roundMilestones')}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.roundMilestones.start, collectionCategories.roundMilestones.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Round Milestones</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.roundMilestones.start, collectionCategories.roundMilestones.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("collection", collectionCategories.roundMilestones.start, collectionCategories.roundMilestones.end)))}%)
                      </span>
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.roundMilestones ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {getCategoryAchievements("collection", collectionCategories.roundMilestones.start, collectionCategories.roundMilestones.end).map((achievement) => (
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
        
        