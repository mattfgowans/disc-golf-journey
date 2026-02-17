"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabKey = "skill" | "social" | "collection";

type Props = {
  skillPercent: number;
  socialPercent: number;
  collectionPercent: number;
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  eligibleThreshold?: number;
};

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function PatchWedgeButton({
  src,
  label,
  percent,
  active,
  eligible,
  onClick,
}: {
  src: string;
  label: string;
  percent: number;
  active: boolean;
  eligible: boolean;
  onClick: () => void;
}) {
  const p = clampPct(percent);
  const coverHeight = 100 - p;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} patch progress ${Math.round(p)}%`}
      className={cn(
        "relative p-0 border-0 bg-transparent outline-none select-none",
        "transition-transform active:scale-[0.98]",
        eligible && "drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]",
        active && "drop-shadow-[0_0_18px_rgba(59,130,246,0.45)]"
      )}
      style={{
        width: 96,
        height: 74,

        // IMPORTANT: mask is applied to THIS element so all children are clipped.
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    >
      {/* Layer 1: the image fills the masked wedge */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "contain",
        }}
      />

      {/* Layer 2: cover that hides the top part (reveals from bottom -> top).
          MUST be absolute inset-x-0 and positioned at top to avoid the "beige bar" bug. */}
      <div
        className="absolute left-0 top-0 right-0 bg-background transition-[height] duration-300 ease-out"
        style={{
          height: `${coverHeight}%`,
        }}
      />

      {/* Optional: subtle border stroke for definition (still clipped by mask) */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
    </button>
  );
}

export function PatchWedgeRow({
  skillPercent,
  socialPercent,
  collectionPercent,
  activeTab,
  onSelectTab,
  eligibleThreshold = 80,
}: Props) {
  const items: Array<{ key: TabKey; label: string; percent: number; src: string }> = [
    { key: "skill", label: "Skill", percent: skillPercent, src: "/patches/skill-wedge.png" },
    { key: "social", label: "Social", percent: socialPercent, src: "/patches/social-wedge.png" },
    { key: "collection", label: "Collection", percent: collectionPercent, src: "/patches/collection-wedge.png" },
  ];

  return (
    <div className="grid grid-cols-3 gap-8 py-3 place-items-center">
      {items.map((it) => {
        const eligible = clampPct(it.percent) >= eligibleThreshold;
        const active = activeTab === it.key;
        return (
          <div key={it.key} className="flex flex-col items-center gap-2">
            <PatchWedgeButton
              src={it.src}
              label={it.label}
              percent={it.percent}
              active={active}
              eligible={eligible}
              onClick={() => onSelectTab(it.key)}
            />
            <div className={cn("text-sm", active ? "text-foreground" : "text-muted-foreground")}>
              {it.label}
            </div>
            {eligible && (
              <div className="text-[11px] tracking-wide text-blue-600 font-semibold">
                ELIGIBLE
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
