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
    // PUTTING MASTERY (0-20)
    {
      id: "skill-0",
      title: "Practice Makes Perfect",
      description: "Finish your first practice putting session",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-1",
      title: "Circle One Success",
      description: "Make your first C1 putt (within 33 ft)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-2",
      title: "Circle One Specialist",
      description: "Make 3 C1 putts in a single round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-3",
      title: "Long Range Sniper",
      description: "Make your first C2 putt (33-66 ft)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-4",
      title: "Distance Demon",
      description: "Make 3 C2 putts in a single round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-5",
      title: "Chain Reaction",
      description: "Hit chains on 5 consecutive putts in a round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-6",
      title: "Straddle Star",
      description: "Make 3 straddle putts in one round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-7",
      title: "Jump Putt Pro",
      description: "Make a jump putt from outside circle 1",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-8",
      title: "Spin Doctor",
      description: "Make a putt using the turbo putt technique",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-9",
      title: "Three-Point Shot",
      description: "Make a putt using the Vinnie basketball technique",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-10",
      title: "Money Shot",
      description: "Make your first throw in from 66+ ft (not off the tee shot)",
      category: "skill",
      isCompleted: false,
    },

    // DISTANCE CONTROL (20-40)
    {
      id: "skill-11",
      title: "Noodle Arm",
      description: "Record your first throw over 100 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-12",
      title: "Growing Pains",
      description: "Record your first throw over 200 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-13",
      title: "Big Arm Energy",
      description: "Record your first throw over 300 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-14",
      title: "Cannon Arm",
      description: "Record your first throw over 400 ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-15",
      title: "Rocket Launcher",
      description: "Record your first throw over 500+ ft",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-16",
      title: "Precision Landing",
      description: "Park your first hole off a drive (landing within 10 ft)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-17",
      title: "Parking Attendant",
      description: "Park 3 holes in one round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-18",
      title: "Distance Control",
      description: "Land within 20 feet of target on 3 consecutive holes",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-19",
      title: "Wind Warrior",
      description: "Successfully birdie a hole in 20+ mph winds",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-20",
      title: "Hyzer Flip Hero",
      description: "Execute a perfect hyzer flip that lands within 10 feet",
      category: "skill",
      isCompleted: false,
    },

    // SPECIALTY SHOTS (40-60)
    {
      id: "skill-21",
      title: "Thumbs Up",
      description: "Birdie a hole while throwing a thumber off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-22",
      title: "Grenade Launcher",
      description: "Birdie while throwing a grenade off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-23",
      title: "Tomahawk Triumph",
      description: "Birdie with a tomahawk off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-24",
      title: "Rolling Thunder",
      description: "Birdie with a roller off tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-25",
      title: "Water Walker",
      description: "Birdie while skipping a disc off the water off the tee",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-26",
      title: "Roller Derby",
      description: "Execute a successful roller shot",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-27",
      title: "Scramble Master",
      description: "Save par from 3 different lies off the fairway in one round",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-28",
      title: "Thumber",
      description: "Execute a successful thumber shot",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-29",
      title: "Forehand Finesse",
      description: "Execute a successful forehand shot",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-30",
      title: "Flex Master",
      description: "Execute a successful flex shot",
      category: "skill",
      isCompleted: false,
    },

    // SCORING ACHIEVEMENTS (60-80)
    {
      id: "skill-31",
      title: "First Par",
      description: "Score your first par on a hole",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-32",
      title: "Birdie Breakthrough",
      description: "Score your first birdie",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-33",
      title: "Eagle Eye",
      description: "Score your first eagle",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-34",
      title: "Ace Race",
      description: "Hit your first ace (hole in one)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-35",
      title: "Albatross Alert",
      description: "Card your first albatross",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-36",
      title: "Bird Watching",
      description: "Record your first turkey (3 birdies in a row)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-37",
      title: "Under Achiever",
      description: "Score under par at a course",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-38",
      title: "Disc Golf Domination",
      description: "Go double digits under par",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-39",
      title: "Zero Mistakes",
      description: "Record a perfect round (birdied every hole)",
      category: "skill",
      isCompleted: false,
    },
    {
      id: "skill-40",
      title: "Damage Control",
      description: "Save par after a bad drive (going OB)",
      category: "skill",
      isCompleted: false,
    }
  ],
  social: [
    // COMMUNITY ENGAGEMENT (0-20)
    {
      id: "social-0",
      title: "League Night Rookie",
      description: "Participate in your first league night",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-1",
      title: "Club Member",
      description: "Join your local disc golf club",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-2",
      title: "Course Steward",
      description: "Help maintain or improve a local course",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-3",
      title: "Cleanup Crew",
      description: "Participate in three course cleanup events",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-4",
      title: "Tree Guardian",
      description: "Help plant trees, or maintain landscaping at a course",
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
      id: "social-7",
      title: "Social Butterfly",
      description: "Play with 10 different people",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-8",
      title: "Disc Trader",
      description: "Participate in your first disc swap event in person or online",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-9",
      title: "Disc Golf Buddy",
      description: "Play five rounds with the same person",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-10",
      title: "Regular Partner",
      description: "Play 10 rounds with the same person",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-11",
      title: "Dedicated Duo",
      description: "Play 25 rounds with the same person",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-12",
      title: "Dynamic Partnership",
      description: "Play 50 rounds with the same person",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-13",
      title: "Disc Golf Soulmates",
      description: "Play 100 rounds with the same person",
      category: "social",
      isCompleted: false,
    },

    // TEACHING & LEADERSHIP (20-40)
    {
      id: "social-14",
      title: "Disc Golf Mentor",
      description: "Teach someone how to play disc golf",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-15",
      title: "Local Guide",
      description: "Show a new player around your local course",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-16",
      title: "Youth Mentor",
      description: "Coach youth players in disc golf",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-17",
      title: "School Program",
      description: "Help introduce disc golf to a school program",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-18",
      title: "Next Generation",
      description: "Donate discs to youth programs or schools",
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
    {
      id: "social-21",
      title: "Club Board Member",
      description: "Serve on a local disc golf club board",
      category: "social",
      isCompleted: false,
    },

    // COMPETITION & EVENTS (40-60)
    {
      id: "social-22",
      title: "Tournament First Timer",
      description: "Play in your first tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-23",
      title: "Scorekeeper",
      description: "Keep score for a tournament card",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-24",
      title: "Spotter",
      description: "Volunteer as a spotter in a tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-25",
      title: "Registration Desk",
      description: "Help run a tournament registration/check-in",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-26",
      title: "Victory Lap",
      description: "Win your first tournament or league night",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-27",
      title: "Division Champ",
      description: "Win your division in a tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-28",
      title: "Dynamic Duo",
      description: "Participate in a doubles tournament",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-29",
      title: "Ace Hunter",
      description: "Participate in an ace race event",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-30",
      title: "Night Owl",
      description: "Play a glow round",
      category: "social",
      isCompleted: false,
    },

    // MEDIA & CONTENT (60-80)
    {
      id: "social-31",
      title: "Course Critic",
      description: "Review a course on UDisc or a similar platform",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-32",
      title: "Content Creator",
      description: "Create disc golf content for others",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-33",
      title: "Pro Tour Fan",
      description: "Start watching day-later content of the pro tour on JomezPro or another channel",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-34",
      title: "Live Coverage Enthusiast",
      description: "Purchase a DGN subscription to watch live pro tour coverage",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-35",
      title: "Pro Connection",
      description: "Meet a professional disc golfer",
      category: "social",
      isCompleted: false,
    },

    // GOOD SAMARITAN (80-100)
    {
      id: "social-36",
      title: "Lost and Found",
      description: "Return your first lost disc to its owner",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-37",
      title: "Disc Detective",
      description: "Return 5 discs to their owners",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-38",
      title: "Disc Guardian",
      description: "Return 10 discs to their owners",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-39",
      title: "Disc Recovery Expert",
      description: "Return 25 discs to their owners",
      category: "social",
      isCompleted: false,
    },
    {
      id: "social-40",
      title: "Disc Return Legend",
      description: "Return 50+ discs to their owners",
      category: "social",
      isCompleted: false,
    }
  ],
  collection: [
    // DISC ESSENTIALS (0-20)
    {
      id: "collection-0",
      title: "First Disc",
      description: "Purchase your first disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-1",
      title: "Putting Pioneer",
      description: "Add your first putter to your collection",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-2",
      title: "Mid Range Master",
      description: "Add your first midrange disc to your collection",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-3",
      title: "Distance Driver",
      description: "Add your first distance driver to your collection",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-4",
      title: "Mini Marker",
      description: "Get your first mini marker",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-5",
      title: "Disc Carrier",
      description: "Get your first disc golf bag",
      category: "collection",
      isCompleted: false,
    },

    // DISC MILESTONES (20-40)
    {
      id: "collection-6",
      title: "Starting Five",
      description: "Own five different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-7",
      title: "Double Digits",
      description: "Own 10 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-8",
      title: "Disc Enthusiast",
      description: "Own 25 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-9",
      title: "Disc Collector",
      description: "Own 50 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-10",
      title: "Century Club",
      description: "Own 100 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-11",
      title: "Brand Explorer",
      description: "Own discs from 5 different manufacturers",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-12",
      title: "Plastic Connoisseur",
      description: "Own discs in 5 different plastic types",
      category: "collection",
      isCompleted: false,
    },

    // EQUIPMENT & ACCESSORIES (40-60)
    {
      id: "collection-13",
      title: "Bag Upgrade",
      description: "Upgrade to a larger disc golf bag",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-14",
      title: "Cart Commander",
      description: "Purchase a disc golf cart",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-15",
      title: "Rescue Ready",
      description: "Get your first disc retriever",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-16",
      title: "Towel Time",
      description: "Get your first disc golf towel",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-17",
      title: "Grip Enhancement",
      description: "Get your first whale sack or other equivalent chalk bag",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-18",
      title: "Shelf Collection",
      description: "Own five different discs that you never use",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-19",
      title: "Aspirational Purchase",
      description: "Buy a disc that's way too fast for your arm speed",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-20",
      title: "Practice Setup",
      description: "Purchase a practice basket",
      category: "collection",
      isCompleted: false,
    },

    // SPECIAL DISCS (60-80)
    {
      id: "collection-21",
      title: "Tour Series",
      description: "Purchase a tour series disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-22",
      title: "Signature Series",
      description: "Purchase a signature series disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-23",
      title: "First Run",
      description: "Purchase a first run disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-24",
      title: "Limited Release",
      description: "Purchase a limited edition disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-25",
      title: "Pro Support",
      description: "Purchase a tour series disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-26",
      title: "Custom Art",
      description: "Purchase a disc with a custom stamp",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-27",
      title: "Tournament Treasure",
      description: "Get a disc from a tournament",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-28",
      title: "Pro Signature",
      description: "Get a disc signed by a professional",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-29",
      title: "Personal Touch",
      description: "Design your own custom disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-30",
      title: "Dye Artist",
      description: "Dye your first disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-31",
      title: "Dye Merchant",
      description: "Sell a dyed disc",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-32",
      title: "Glow Getter",
      description: "Add a glow-in-the-dark disc to your collection",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-33",
      title: "Vintage Collector",
      description: "Own a disc that's over 20 years old",
      category: "collection",
      isCompleted: false,
    },

    // COURSE EXPLORER (80-100)
    {
      id: "collection-34",
      title: "Course Explorer",
      description: "Play 5 different courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-35",
      title: "Course Adventurer",
      description: "Play 10 different courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-36",
      title: "Course Conqueror",
      description: "Play 25 different courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-37",
      title: "Course Legend",
      description: "Play 50 different courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-38",
      title: "Course Explorer",
      description: "Play 100+ different courses",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-39",
      title: "State's Best",
      description: "Play the #1 rated course in your state",
      category: "collection",
      isCompleted: false,
    },
    { id: "collection-40",
      title: "Top of the State",
      description: "play the top 5 courses in your state",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-41",
      title: "National Treasure",
      description: "Play the #1 rated course in the country",
      category: "collection",
      isCompleted: false,
    },

    // ROUND MILESTONES (100-120)
    {
      id: "collection-42",
      title: "First Round",
      description: "Complete your first round of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-43",
      title: "Dedicated Player",
      description: "Play 10 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-44",
      title: "Experienced Player",
      description: "Play 50 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-45",
      title: "Seasoned Veteran",
      description: "Play 100 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-46",
      title: "Veteran Player",
      description: "Play 250 rounds of disc golf",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "collection-47",
      title: "Elite Player",
      description: "Play 500+ rounds of disc golf",
      category: "collection",
      isCompleted: false,
    }
  ]
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
    goodSamaritan: false,
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
    puttingMastery: { start: 0, end: 10 },
    distanceControl: { start: 11, end: 20 },
    specialtyShots: { start: 21, end: 30 },
    scoringAchievements: { start: 31, end: 40 }
  };

  // Category ranges for social achievements
  const socialCategories = {
    communityEngagement: { start: 0, end: 14 },
    teachingLeadership: { start: 14, end: 22 },
    competitionEvents: { start: 22, end: 31 },
    mediaContent: { start: 31, end: 36 },
    goodSamaritan: { start: 36, end: 41 }
  };

  // Category ranges for collection achievements
  const collectionCategories = {
    discEssentials: { start: 0, end: 6 },
    discMilestones: { start: 6, end: 13 },
    equipmentAccessories: { start: 13, end: 21 },
    specialDiscs: { start: 21, end: 34 },
    courseExplorer: { start: 34, end: 42 },
    roundMilestones: { start: 42, end: 48 }
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
        <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-40 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skill">Skill</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skill">
          <div className="sticky top-[104px] bg-background z-30 pb-2 border-b">
            <div className="flex justify-center bg-background">
              <div className="text-center bg-background p-2">
                <div className="flex items-center gap-2 bg-background">
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
            </div>
          </div>
        </TabsContent>
        <TabsContent value="social">
          <div className="sticky top-[104px] bg-background z-30 pb-2 border-b">
            <div className="flex justify-center bg-background">
              <div className="text-center bg-background p-2">
                <div className="flex items-center gap-2 bg-background">
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

              {/* Media Content Section */}
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

              {/* Good Samaritan Section */}
              <Collapsible open={openSections.goodSamaritan}>
                <CollapsibleTrigger 
                  onClick={() => toggleSection('goodSamaritan')}
                  className="relative w-full"
                >
                  <div className="absolute inset-0 z-0 rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-full opacity-10 transition-all duration-300"
                      style={{ 
                        background: getProgressBackground(getCategoryCompletion(getCategoryAchievements("social", socialCategories.goodSamaritan.start, socialCategories.goodSamaritan.end)))
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full p-4 rounded-lg transition-colors cursor-pointer z-10 relative">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">Good Samaritan</h2>
                      <span className={cn(
                        "text-sm font-semibold",
                        getCompletionColor(getCategoryCompletion(getCategoryAchievements("social", socialCategories.goodSamaritan.start, socialCategories.goodSamaritan.end)))
                      )}>
                        ({Math.round(getCategoryCompletion(getCategoryAchievements("social", socialCategories.goodSamaritan.start, socialCategories.goodSamaritan.end)))}%)
                      </span>
                      {getCategoryCompletion(getCategoryAchievements("social", socialCategories.goodSamaritan.start, socialCategories.goodSamaritan.end)) === 100 && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </div>
                    <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.goodSamaritan ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {achievements.social.slice(socialCategories.goodSamaritan.start, socialCategories.goodSamaritan.end).map((achievement) => (
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
          <div className="sticky top-[104px] bg-background z-30 pb-2 border-b">
            <div className="flex justify-center bg-background">
              <div className="text-center bg-background p-2">
                <div className="flex items-center gap-2 bg-background">
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