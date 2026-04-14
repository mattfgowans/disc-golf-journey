"use client";

import { UserPlus } from "lucide-react";
import { handleInvite } from "@/lib/inviteFriends";
import { useAchievements } from "@/lib/useAchievements";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievements";
import type { Achievements } from "@/lib/useAchievements";

type HeaderBarProps = {
  center: React.ReactNode;
  right: React.ReactNode;
  left: React.ReactNode | null;
  /** When true, signed-in user — show invite control */
  user: boolean;
  /** Wider left offset for back/custom left when invite is shown */
  leftOffsetForInvite: boolean;
};

export function HeaderBar({
  center,
  right,
  left,
  user,
  leftOffsetForInvite,
}: HeaderBarProps) {
  const { toggleAchievement, achievements } = useAchievements(ACHIEVEMENTS_CATALOG);

  const currentAchievements: Achievements = achievements ?? ACHIEVEMENTS_CATALOG;
  const inviteFriendCompleted =
    currentAchievements.social.find((a) => a.id === "invite_friend")?.isCompleted ?? false;

  const handleInviteClick = () => {
    void handleInvite({
      isInviteFriendCompleted: inviteFriendCompleted,
      onToggleAchievement: (id) => void toggleAchievement("social", id),
    });
  };

  const leftWrapClass =
    leftOffsetForInvite && user
      ? "absolute left-14 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 sm:left-16"
      : "absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 sm:left-6";

  return (
    <div className="relative mx-auto flex h-[60px] w-full max-w-4xl items-center justify-center px-4 sm:px-6">
      {user && (
        <button
          type="button"
          onClick={handleInviteClick}
          className="absolute left-4 rounded-full p-2 text-muted-foreground transition-all duration-100 hover:bg-muted hover:text-foreground active:scale-95"
          aria-label="Invite friends"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      )}

      <div className={leftWrapClass}>{left}</div>

      <div className="min-w-0 max-w-[min(100%,20rem)] px-8 text-center">
        <div className="min-w-0 truncate">
          {typeof center === "string" ? (
            <span className="block truncate font-semibold">{center}</span>
          ) : (
            center
          )}
        </div>
      </div>

      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 sm:right-6">
        {right}
      </div>
    </div>
  );
}
