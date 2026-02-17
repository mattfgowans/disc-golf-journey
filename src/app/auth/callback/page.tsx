"use client";

import { Suspense, useEffect } from "react";
import {
  getRedirectResult,
  signInWithRedirect,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

async function ensurePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    await setPersistence(auth, browserSessionPersistence);
  }
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startRedirect = searchParams.get("start") === "1";

  useEffect(() => {
    (async () => {
      if (startRedirect) {
        await ensurePersistence();
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await getRedirectResult(auth);
      if (result?.user) {
        const u = result.user;
        console.error("AUTH CALLBACK: redirect result -> user", { uid: u.uid, email: u.email ?? null });
      } else {
        console.error("AUTH CALLBACK: redirect result -> null");
      }
      router.replace("/");
    })();
  }, [router, startRedirect]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
