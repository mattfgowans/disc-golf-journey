
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
  secretsDiscoveredCount?: number;
}

export function StatsHeader({
  completionPercentage,
  totalPoints,
  currentStreak,
  currentRank,
  nextRank,
  rankProgress,
  secretsDiscoveredCount = 0,
}: StatsHeaderProps) {
  const qualifiesForPatch = (percentage: number) => percentage >= 80;

  return (
    <div className="bg-background border-b border-border/60 w-full">
      <div className="flex flex-col w-full px-4 py-2 gap-2">
        {/* Rank and Points */}
        <div className="flex gap-2 items-stretch">
          {/* Rank Display */}
          <div className={`bg-gradient-to-r ${currentRank.color} text-white px-3 py-2 rounded-xl shadow-sm flex-[2]`}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide/relaxed opacity-90">Rank</div>
              <div className="text-base font-semibold leading-none">{currentRank.name}</div>
            </div>
            {nextRank ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-[11px] opacity-90">
                  <span>Progress</span>
                  <span>{Math.round(rankProgress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div
                    className={`bg-white rounded-full h-1 transition-all duration-300`}
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
          {/* Points Display */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-xl shadow-sm flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide/relaxed opacity-90">Total Points</div>
            <div className="text-lg font-semibold leading-none">{totalPoints.toLocaleString()}</div>
          </div>
        </div>
        {/* Secrets discovered */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium">Secrets discovered</span>
          <span className="tabular-nums">{secretsDiscoveredCount}</span>
        </div>
      </div>
    </div>
  );
}
