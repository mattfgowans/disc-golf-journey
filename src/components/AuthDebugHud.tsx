"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase-auth";
import { useEffect, useState } from "react";

const buildMarker = "BUILD_MARKER_2026-02-18-1";

export function AuthDebugHud() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, loading, redirectError, redirectSettling, lastSignInAttempt } = useAuth();
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleTimeString());

  const show = searchParams.get("debugAuth") === "1";

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] max-w-[280px] rounded border border-amber-500/60 bg-amber-950/95 px-3 py-2 font-mono text-[10px] text-amber-100 shadow-lg">
      <div className="space-y-0.5">
        <div>
          <span className="text-amber-400">build:</span> {buildMarker}
        </div>
        <div>
          <span className="text-amber-400">path:</span> {pathname}
        </div>
        <div>
          <span className="text-amber-400">loading:</span> {String(loading)}
        </div>
        <div>
          <span className="text-amber-400">user:</span>{" "}
          {user ? `${user.uid} / ${user.email ?? "(no email)"}` : "null"}
        </div>
        <div>
          <span className="text-amber-400">time:</span> {timestamp}
        </div>
        <div>
          <span className="text-amber-400">redirectSettling:</span> {String(redirectSettling)}
        </div>
        <div>
          <span className="text-amber-400">redirectError:</span>{" "}
          {redirectError ? (redirectError.length > 120 ? `${redirectError.slice(0, 120)}…` : redirectError) : "(none)"}
        </div>
        <div>
          <span className="text-amber-400">lastSignInAttempt:</span>{" "}
          {lastSignInAttempt ?? "(none)"}
        </div>
      </div>
    </div>
  );
}
