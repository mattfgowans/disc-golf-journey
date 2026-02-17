import { PRESTIGE_STEP_POINTS } from "@/lib/ranks";

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
  /** Prestige level (0-based). Shown when provided. */
  prestige?: number;
  /** Points needed to reach next rank/prestige. Shown when provided. */
  pointsToNextRank?: number;
  /** Name of next rank. Shown when provided. */
  nextRankName?: string;
  /** Points within current prestige band. Used for "X pts to next Prestige" when at max rank. */
  pointsInPrestige?: number;
}

const PRESTIGE_STEP = PRESTIGE_STEP_POINTS;

export function StatsHeader({
  completionPercentage,
  totalPoints,
  currentStreak,
  currentRank,
  nextRank,
  rankProgress,
  prestige,
  pointsToNextRank,
  nextRankName,
  pointsInPrestige = 0,
}: StatsHeaderProps) {
  const ptsToNextDisplay =
    pointsToNextRank != null
      ? pointsToNextRank
      : nextRank
        ? nextRank.minPoints - totalPoints
        : null;
  const nextLabel = nextRankName ?? nextRank?.name ?? null;
  const atMaxRank = !nextRank && prestige != null;

  return (
    <div className="bg-background border-b border-border/60 w-full">
      <div className="flex flex-col w-full px-4 py-2 gap-2">
        {/* Rank and Points */}
        <div className="flex gap-2 items-stretch">
          {/* Rank Display */}
          <div className={`bg-gradient-to-r ${currentRank.color} text-white px-3 py-2 rounded-xl shadow-sm flex-[2]`}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide/relaxed opacity-90">
                {prestige != null ? `Prestige ${prestige} • Rank` : "Rank"}
              </div>
              <div className="text-base font-semibold leading-none">{currentRank.name}</div>
            </div>
            {nextRank || (nextLabel && ptsToNextDisplay != null) ? (
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
                  {nextLabel
                    ? `${ptsToNextDisplay} pts to ${nextLabel}`
                    : null}
                </div>
              </div>
            ) : atMaxRank ? (
              <div className="mt-2 space-y-1.5">
                <div className="text-[11px] opacity-90">Max rank</div>
                <div className="text-[11px] opacity-90">
                  {PRESTIGE_STEP - pointsInPrestige} pts to next Prestige
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
      </div>
    </div>
  );
}
