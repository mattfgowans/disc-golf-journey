"use client";

import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  points: number;
  rank: number;
}

export type LeaderboardPeriod = "daily" | "weekly" | "yearly";

// Generate period keys
export function getCurrentPeriodKey(period: LeaderboardPeriod): string {
  const now = new Date();

  switch (period) {
    case "daily":
      return `daily_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    case "weekly":
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `weekly_${year}-W${String(weekNumber).padStart(2, '0')}`;

    case "yearly":
      return `yearly_${now.getFullYear()}`;

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
    });
  }

  return entries;
}

// Get user's current stats (for personal dashboard)
export async function getUserStats(uid: string) {
  try {
    const statsDoc = await getDoc(doc(db, "users", uid, "stats", "points"));
    if (statsDoc.exists()) {
      return statsDoc.data();
    }
    return {
      pointsToday: 0,
      pointsWeek: 0,
      pointsYear: 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      pointsToday: 0,
      pointsWeek: 0,
      pointsYear: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

// Development helper: Add sample leaderboard entries
export async function addSampleLeaderboardEntries() {
  const sampleUsers = [
    { uid: "sample1", displayName: "Alice Johnson", points: 250 },
    { uid: "sample2", displayName: "Bob Smith", points: 220 },
    { uid: "sample3", displayName: "Charlie Brown", points: 200 },
    { uid: "sample4", displayName: "Diana Prince", points: 180 },
    { uid: "sample5", displayName: "Eve Wilson", points: 160 },
  ];

  const periodKey = getCurrentPeriodKey("daily");

  for (const user of sampleUsers) {
    await setDoc(doc(db, "leaderboards", periodKey, "entries", user.uid), {
      displayName: user.displayName,
      points: user.points,
      updatedAt: new Date().toISOString(),
    });
  }

  console.log("Sample leaderboard entries added");
}