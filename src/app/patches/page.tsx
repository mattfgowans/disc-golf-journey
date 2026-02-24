"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useMemo, useEffect } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAchievements } from "@/lib/useAchievements";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievements";
import { isAchievementDisabled } from "@/lib/disabledAchievements";
import type { Achievement, Achievements } from "@/lib/useAchievements";

const CATEGORIES = ["skill", "social", "collection"] as const;
type CategoryKey = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  skill: "Skill",
  social: "Social",
  collection: "Collection",
};

function getCompletionPercentage(
  achievements: Achievement[],
  getAchievementCompletionFraction: (a: Achievement) => number
): number {
  if (achievements.length === 0) return 0;
  const totalFraction = achievements.reduce(
    (sum, a) => sum + getAchievementCompletionFraction(a),
    0
  );
  return (totalFraction / achievements.length) * 100;
}

function PatchesPageInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const initialCategory: CategoryKey =
    categoryParam === "skill" || categoryParam === "social" || categoryParam === "collection"
      ? categoryParam
      : "skill";
  const [category, setCategory] = useState<CategoryKey>(initialCategory);

  useEffect(() => {
    const c = searchParams.get("category");
    if (c === "skill" || c === "social" || c === "collection") {
      setCategory(c);
    }
  }, [searchParams]);

  const { achievements } = useAchievements(ACHIEVEMENTS_CATALOG);
  const currentAchievements: Achievements = achievements ?? ACHIEVEMENTS_CATALOG;

  const achievementsForUI = useMemo(
    () => ({
      skill: currentAchievements.skill.filter((a) => !isAchievementDisabled(a.id)),
      social: currentAchievements.social.filter((a) => !isAchievementDisabled(a.id)),
      collection: currentAchievements.collection.filter((a) => !isAchievementDisabled(a.id)),
    }),
    [currentAchievements]
  );

  const getAchievementCompletionFraction = (a: Achievement): number => {
    if (a.kind === "counter") {
      return Math.min(Math.max(a.progress / a.target, 0), 1);
    }
    return a.isCompleted ? 1 : 0;
  };

  const skillCompletion = getCompletionPercentage(
    achievementsForUI.skill,
    getAchievementCompletionFraction
  );
  const socialCompletion = getCompletionPercentage(
    achievementsForUI.social,
    getAchievementCompletionFraction
  );
  const collectionCompletion = getCompletionPercentage(
    achievementsForUI.collection,
    getAchievementCompletionFraction
  );

  const completionByCategory: Record<CategoryKey, number> = {
    skill: skillCompletion,
    social: socialCompletion,
    collection: collectionCompletion,
  };

  const completion = completionByCategory[category];
  const eligible = completion >= 80;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Patches</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Earn patches by reaching 80% mastery in a tab.
      </p>

      <div className="flex gap-2 mt-4 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{CATEGORY_LABELS[category]} Patch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {eligible ? (
              <span className="text-green-600 font-medium">Unlocked</span>
            ) : (
              <span className="text-muted-foreground">
                Locked — reach 80% (currently {Math.round(completion)}%)
              </span>
            )}
          </p>
          <Button
            disabled
            title="Shop coming soon"
            variant="secondary"
            size="sm"
          >
            Buy patch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PatchesPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading…</div>}>
        <PatchesPageInner />
      </Suspense>
    </RequireAuth>
  );
}
