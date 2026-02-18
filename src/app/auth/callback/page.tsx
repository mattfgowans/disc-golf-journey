"use client";

import { Suspense, useEffect } from "react";
import { getRedirectResult, GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

const startedKey = "dgjauth_redirect_started";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const start = searchParams.get("start");
  const shouldStart = start === "1";
  const startedValue =
    typeof window !== "undefined" ? sessionStorage.getItem(startedKey) : null;

  useEffect(() => {
    (async () => {
      if (shouldStart) {
        if (sessionStorage.getItem(startedKey) === "1") {
          console.error(
            "AUTH CALLBACK: start=1 but already started; NOT redirecting again"
          );
          router.replace("/auth/callback");
          return;
        }
        sessionStorage.setItem(startedKey, "1");
        console.error("AUTH CALLBACK: starting redirect sign-in (one-time)");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await getRedirectResult(auth);
      if (result?.user) {
        const { uid, email } = result.user;
        console.error("AUTH CALLBACK: redirect result -> user", {
          uid,
          email: email ?? null,
        });
      } else {
        console.error("AUTH CALLBACK: redirect result -> null");
      }
      sessionStorage.removeItem(startedKey);
      router.replace("/dashboard");
    })();
  }, [router, shouldStart]);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground">Signing you in…</p>
      <div className="rounded border border-amber-500/40 bg-amber-950/50 px-3 py-2 font-mono text-[10px] text-amber-200">
        <div>Callback page</div>
        <div>
          start: <span className="text-amber-400">{start ?? "(none)"}</span>
        </div>
        <div>
          {startedKey}:{" "}
          <span className="text-amber-400">{startedValue ?? "(none)"}</span>
        </div>
      </div>
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
