/**
 * Soft-disabled achievements: excluded from completion %, points totals, and UI.
 * Kept in catalog for backward compatibility.
 */

export const DISABLED_ACHIEVEMENT_IDS = new Set<string>([
  "collection-13",
  "collection-14",
  "collection-lost-but-remembered",
]);

export function isAchievementDisabled(id: string): boolean {
  return DISABLED_ACHIEVEMENT_IDS.has(id);
}
