import { toZonedTime } from "date-fns-tz";
import { getISOWeek, getISOWeekYear } from "date-fns";

export const APP_TIMEZONE = "America/Denver";

export function getWeeklyKey(date: Date = new Date()): string {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  const year = getISOWeekYear(zoned);
  const week = String(getISOWeek(zoned)).padStart(2, "0");
  return `${year}-W${week}`;
}