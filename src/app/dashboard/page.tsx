"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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
    {
      id: "3",
      title: "Team Player",
      description: "Play a round with 3 or more players",
      category: "social",
      isCompleted: false,
    },
    {
      id: "4",
      title: "Tournament Rookie",
      description: "Participate in your first tournament",
      category: "social",
      isCompleted: false,
    },
  ],
  collection: [
    {
      id: "5",
      title: "Disc Collector",
      description: "Own 10 different discs",
      category: "collection",
      isCompleted: false,
    },
    {
      id: "6",
      title: "Course Explorer",
      description: "Play 5 different courses",
      category: "collection",
      isCompleted: false,
    },
  ],
};

export default function DashboardPage() {
  const [achievements, setAchievements] = useState(sampleAchievements);
  const [openSections, setOpenSections] = useState({
    puttingMastery: true,
    distanceControl: true,
    scoringAchievements: true,
    specialtyShots: true
  });

  const toggleAchievement = (category: keyof Achievements, id: string) => {
    setAchievements((prev) => ({
      ...prev,
      [category]: prev[category].map((achievement) =>
        achievement.id === id
          ? { ...achievement, isCompleted: !achievement.isCompleted }
          : achievement
      ),
    }));
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Your Achievements</h1>
      
      <Tabs defaultValue="skill" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skill">Skill</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>
        <TabsContent value="skill">
          <div className="space-y-4">
            {/* Putting Mastery Section */}
            <Collapsible open={openSections.puttingMastery}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('puttingMastery')}
                className="flex items-center justify-between w-full"
              >
                <h2 className="text-2xl font-bold">Putting Mastery</h2>
                <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.puttingMastery ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(0, 8).map((achievement) => (
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
                className="flex items-center justify-between w-full"
              >
                <h2 className="text-2xl font-bold">Distance Control</h2>
                <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.distanceControl ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(8, 16).map((achievement) => (
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
                className="flex items-center justify-between w-full"
              >
                <h2 className="text-2xl font-bold">Scoring Achievements</h2>
                <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.scoringAchievements ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(16, 29).map((achievement) => (
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
                className="flex items-center justify-between w-full"
              >
                <h2 className="text-2xl font-bold">Specialty Shots</h2>
                <ChevronDown className={`h-6 w-6 transform transition-transform ${openSections.specialtyShots ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {achievements.skill.slice(29).map((achievement) => (
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.social.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                {...achievement}
                onToggle={() => toggleAchievement("social", achievement.id)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="collection">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.collection.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                {...achievement}
                onToggle={() => toggleAchievement("collection", achievement.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
        
        