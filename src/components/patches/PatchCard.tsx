"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Patch } from "@/lib/patches/patchCatalog";

export interface PatchCardProps {
  patch: Patch;
  completionPct: number;
  eligible: boolean;
  href: string;
}

export function PatchCard({ patch, completionPct, eligible, href }: PatchCardProps) {
  const remaining = Math.round(Math.max(0, 80 - completionPct));
  const roundedPct = Math.round(completionPct);

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl outline-none transition-all duration-200 active:scale-[0.99]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <Card
        className={cn(
          "overflow-hidden transition-colors hover:bg-muted/30 h-full",
          eligible
            ? "ring-2 ring-primary/35 bg-gradient-to-br from-primary/10 via-background to-background shadow-md"
            : "ring-1 ring-border"
        )}
      >
        <CardContent className="p-3">
          {/* Top row: title + Details affordance */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight">{patch.title}</h3>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Row: image + status */}
          <div className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted/40 p-2 shadow-sm ring-1 ring-border">
              <Image
                src={patch.imageSrc}
                alt={`${patch.title} patch`}
                fill
                sizes="64px"
                className="object-contain"
                priority={eligible}
              />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
              <Badge
                variant={eligible ? "default" : "secondary"}
                className={cn(
                  "w-fit text-[10px]",
                  eligible && "bg-primary text-primary-foreground"
                )}
              >
                {eligible ? "Eligible" : "Locked"}
              </Badge>
              {eligible ? (
                <>
                  <span className="text-xs font-medium text-primary">Unlocked</span>
                  <span className="text-[11px] text-muted-foreground">80% mastery reached</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium">{roundedPct}% complete</span>
                  <Progress value={completionPct} className="h-1.5" />
                  <span className="text-[11px] text-muted-foreground">{remaining}% to unlock</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
