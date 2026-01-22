import { ProgressRing } from "@/components/ui/progress-ring";

type RankTier = {
  name: string;
  minPoints: number;
  color: string;
};

interface StatsHeaderProps {
  completionPercentage: number;
  totalPoints: number;
  currentStreak: number;
  currentRank: RankTier;
  nextRank: RankTier | null;
  rankProgress: number;
}

export function StatsHeader({
  completionPercentage,
  totalPoints,
  currentStreak,
  currentRank,
  nextRank,
  rankProgress,
}: StatsHeaderProps) {
  const qualifiesForPatch = (percentage: number) => percentage >= 80;

  return (
    <div className="bg-background border-b w-full">
      <div className="flex flex-col w-full gap-0.5">
        {/* Rank, Points and Days */}
        <div className="flex flex-col md:flex-row gap-1.5 md:gap-2 p-0.5 items-center justify-center">
          {/* Rank Display - Responsive positioning */}
          <div className={`bg-gradient-to-r ${currentRank.color} text-white px-2 py-1 rounded-lg shadow-lg min-w-[140px] w-full md:w-auto md:ml-8`}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-0.5">Rank</div>
            <div className="text-base font-bold mb-0.5">{currentRank.name}</div>
            {nextRank ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{Math.round(rankProgress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className={`bg-white rounded-full h-2 transition-all duration-300`}
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
                <div className="text-xs opacity-90">
                  {nextRank.minPoints - totalPoints} pts to {nextRank.name}
                </div>
              </div>
            ) : (
              <div className="text-xs opacity-90">Max Rank! 🏆</div>
            )}
          </div>
          {/* Points and Days - Centered */}
          <div className="flex gap-1.5 md:gap-2 w-full md:w-auto justify-center">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-lg shadow-lg flex-1 md:flex-none">
              <div className="text-xs font-semibold uppercase tracking-wide">Total Points</div>
              <div className="text-lg font-bold">{totalPoints.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-0.5 rounded-lg shadow-lg flex-1 md:flex-none">
              <div className="text-xs font-semibold uppercase tracking-wide">Active Days</div>
              <div className="text-lg font-bold">{currentStreak}</div>
            </div>
          </div>
        </div>
        {/* Progress Ring */}
        <div className="flex items-center justify-center gap-1.5">
          <ProgressRing percentage={completionPercentage} size={45} strokeWidth={4} />
          <p className="text-sm text-muted-foreground">
            {qualifiesForPatch(completionPercentage)
              ? "Patch Unlocked! 🎉"
              : `${Math.round(80 - completionPercentage)}% to Patch`}
          </p>
        </div>
      </div>
    </div>
  );
}
