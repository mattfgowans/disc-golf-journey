"use client";

import { Suspense, useEffect } from "react";
import { getRedirectResult, GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const start = searchParams.get("start");

  useEffect(() => {
    (async () => {
      if (start === "1") {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        console.error("AUTH CALLBACK: starting redirect sign-in");
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await getRedirectResult(auth);
      if (result?.user) {
        const { uid, email } = result.user;
        console.error("AUTH CALLBACK: redirect result -> user", { uid, email: email ?? null });
      } else {
        console.error("AUTH CALLBACK: redirect result -> null");
      }
      router.replace("/dashboard");
    })();
  }, [router, start]);

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
