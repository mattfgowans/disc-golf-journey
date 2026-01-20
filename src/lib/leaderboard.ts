import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  points: number;
  rank: number;
  updatedAt?: string;
}

export type LeaderboardPeriod = "weekly" | "monthly" | "yearly" | "allTime";

// Generate period keys
export function getCurrentPeriodKey(period: LeaderboardPeriod): string {
  const now = new Date();

  switch (period) {
    case "weekly":
      // Calculate Monday of the current week (local time)
      const monday = new Date(now);
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), subtract 6 to get Monday
      monday.setDate(now.getDate() - daysToSubtract);
      monday.setHours(0, 0, 0, 0); // Set to midnight local time

      const mondayYear = monday.getFullYear();
      const mondayMonth = String(monday.getMonth() + 1).padStart(2, '0');
      const mondayDay = String(monday.getDate()).padStart(2, '0');
      return `weekly_${mondayYear}-${mondayMonth}-${mondayDay}`;

    case "monthly":
      return `monthly_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    case "yearly":
      return `yearly_${now.getFullYear()}`;

    case "allTime":
      return "allTime";

    default:
      throw new Error(`Unknown period: ${period}`);
  }
}

// Get leaderboard entries for a period
export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const periodKey = getCurrentPeriodKey(period);
  const leaderboardRef = collection(db, "leaderboards", periodKey, "entries");

  const q = query(leaderboardRef, orderBy("points", "desc"), limit(50));
  const snapshot = await getDocs(q);

  const entries: LeaderboardEntry[] = [];
  let rank = 1;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    entries.push({
      uid: docSnap.id,
      displayName: data.displayName || "Anonymous",
      username: data.username,
      photoURL: data.photoURL,
      points: data.points || 0,
      rank: rank++,
      updatedAt: data.updatedAt,
    });
  }

  return entries;
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