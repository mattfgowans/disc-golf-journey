/**
 * Rank + Prestige system based on Firestore lifetime points (stats.points.allTime).
 * Prestige resets progress every PRESTIGE_STEP_POINTS; rank is within current prestige band.
 */

export const PRESTIGE_STEP_POINTS = 50000;

export const RANKS = [
  { key: "rookie", name: "Rookie", min: 0 },
  { key: "casual", name: "Casual", min: 500 },
  { key: "regular", name: "Regular", min: 1500 },
  { key: "dedicated", name: "Dedicated", min: 3000 },
  { key: "competitive", name: "Competitive", min: 6000 },
  { key: "advanced", name: "Advanced", min: 10000 },
  { key: "expert", name: "Expert", min: 16000 },
  { key: "elite", name: "Elite", min: 24000 },
  { key: "pro", name: "Pro", min: 33000 },
  { key: "master", name: "Master", min: 43000 },
  { key: "legend", name: "Legend", min: 49000 },
] as const;

export type Rank = (typeof RANKS)[number];

function safePoints(n: number | undefined | null): number {
  if (n == null || typeof n !== "number" || Number.isNaN(n) || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Prestige level (0-based). Each prestige = PRESTIGE_STEP_POINTS.
 */
export function getPrestige(allTimePoints: number): number {
  const pts = safePoints(allTimePoints);
  return Math.floor(pts / PRESTIGE_STEP_POINTS);
}

/**
 * Points within current prestige band (0 to PRESTIGE_STEP_POINTS - 1).
 */
export function getPointsInPrestige(allTimePoints: number): number {
  const pts = safePoints(allTimePoints);
  return pts % PRESTIGE_STEP_POINTS;
}

/**
 * Current rank based on points within prestige band.
 */
export function getRank(pointsInPrestige: number): Rank {
  const pts = safePoints(pointsInPrestige);
  let rank: Rank = RANKS[0];
  for (const r of RANKS) {
    if (pts >= r.min) rank = r;
  }
  return rank;
}

/**
 * Next rank (or null if at Legend).
 */
export function getNextRank(pointsInPrestige: number): Rank | null {
  const pts = safePoints(pointsInPrestige);
  const current = getRank(pts);
  const idx = RANKS.findIndex((r) => r.key === current.key);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

export type RankProgress = {
  ratio: number;
  pointsToNext: number;
  current: Rank;
  nextAt: number;
  currentMin: number;
  bandSize: number;
  nextRank: Rank | null;
};

export function getRankProgress(pointsInPrestige: number): RankProgress {
  const pts = safePoints(pointsInPrestige);
  const current = getRank(pts);
  const nextRank = getNextRank(pts);

  if (!nextRank) {
    const currentMin = current.min;
    const bandSize = PRESTIGE_STEP_POINTS - currentMin;
    const pointsToNext = bandSize - (pts - currentMin);
    return {
      ratio: 1,
      pointsToNext,
      current,
      nextAt: PRESTIGE_STEP_POINTS,
      currentMin,
      bandSize,
      nextRank: null,
    };
  }

  const currentMin = current.min;
  const nextAt = nextRank.min;
  const bandSize = nextAt - currentMin;
  const pointsInBand = pts - currentMin;
  const pointsToNext = bandSize - pointsInBand;
  const ratio = bandSize > 0 ? Math.min(1, Math.max(0, pointsInBand / bandSize)) : 1;

  return {
    ratio,
    pointsToNext,
    current,
    nextAt,
    currentMin,
    bandSize,
    nextRank,
  };
}

export type RankAndPrestige = {
  allTimePoints: number;
  prestige: number;
  pointsInPrestige: number;
  rank: Rank;
  progress: RankProgress;
};

export function getRankAndPrestige(allTimePoints: number): RankAndPrestige {
  const pts = safePoints(allTimePoints);
  const prestige = getPrestige(pts);
  const pointsInPrestige = getPointsInPrestige(pts);
  const rank = getRank(pointsInPrestige);
  const progress = getRankProgress(pointsInPrestige);

  return {
    allTimePoints: pts,
    prestige,
    pointsInPrestige,
    rank,
    progress,
  };
}

if (process.env.NODE_ENV !== "production") {
  const tests = [500, 3000, 20000, 60000];
  console.log("[ranks] getRankAndPrestige tests:", tests);
  for (const pts of tests) {
    console.log(`  ${pts}:`, getRankAndPrestige(pts));
  }
}
