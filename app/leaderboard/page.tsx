import { Suspense } from "react";
import { LeaderboardClient } from "./LeaderboardClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LeaderboardClient />
    </Suspense>
  );
}
