"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

function PreviewFeatureBlockInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  if (isPreview) {
    return (
      <div className="text-center text-sm text-muted-foreground py-6">
        Sign in to use this feature
      </div>
    );
  }
  return <>{children}</>;
}

export function PreviewFeatureBlock({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-muted-foreground py-6">Loading…</div>
      }
    >
      <PreviewFeatureBlockInner>{children}</PreviewFeatureBlockInner>
    </Suspense>
  );
}
