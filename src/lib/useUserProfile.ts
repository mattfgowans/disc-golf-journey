"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserProfile = { username?: string; profile?: { username?: string } };

export function useUserProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(!!uid);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError(null);

      if (!uid) {
        setProfile(null);
        setExists(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setExists(null);

      try {
        const snap = await getDoc(doc(db, "users", uid));

        if (cancelled) return;

        if (!snap.exists()) {
          // User doc truly does not exist
          setExists(false);
          setProfile(null);
          setLoading(false);
          return;
        }

        setExists(true);
        setProfile((snap.data() as UserProfile) ?? null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error("useUserProfile getDoc failed", err);
        setError((err as any)?.code ?? "profile_fetch_failed");
        setProfile(null);
        setExists(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { profile, exists, loading, error };
}
