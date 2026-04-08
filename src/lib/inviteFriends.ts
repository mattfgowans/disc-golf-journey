export type HandleInviteOptions = {
  onToggleAchievement?: (id: string) => void;
  /** When true, invite_friend is already completed — skip toggle and success UI */
  isInviteFriendCompleted?: boolean;
  onInviteSuccess?: () => void;
};

export async function handleInvite(options?: HandleInviteOptions) {
  const shareData = {
    title: "Disc Golf Journey",
    text: "I’ve been using Disc Golf Journey to track progress and compete with friends — you should try it.",
    url: "https://disc-golf-journey.vercel.app",
  };

  console.log("Invite triggered");
  setTimeout(() => {
    // optional toast or small state later
  }, 100);

  const afterSuccess = () => {
    if (options?.isInviteFriendCompleted) return;
    options?.onToggleAchievement?.("invite_friend");
    options?.onInviteSuccess?.();
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      afterSuccess();
    } catch (err) {
      console.error("Share failed:", err);
    }
  } else {
    navigator.clipboard.writeText(shareData.url);
    alert("Link copied! Share it with your friends.");
    afterSuccess();
  }
}
