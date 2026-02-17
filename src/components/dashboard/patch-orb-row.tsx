"use client";

import { PatchRevealOrb } from "./PatchRevealOrb";

export function PatchOrbRow({
  skillPercent,
  socialPercent,
  collectionPercent,
  activeTab,
  onSelectTab,
}: {
  skillPercent: number;
  socialPercent: number;
  collectionPercent: number;
  activeTab: "skill" | "social" | "collection";
  onSelectTab: (tab: "skill" | "social" | "collection") => void;
}) {
  const items: { tab: "skill" | "social" | "collection"; label: string; percent: number }[] = [
    { tab: "skill", label: "Skill", percent: skillPercent },
    { tab: "social", label: "Social", percent: socialPercent },
    { tab: "collection", label: "Collection", percent: collectionPercent },
  ];

  return (
    <div className="patch-orb-row-root grid grid-cols-3 gap-2 px-2 mt-1">
      {items.map(({ tab, label, percent }) => (
        <div key={tab} className="flex flex-col items-center gap-0.5">
          <PatchRevealOrb
            percent={percent}
            segment={tab}
            unlockThreshold={80}
            onUnlockClick={() => onSelectTab(tab)}
            isActive={activeTab === tab}
          />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}

      <style jsx global>{`
        .patch-orb-row-root {
          min-height: 0;
          padding-bottom: 4px;
        }

        .patch-reveal-orb-glow {
          animation: patch-reveal-orb-glow-pulse 2.5s ease-in-out infinite;
        }

        @keyframes patch-reveal-orb-glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 0 0 rgba(59, 130, 246, 0);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 0 10px 3px rgba(59, 130, 246, 0.4);
          }
        }
      `}</style>
    </div>
  );
}
