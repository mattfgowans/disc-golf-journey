"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PATCHES } from "@/lib/patches/patchCatalog";
import { usePatchEligibility } from "@/lib/patches/usePatchEligibility";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<"skill" | "social" | "collection", string> = {
  skill: "Skill",
  social: "Social",
  collection: "Collection",
};

const TAB_ROUTE: Record<"skill" | "social" | "collection", string> = {
  skill: "/dashboard",
  social: "/dashboard",
  collection: "/dashboard",
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
    <div className="w-full max-w-2xl mx-auto px-4 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-8">
      <div className="flex justify-start mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/patches">← Back to Patches</Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Hero image - display case */}
        <div
          className={cn(
            "mx-auto max-w-[220px] rounded-3xl p-3",
            "bg-gradient-to-br from-muted/60 via-background to-background",
            "ring-1 ring-border shadow-sm",
            eligible && "shadow-md ring-primary/30"
          )}
        >
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-background/60 ring-1 ring-border">
            <Image
              src={patch.imageSrc}
              alt={patch.title}
              fill
              className="object-contain p-5"
              sizes="220px"
              priority
            />
          </div>
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
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-sm font-semibold text-primary">
                  Eligible
                </span>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                  <Link href={TAB_ROUTE[patch.tabKey]}>Go to {tabLabel}</Link>
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold">Unlocked</p>
                <p className="text-sm text-muted-foreground">
                  80% mastery reached. This patch is ready.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{roundedPct}% complete</span>
                  <span className="text-muted-foreground">{pctToUnlock}% to unlock</span>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                  <Link href={TAB_ROUTE[patch.tabKey]}>Go to {tabLabel}</Link>
                </Button>
              </div>
              <Progress value={completionPct} className="h-2" />
              <p className="text-sm text-muted-foreground">
                You&apos;re close — keep stacking progress.
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

        {/* CTA - Coming soon modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              {eligible ? "Purchase (Coming soon)" : "Preview purchase (Coming soon)"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchasing coming soon</DialogTitle>
              <DialogDescription>
                We&apos;re finishing up checkout for physical patches. For now, you can keep progressing toward unlocks — and you&apos;ll be able to purchase once it&apos;s live.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="w-full">
                <Link href="/patches">Back to Patches</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href={TAB_ROUTE[patch.tabKey]}>Go to {tabLabel}</Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
