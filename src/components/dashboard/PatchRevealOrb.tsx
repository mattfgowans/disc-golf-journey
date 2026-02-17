"use client";

const PATCH_IMAGE = "/patches/Triple-patch.png";
const ORB_SIZE = 64;

// object-position by segment: skill=top third, social=bottom-left, collection=bottom-right
const SEGMENT_OBJECT_POSITION: Record<"skill" | "social" | "collection", string> = {
  skill: "center 0",
  social: "0 100%",
  collection: "100% 100%",
};

export function PatchRevealOrb({
  percent,
  segment,
  unlockThreshold = 80,
  onUnlockClick,
  isActive,
}: {
  percent: number;
  segment: "skill" | "social" | "collection";
  unlockThreshold?: number;
  onUnlockClick?: () => void;
  isActive?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const isUnlocked = clamped >= unlockThreshold;

  return (
    <button
      type="button"
      onClick={() => isUnlocked && onUnlockClick?.()}
      disabled={!isUnlocked}
      className={`flex flex-col items-center gap-0.5 bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg transition-opacity ${
        isUnlocked ? "cursor-pointer" : "cursor-default opacity-60"
      }`}
    >
      <div
        className={`patch-reveal-orb-container relative overflow-hidden rounded-full flex-shrink-0 border-2 border-dashed border-white/60 ${
          isActive ? "ring-2 ring-primary/30" : ""
        } ${isUnlocked ? "patch-reveal-orb-glow" : ""}`}
        style={{
          width: ORB_SIZE,
          height: ORB_SIZE,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
          {/* Reveal window: rectangle, height = percent%, clips from bottom */}
          <div
            className="absolute left-0 right-0 bottom-0 overflow-hidden transition-all duration-500"
            style={{ height: `${clamped}%`, minHeight: clamped > 0 ? 2 : 0 }}
          >
            {/* Patch image: full orb height, bottom-aligned; segment-specific object-position */}
            <img
              src={PATCH_IMAGE}
              alt="Patch"
              className="absolute bottom-0 left-0 right-0 w-full object-cover"
              style={{
                height: ORB_SIZE,
                objectPosition: SEGMENT_OBJECT_POSITION[segment],
              }}
            />
          </div>
        </div>
    </button>
  );
}
