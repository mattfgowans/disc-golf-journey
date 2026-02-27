"use client";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "CL";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase() || "CL";
}

function getBgFromClubId(clubId: string): string {
  const hash = hashString(clubId);
  const h = hash % 360;
  const s = 55;
  const l = 42;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export type ClubBadgeProps = {
  clubId: string;
  name: string;
  size?: "sm" | "md";
};

export function ClubBadge({ clubId, name, size = "md" }: ClubBadgeProps) {
  const initials = getInitials(name);
  const bg = getBgFromClubId(clubId);

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : "h-10 w-10 text-sm";

  return (
    <div
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${sizeClasses}`}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initials}
    </div>
  );
}
