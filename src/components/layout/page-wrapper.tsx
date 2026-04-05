"use client";

import type { ReactNode } from "react";

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="animate-[fadeInSoft_0.6s_ease-out]">
      {children}
    </div>
  );
}
