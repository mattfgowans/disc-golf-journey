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
    <div className="bg-background border-b border-border/60 w-full">
      <div className="flex flex-col w-full px-4 py-3 gap-3">
        {/* Rank, Points and Days */}
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
          {/* Rank Display - Responsive positioning */}
          <div className={`bg-gradient-to-r ${currentRank.color} text-white px-3 py-3 rounded-xl shadow-sm min-h-[92px] w-full md:w-auto md:ml-8`}>
            <div className="text-[11px] font-semibold uppercase tracking-wide/relaxed opacity-90">Rank</div>
            <div className="text-lg font-semibold leading-none">{currentRank.name}</div>
            {nextRank ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-[11px] opacity-90">
                  <span>Progress</span>
                  <span>{Math.round(rankProgress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div 
                    className={`bg-white rounded-full h-1.5 transition-all duration-300`}
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
                <div className="text-[11px] opacity-90">
                  {nextRank.minPoints - totalPoints} pts to {nextRank.name}
                </div>
              </div>
            ) : (
              <div className="text-[11px] opacity-90">Max rank</div>
            )}
          </div>
          {/* Points and Days - Centered */}
          <div className="flex gap-2 w-full md:w-auto md:justify-center">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-3 rounded-xl shadow-sm min-h-[92px] flex-1 md:flex-none">
              <div className="text-[11px] font-semibold uppercase tracking-wide/relaxed opacity-90">Total Points</div>
              <div className="text-xl font-semibold leading-none">{totalPoints.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-3 rounded-xl shadow-sm min-h-[92px] flex-1 md:flex-none">
              <div className="text-[11px] font-semibold uppercase tracking-wide/relaxed opacity-90">Active Days</div>
              <div className="text-xl font-semibold leading-none">{currentStreak}</div>
            </div>
          </div>
        </div>
        {/* Progress Ring */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <ProgressRing percentage={completionPercentage} size={45} strokeWidth={4} />
          <p className="text-sm text-muted-foreground">
            {qualifiesForPatch(completionPercentage)
              ? "Patch unlocked"
              : `${Math.round(80 - completionPercentage)}% to patch`}
          </p>
        </div>
      </div>
    </div>
  );
}
