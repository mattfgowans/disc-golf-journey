"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { PATCHES } from "@/lib/patches/patchCatalog";
import { usePatchEligibility } from "@/lib/patches/usePatchEligibility";
import { PatchCard } from "@/components/patches/PatchCard";
import PageWrapper from "@/components/layout/page-wrapper";

function PatchesPageInner() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const { completion, eligibleBySlug } = usePatchEligibility();
  const total = PATCHES.length;
  const readyCount = PATCHES.filter((p) => eligibleBySlug[p.tabKey]).length;
  const collectionCount = readyCount;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {isPreview && (
        <div className="text-center text-sm text-muted-foreground py-2">
          Sign in to unlock and earn patches
        </div>
      )}
      <div className="text-center mt-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          🏅 Patches
        </h1>

        <p className="text-muted-foreground mt-1">
          Collect premium patches by reaching 80% mastery in each tab
        </p>

        <p className="text-sm text-muted-foreground mt-1">
          {readyCount === total
            ? "Full set ready"
            : `${collectionCount} / 3 patches unlocked`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 items-stretch">
        {PATCHES.map((patch) => (
          <PatchCard
            key={patch.slug}
            patch={patch}
            completionPct={completion[patch.tabKey]}
            eligible={eligibleBySlug[patch.tabKey]}
            href={`/patches/${patch.slug}`}
            isPreview={isPreview}
          />
        ))}
      </div>
    </div>
  );
}

export default function PatchesPage() {
  return (
    <RequireAuth>
      <PageWrapper>
        <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading…</div>}>
          <PatchesPageInner />
        </Suspense>
      </PageWrapper>
    </RequireAuth>
  );
}
