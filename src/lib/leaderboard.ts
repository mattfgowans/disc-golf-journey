import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  startAfter,
  DocumentSnapshot,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { getPeriodKeys } from "./points";

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

// Get leaderboard entries for a period with pagination
export async function getLeaderboard(
  period: LeaderboardPeriod,
  opts?: { pageSize?: number; cursor?: DocumentSnapshot | null }
): Promise<LeaderboardPage> {
  const periodKey = getCurrentPeriodKey(period);
  const pageSize = opts?.pageSize ?? 50;
  const cursor = opts?.cursor ?? null;

  const leaderboardRef = collection(db, "leaderboards", periodKey, "entries");

  let q = query(
    leaderboardRef,
    orderBy("points", "desc"),
    orderBy("updatedAt", "desc"),
    fsLimit(pageSize)
  );

  if (cursor) {
    q = query(q, startAfter(cursor));
  }

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