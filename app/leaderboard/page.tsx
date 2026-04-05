export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { LeaderboardClient } from "./LeaderboardClient";
import PageWrapper from "@/components/layout/page-wrapper";

export default function Page() {
  return (
    <PageWrapper>
      <Suspense fallback={null}>
        <LeaderboardClient />
      </Suspense>
    </PageWrapper>
  );
}
