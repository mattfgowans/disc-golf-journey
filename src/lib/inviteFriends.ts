export async function handleInvite() {
  const shareData = {
    title: "Disc Golf Journey",
    text: "I’ve been using Disc Golf Journey to track progress and compete with friends — you should try it.",
    url: "https://disc-golf-journey.vercel.app",
  };

  console.log("Invite triggered");
  setTimeout(() => {
    // optional toast or small state later
  }, 100);

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.error("Share failed:", err);
    }
  } else {
    navigator.clipboard.writeText(shareData.url);
    alert("Link copied! Share it with your friends.");
  }
}
