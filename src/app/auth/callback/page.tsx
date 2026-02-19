"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const DEFAULT_RETURN = "/dashboard";

function AuthCallbackContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      if (typeof window === "undefined") return;

      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.error("AUTH CALLBACK: setPersistence failed", e);
      }

      const result = await getRedirectResult(auth);

      if (result?.user) {
        const returnTo =
          (typeof window !== "undefined" && sessionStorage.getItem("dgjauth_return_to")) ||
          DEFAULT_RETURN;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("dgjauth_return_to");
          sessionStorage.removeItem("dgjauth_processing");
        }
        setStatus("success");
        router.replace(returnTo);
      } else {
        setStatus("error");
        setError(
          "No redirect result. This usually means the redirect URI did not match or storage was blocked (e.g. Private Browsing)."
        );
      }
    })();
  }, [router]);

  if (status === "error") {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-4">
        <p className="max-w-md text-center text-sm font-medium text-red-600">
          {error}
        </p>
        <Button onClick={() => router.replace("/login")}>Back to login</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Signing you in…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
