import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  startAfter,
  type QueryConstraint,
  DocumentSnapshot,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { getPeriodKeys, getLegacyWeekKey } from "./points";

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  points: number;
  updatedAt?: string;
}

export type LeaderboardPeriod = "weekly" | "monthly" | "yearly" | "allTime";

export type LeaderboardPage = {
  entries: LeaderboardEntry[];
  cursor: DocumentSnapshot | null;
  hasMore: boolean;
};

// Generate period keys
export function getCurrentPeriodKey(period: LeaderboardPeriod): string {
  const periodKeys = getPeriodKeys();

  switch (period) {
    case "weekly":
      return periodKeys.weeklyKey;
    case "monthly":
      return periodKeys.monthlyKey;
    case "yearly":
      return periodKeys.yearlyKey;
    case "allTime":
      return "allTime";
    default:
      throw new Error(`Unknown period: ${period}`);
  }
}

// Helper function to fetch a leaderboard page from a specific period key
async function fetchLeaderboardPage(
  periodKey: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
  previewGuest = false
): Promise<LeaderboardPage> {
  // TEMPORARY: debug empty leaderboard — remove hardcode after verifying period vs data
  console.log("PERIOD USED:", periodKey);
  console.log("QUERY PATH:", `leaderboards/${periodKey}/entries`);
  const leaderboardRef = collection(db, "leaderboards", "allTime", "entries");

  // Single orderBy on `points` avoids a composite index (points + updatedAt).
  const constraints: QueryConstraint[] = [
    orderBy("points", "desc"),
    fsLimit(pageSize),
  ];

  if (!previewGuest) {
    // Only add server-side .where() filters for signed-in contexts.
    // Preview (previewGuest) must stay a pure global query — no where() clauses.
  }

  const q = cursor
    ? query(leaderboardRef, ...constraints, startAfter(cursor))
    : query(leaderboardRef, ...constraints);

  const snapshot = await getDocs(q);

  const entries: LeaderboardEntry[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    entries.push({
      uid: docSnap.id,
      displayName: data.displayName || "Anonymous",
      username: data.username,
      photoURL: data.photoURL,
      points: data.points || 0,
      updatedAt: data.updatedAt,
    });
  }

  const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
  const hasMore = snapshot.size === pageSize;

  return {
    entries,
    cursor: nextCursor,
    hasMore,
  };
}

// Weekly leaderboards use ISO weeks (Monday start) in America/Denver.
// Legacy Sunday-based weekly keys are supported as a read-only fallback
// to preserve existing user data after the rollover logic change.

// Get leaderboard entries for a period with pagination.
// Always reads the global period leaderboard: `leaderboards/{periodKey}/entries` ordered by `points` desc.
// No userId / friends / club filters — those apply only in the UI (LeaderboardTab) after fetch.
// `previewGuest` uses the same query for logged-out preview (global XP ranking only).
export async function getLeaderboard(
  period: LeaderboardPeriod,
  opts?: { pageSize?: number; cursor?: DocumentSnapshot | null; previewGuest?: boolean }
): Promise<LeaderboardPage> {
  const pageSize = opts?.pageSize ?? 50;
  const cursor = opts?.cursor ?? null;
  const previewGuest = opts?.previewGuest ?? false;

  // For weekly leaderboards, implement backward compatibility fallback
  if (period === "weekly") {
    const primaryKey = getCurrentPeriodKey("weekly"); // New ISO week key
    const legacyKey = `weekly_${getLegacyWeekKey(new Date())}`; // Old Sunday-starting key

    // Try primary (new) key first
    const primaryResult = await fetchLeaderboardPage(primaryKey, pageSize, cursor, previewGuest);

    // If primary key has data or we're on a subsequent page, use it
    if (primaryResult.entries.length > 0 || cursor) {
      return primaryResult;
    }

    // If primary key is empty and we're on the first page, try legacy key
    const legacyResult = await fetchLeaderboardPage(legacyKey, pageSize, null, previewGuest);
    return legacyResult;
  }

  // For non-weekly periods, use normal logic
  const periodKey = getCurrentPeriodKey(period);
  return fetchLeaderboardPage(periodKey, pageSize, cursor, previewGuest);
}

// Get user's current stats (for personal dashboard)
export async function getUserStats(uid: string) {
  try {
    const statsDoc = await getDoc(doc(db, "users", uid, "stats", "points"));
    if (statsDoc.exists()) {
      const raw = statsDoc.data() as any;
      return {
        allTime: Number(raw.allTime ?? 0),
        weekly: Number(raw.weekly ?? raw.week ?? 0),
        monthly: Number(raw.monthly ?? raw.month ?? 0),
        yearly: Number(raw.yearly ?? raw.year ?? 0),
        updatedAt: raw.updatedAt ?? new Date().toISOString(),
      };
    }
    return {
      allTime: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      allTime: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

// Subscribe to user stats for live updates (rank/points)
export function subscribeToUserStats(
  uid: string,
  onChange: (stats: { allTime: number }) => void
): () => void {
  const statsRef = doc(db, "users", uid, "stats", "points");
  return onSnapshot(
    statsRef,
    (snap) => {
      if (snap.exists()) {
        const raw = snap.data() as any;
        onChange({ allTime: Number(raw.allTime ?? 0) });
      } else {
        onChange({ allTime: 0 });
      }
    },
    (err) => {
      console.error("subscribeToUserStats error:", err);
      onChange({ allTime: 0 });
    }
  );
}

// Development helper: Add sample leaderboard entries
export async function addSampleLeaderboardEntries() {
  if (process.env.NODE_ENV !== "development") {
    console.warn("addSampleLeaderboardEntries() can only be used in development mode");
    return;
  }
  const sampleUsers = [
    { uid: "sample1", displayName: "Alice Johnson", points: 250 },
    { uid: "sample2", displayName: "Bob Smith", points: 220 },
    { uid: "sample3", displayName: "Charlie Brown", points: 200 },
    { uid: "sample4", displayName: "Diana Prince", points: 180 },
    { uid: "sample5", displayName: "Eve Wilson", points: 160 },
  ];

  const periodKey = getCurrentPeriodKey("weekly");

  for (const user of sampleUsers) {
    await setDoc(doc(db, "leaderboards", periodKey, "entries", user.uid), {
      displayName: user.displayName,
      points: user.points,
      updatedAt: new Date().toISOString(),
    });
  }

  console.log("Sample leaderboard entries added");
}