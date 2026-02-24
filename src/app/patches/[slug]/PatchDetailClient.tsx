"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PATCHES } from "@/lib/patches/patchCatalog";
import { usePatchEligibility } from "@/lib/patches/usePatchEligibility";

const TAB_LABELS: Record<"skill" | "social" | "collection", string> = {
  skill: "Skill",
  social: "Social",
  collection: "Collection",
};

export function PatchDetailClient() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const patch = PATCHES.find((p) => p.slug === slug);

  if (!patch || !["skill", "social", "collection"].includes(slug ?? "")) {
    notFound();
  }

  const { completion, eligibleBySlug, pctToUnlockBySlug } = usePatchEligibility();
  const eligible = eligibleBySlug[patch.tabKey];
  const completionPct = completion[patch.tabKey];
  const roundedPct = Math.round(completionPct);
  const pctToUnlock = pctToUnlockBySlug[patch.tabKey];
  const tabLabel = TAB_LABELS[patch.tabKey];

  return (
    <div className="w-full max-w-2xl mx-auto pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-8">
      <div className="flex justify-start mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/patches">← Back to Patches</Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Hero image */}
        <div className="relative aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-muted shadow-md">
          <Image
            src={patch.imageSrc}
            alt={patch.title}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Title + subtitle */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{patch.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{patch.subtitle}</p>
        </div>

        {/* Status panel */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          {eligible ? (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-sm font-semibold text-blue-600">
                  Eligible
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                You&apos;ve reached 80% mastery. You&apos;re ready to claim this patch!
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{roundedPct}% complete</span>
                <span className="text-muted-foreground">{pctToUnlock}% to unlock</span>
              </div>
              <Progress value={completionPct} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Keep going — you&apos;re almost there!
              </p>
            </>
          )}
        </div>

        {/* How to unlock */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">How to unlock</h3>
          <p className="text-sm">
            Reach 80% completion in the {tabLabel} tab.
          </p>
        </div>

        {/* CTA placeholder */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => {}}
        >
          {eligible ? "Purchase (Coming soon)" : "Preview purchase (Coming soon)"}
        </Button>
      </div>
    </div>
  );
}
