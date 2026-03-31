"use client";

import { Suspense } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { PATCHES } from "@/lib/patches/patchCatalog";
import { usePatchEligibility } from "@/lib/patches/usePatchEligibility";
import { PatchCard } from "@/components/patches/PatchCard";

function PatchesPageInner() {
  const { completion, eligibleBySlug } = usePatchEligibility();
  const total = PATCHES.length;
  const readyCount = PATCHES.filter((p) => eligibleBySlug[p.tabKey]).length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Patches</h1>
      <div className="mt-1 text-sm text-muted-foreground">
        {readyCount === total ? (
          "Full set ready"
        ) : (
          <>
            Your collection: <span className="font-medium text-foreground">{readyCount}</span> / {total} ready
          </>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-6 mt-2">
        Collect premium patches by reaching 80% mastery in each tab.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 items-stretch">
        {PATCHES.map((patch) => (
          <PatchCard
            key={patch.slug}
            patch={patch}
            completionPct={completion[patch.tabKey]}
            eligible={eligibleBySlug[patch.tabKey]}
            href={`/patches/${patch.slug}`}
          />
        ))}
      </div>
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
