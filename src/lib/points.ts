"use client";

import { Achievement } from "./useAchievements";
import { getWeeklyKey } from "./time";
import { isAchievementDisabled } from "./disabledAchievements";
import { getCatalogPoints } from "@/data/achievements";

const ACE_COUNTER_ID = "ace_counter_lifetime";
const ROUND_COUNTER_ID = "round_counter_lifetime";
const ROUND_POINTS_PER_ROUND = 10;

export interface PointTotals {
  allTime: number;
  week: number;
  month: number;
  year: number;
}

export interface PeriodKeys {
  weeklyKey: string;
  monthlyKey: string;
  yearlyKey: string;
}

// Legacy week key calculation (Sunday-starting weeks)
// Kept for backward compatibility with existing weekly leaderboard data
export function getLegacyWeekKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

// Generate period keys for a given date
export function getWeekKey(date: Date): string {
  return getWeeklyKey(date);
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getYearKey(date: Date): string {
  return `${date.getFullYear()}`;
}

export function getPeriodKeys(date: Date = new Date()): PeriodKeys {
  return {
    weeklyKey: `weekly_${getWeekKey(date)}`,
    monthlyKey: `monthly_${getMonthKey(date)}`,
    yearlyKey: `yearly_${getYearKey(date)}`,
  };
}

// Compute point totals from achievements, bucketing by completion date
export function computePointTotals(achievements: Achievement[]): PointTotals {
  const now = new Date();
  const currentWeek = getWeekKey(now); // Now uses ISO weeks (Monday start, Denver timezone)
  const currentMonth = getMonthKey(now);
  const currentYear = getYearKey(now);
  const currentPeriodKeys = getPeriodKeys(now);

  let allTime = 0;
  let week = 0;
  let month = 0;
  let year = 0;

  for (const achievement of achievements) {
    if (isAchievementDisabled(achievement.id)) continue;

    const basePoints = getCatalogPoints(achievement.id);

    // Special-case: lifetime ace counter awards points per ace (progress), not just once at completion.
    if (achievement.id === ACE_COUNTER_ID && achievement.kind === "counter") {
      const aceCount = typeof achievement.progress === "number" ? achievement.progress : 0;
      const points = aceCount * basePoints;

      allTime += points;

      let completionDate: Date;
      if (achievement.completedDate) {
        if (typeof achievement.completedDate === "string") {
          completionDate = new Date(achievement.completedDate);
        } else {
          completionDate = achievement.completedDate.toDate();
        }
      } else {
        completionDate = now;
      }

      if (getWeekKey(completionDate) === currentWeek) {
        week += points;
      }
      if (getMonthKey(completionDate) === currentMonth) {
        month += points;
      }
      if (getYearKey(completionDate) === currentYear) {
        year += points;
      }

      continue;
    }

    if (achievement.id === ROUND_COUNTER_ID && achievement.kind === "counter") {
      const roundScoring = achievement.roundScoring;
      const allTimeEarnedRounds =
        typeof roundScoring?.allTimeEarnedRounds === "number" ? roundScoring.allTimeEarnedRounds : 0;
      const weeklyEarnedRounds =
        typeof roundScoring?.weekly?.[currentPeriodKeys.weeklyKey] === "number"
          ? roundScoring.weekly[currentPeriodKeys.weeklyKey]
          : 0;
      const monthlyEarnedRounds =
        typeof roundScoring?.monthly?.[currentPeriodKeys.monthlyKey] === "number"
          ? roundScoring.monthly[currentPeriodKeys.monthlyKey]
          : 0;
      const yearlyEarnedRounds =
        typeof roundScoring?.yearly?.[currentPeriodKeys.yearlyKey] === "number"
          ? roundScoring.yearly[currentPeriodKeys.yearlyKey]
          : 0;

      allTime += allTimeEarnedRounds * ROUND_POINTS_PER_ROUND;
      week += weeklyEarnedRounds * ROUND_POINTS_PER_ROUND;
      month += monthlyEarnedRounds * ROUND_POINTS_PER_ROUND;
      year += yearlyEarnedRounds * ROUND_POINTS_PER_ROUND;

      continue;
    }

    // Default behavior for all other achievements: only count completed achievements once.
    if (!achievement.isCompleted) continue;

    const points = basePoints;
    allTime += points;

    let completionDate: Date;
    if (achievement.completedDate) {
      if (typeof achievement.completedDate === "string") {
        completionDate = new Date(achievement.completedDate);
      } else {
        completionDate = achievement.completedDate.toDate();
      }
    } else {
      completionDate = now;
    }

    if (getWeekKey(completionDate) === currentWeek) {
      week += points;
    }
    if (getMonthKey(completionDate) === currentMonth) {
      month += points;
    }
    if (getYearKey(completionDate) === currentYear) {
      year += points;
    }
  }

  return { allTime, week, month, year };
}

export interface TabPointTotals {
  skillAllTime: number;
  socialAllTime: number;
  collectionAllTime: number;
}

// Compute per-tab allTime point totals. Counters count only when fully completed,
// except the lifetime ace and round counters which award points per recorded total.
export function computeTabPointTotals(achievementsByTab: {
  skill: Achievement[];
  social: Achievement[];
  collection: Achievement[];
}): TabPointTotals {
  const sum = (arr: Achievement[]) => {
    let total = 0;
    for (const a of arr) {
      if (isAchievementDisabled(a.id)) continue;

      const basePoints = getCatalogPoints(a.id);

      if (a.id === ACE_COUNTER_ID && a.kind === "counter") {
        const aceCount = typeof a.progress === "number" ? a.progress : 0;
        total += aceCount * basePoints;
        continue;
      }

      if (a.id === ROUND_COUNTER_ID && a.kind === "counter") {
        const allTimeEarnedRounds =
          typeof a.roundScoring?.allTimeEarnedRounds === "number"
            ? a.roundScoring.allTimeEarnedRounds
            : 0;
        total += allTimeEarnedRounds * ROUND_POINTS_PER_ROUND;
        continue;
      }

      const isCompleted =
        a.kind === "counter"
          ? (a.progress ?? 0) >= (a.target ?? 0)
          : !!a.isCompleted;

      if (!isCompleted) continue;
      total += basePoints;
    }
    return total;
  };
  return {
    skillAllTime: sum(achievementsByTab.skill),
    socialAllTime: sum(achievementsByTab.social),
    collectionAllTime: sum(achievementsByTab.collection),
  };
}