"use client";

import { Achievement } from "./useAchievements";

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

// Generate period keys for a given date
export function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
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
  const currentWeek = getWeekKey(now);
  const currentMonth = getMonthKey(now);
  const currentYear = getYearKey(now);

  let allTime = 0;
  let week = 0;
  let month = 0;
  let year = 0;

  for (const achievement of achievements) {
    // Only count completed achievements
    if (!achievement.isCompleted) continue;

    const points = achievement.points ?? 0;
    allTime += points;

    // Determine completion date (use completedDate if available, otherwise now)
    let completionDate: Date;
    if (achievement.completedDate) {
      // Handle both Timestamp and string formats
      if (typeof achievement.completedDate === 'string') {
        completionDate = new Date(achievement.completedDate);
      } else {
        // Assume it's a Firestore Timestamp
        completionDate = achievement.completedDate.toDate();
      }
    } else {
      // Fallback to now if no completion date
      completionDate = now;
    }

    // Bucket by time period
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